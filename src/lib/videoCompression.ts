// In-Browser Client-Side Video Compressor
// Reduces large MP4 / video files down to small MBs before uploading to Cloudinary
// Preserves audio, scales resolution to 720p HD, and encodes with optimized bitrate.

export interface CompressionOptions {
  maxDimension?: number; // max width or height, default 1280 (720p)
  videoBitrate?: number; // target video bitrate in bps, default 1.2 Mbps (1,200,000)
  audioBitrate?: number; // target audio bitrate in bps, default 96 kbps (96,000)
  targetFps?: number; // default 24
  playbackRate?: number; // speed up transcoding, default 2.0
  thresholdSizeMb?: number; // only compress if file size > this threshold, default 25MB
  onProgress?: (percent: number, message: string) => void;
}

export interface CompressionResult {
  file: File;
  originalSizeMb: number;
  compressedSizeMb: number;
  savingsPercent: number;
  isCompressed: boolean;
  durationSeconds: number;
}

/**
 * Detects the best supported MediaRecorder MIME type for video encoding in the current browser
 */
export function getSupportedVideoMimeType(): string {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return 'video/webm';
  }

  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

/**
 * Compresses an MP4 or video file in the browser using HTML5 Canvas + Web Audio API + MediaRecorder.
 * If the file is already small (<= thresholdSizeMb) or if compression isn't supported, returns the original file.
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSizeMb = file.size / (1024 * 1024);
  const thresholdMb = options.thresholdSizeMb ?? 25;

  // If already under threshold, no compression needed
  if (originalSizeMb <= thresholdMb) {
    return {
      file,
      originalSizeMb,
      compressedSizeMb: originalSizeMb,
      savingsPercent: 0,
      isCompressed: false,
      durationSeconds: 0
    };
  }

  // Ensure browser APIs exist
  if (
    typeof window === 'undefined' ||
    !window.MediaRecorder ||
    !window.HTMLVideoElement ||
    !window.HTMLCanvasElement
  ) {
    console.warn('Browser does not support MediaRecorder/Canvas video processing. Using original file.');
    return {
      file,
      originalSizeMb,
      compressedSizeMb: originalSizeMb,
      savingsPercent: 0,
      isCompressed: false,
      durationSeconds: 0
    };
  }

  const maxDim = options.maxDimension || 1280;
  const targetBitrate = options.videoBitrate || 1_200_000; // 1.2 Mbps
  const targetFps = options.targetFps || 24;
  const playbackSpeed = options.playbackRate || 2.0;

  options.onProgress?.(5, 'Preparing video compressor...');

  return new Promise<CompressionResult>((resolve) => {
    let hasResolved = false;
    let videoUrl = '';
    let animFrameId: number | null = null;
    let audioCtx: AudioContext | null = null;

    const cleanupAndResolve = (result: CompressionResult) => {
      if (hasResolved) return;
      hasResolved = true;

      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      resolve(result);
    };

    // Safety timeout: if compression takes longer than 90 seconds, fallback safely
    const timeoutTimer = setTimeout(() => {
      console.warn('Video compression timed out after 90s, using original file.');
      cleanupAndResolve({
        file,
        originalSizeMb,
        compressedSizeMb: originalSizeMb,
        savingsPercent: 0,
        isCompressed: false,
        durationSeconds: 0
      });
    }, 90000);

    try {
      videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.muted = false; // Audio track needed for Web Audio extraction
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration || 1;
          const origWidth = video.videoWidth || 1280;
          const origHeight = video.videoHeight || 720;

          // Calculate scaled 720p dimensions keeping aspect ratio
          let targetWidth = origWidth;
          let targetHeight = origHeight;

          if (origWidth > maxDim || origHeight > maxDim) {
            if (origWidth >= origHeight) {
              targetWidth = maxDim;
              targetHeight = Math.round((origHeight * maxDim) / origWidth);
            } else {
              targetHeight = maxDim;
              targetWidth = Math.round((origWidth * maxDim) / origHeight);
            }
          }

          // Make dimensions even numbers (required by video codecs)
          targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
          targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { alpha: false });

          if (!ctx) {
            throw new Error('Canvas 2D context not available');
          }

          options.onProgress?.(10, `Optimizing resolution to ${targetWidth}x${targetHeight}...`);

          // 1. Capture visual stream from canvas
          const canvasStream = canvas.captureStream ? canvas.captureStream(targetFps) : (canvas as any).mozCaptureStream?.(targetFps);
          if (!canvasStream) {
            throw new Error('Canvas captureStream not supported');
          }

          // 2. Capture and mix audio stream without playing out loud to user speakers
          let combinedStream = canvasStream;
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              audioCtx = new AudioContextClass();
              const sourceNode = audioCtx.createMediaElementSource(video);
              const destNode = audioCtx.createMediaStreamDestination();
              sourceNode.connect(destNode);
              // Notice: We do NOT connect to audioCtx.destination, so the student does not hear squeaky high-speed audio

              const audioTracks = destNode.stream.getAudioTracks();
              if (audioTracks.length > 0) {
                combinedStream = new MediaStream([
                  ...canvasStream.getVideoTracks(),
                  ...audioTracks
                ]);
              }
            }
          } catch (audioErr) {
            console.warn('Audio capture bypassed:', audioErr);
          }

          // 3. Setup MediaRecorder with best mimeType
          const mimeType = getSupportedVideoMimeType();
          const recorderOptions: MediaRecorderOptions = {
            mimeType,
            videoBitsPerSecond: targetBitrate
          };

          const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
          const recordedChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            clearTimeout(timeoutTimer);
            const mime = mediaRecorder.mimeType || 'video/webm';
            const blob = new Blob(recordedChunks, { type: mime });
            const compressedSizeMb = blob.size / (1024 * 1024);
            const savingsPercent = Math.max(0, Math.round(((originalSizeMb - compressedSizeMb) / originalSizeMb) * 100));

            // Determine file extension based on mimeType
            const isMp4 = mime.includes('mp4');
            const ext = isMp4 ? '.mp4' : '.webm';
            const originalBase = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${originalBase}-compressed${ext}`;

            // If compressed blob is smaller, return it as File; otherwise use original
            if (blob.size < file.size && blob.size > 1000) {
              const compressedFile = new File([blob], newFileName, { type: mime });
              options.onProgress?.(
                100,
                `Compressed from ${originalSizeMb.toFixed(1)}MB to ${compressedSizeMb.toFixed(1)}MB (${savingsPercent}% saved!)`
              );
              cleanupAndResolve({
                file: compressedFile,
                originalSizeMb,
                compressedSizeMb,
                savingsPercent,
                isCompressed: true,
                durationSeconds: duration
              });
            } else {
              console.log('Compressed size not smaller than original. Using original.');
              cleanupAndResolve({
                file,
                originalSizeMb,
                compressedSizeMb: originalSizeMb,
                savingsPercent: 0,
                isCompressed: false,
                durationSeconds: duration
              });
            }
          };

          // 4. Begin playback and frame drawing
          try {
            video.playbackRate = playbackSpeed;
          } catch {
            video.playbackRate = 1.0;
          }

          mediaRecorder.start(250); // Record chunks every 250ms
          await video.play();

          const renderFrame = () => {
            if (video.paused || video.ended) return;

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

            // Calculate progress (from 15% to 95%)
            const currentPct = Math.min(95, Math.round(15 + (video.currentTime / duration) * 80));
            options.onProgress?.(
              currentPct,
              `Compressing video: ${Math.round(video.currentTime)}s / ${Math.round(duration)}s (${currentPct}%)`
            );

            animFrameId = requestAnimationFrame(renderFrame);
          };

          animFrameId = requestAnimationFrame(renderFrame);

          video.onended = () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          };

          video.onerror = (err) => {
            console.warn('Video playback error during compression:', err);
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            } else {
              cleanupAndResolve({
                file,
                originalSizeMb,
                compressedSizeMb: originalSizeMb,
                savingsPercent: 0,
                isCompressed: false,
                durationSeconds: 0
              });
            }
          };
        } catch (innerErr) {
          console.warn('Error starting compression pipeline:', innerErr);
          cleanupAndResolve({
            file,
            originalSizeMb,
            compressedSizeMb: originalSizeMb,
            savingsPercent: 0,
            isCompressed: false,
            durationSeconds: 0
          });
        }
      };

      video.onerror = (e) => {
        console.warn('Video failed to load for compression:', e);
        cleanupAndResolve({
          file,
          originalSizeMb,
          compressedSizeMb: originalSizeMb,
          savingsPercent: 0,
          isCompressed: false,
          durationSeconds: 0
        });
      };
    } catch (outerErr) {
      console.warn('Unexpected error in compressVideo:', outerErr);
      cleanupAndResolve({
        file,
        originalSizeMb,
        compressedSizeMb: originalSizeMb,
        savingsPercent: 0,
        isCompressed: false,
        durationSeconds: 0
      });
    }
  });
}

