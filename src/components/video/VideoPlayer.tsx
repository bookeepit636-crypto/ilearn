'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  isYouTubeUrl,
  formatYouTubeEmbedUrl,
  getVideoBlob,
  saveVideoBlob,
  formatDuration
} from '@/lib/videoStorage';
import {
  Film,
  Upload,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Gauge,
  Maximize2
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  videoId?: string;
  title?: string;
  className?: string;
  onRelink?: (newUrl: string) => void;
  onDurationChange?: (duration: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoId,
  title = 'Video player',
  className = 'w-full h-full',
  onRelink,
  onDurationChange
}) => {
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isRelinking, setIsRelinking] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const objectUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isYouTube = isYouTubeUrl(src);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    // Clean up any previously created object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (isYouTube) {
      setActiveUrl(formatYouTubeEmbedUrl(src));
      setIsLoading(false);
      return;
    }

    const resolveDirectVideo = async () => {
      // 1. If it's a standard HTTP/HTTPS URL (e.g. Cloudinary or hosted file), use it directly
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        setActiveUrl(src);
        setIsLoading(false);
        return;
      }

      // 2. If it's a local blob URL or videoId is provided, check local IndexedDB cache
      if (videoId) {
        try {
          const blob = await getVideoBlob(videoId);
          if (blob && !isCancelled) {
            const blobUrl = URL.createObjectURL(blob);
            objectUrlRef.current = blobUrl;
            setActiveUrl(blobUrl);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error fetching video from IndexedDB:', err);
        }
      }

      // 3. Fallback check for session blob URLs (using standard GET, as HEAD is unsupported on blob:)
      if (!isCancelled) {
        if (src && src.startsWith('blob:')) {
          fetch(src)
            .then(() => {
              if (!isCancelled) {
                setActiveUrl(src);
                setIsLoading(false);
              }
            })
            .catch(() => {
              if (!isCancelled) {
                setHasError(true);
                setIsLoading(false);
              }
            });
        } else if (src) {
          setActiveUrl(src);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    resolveDirectVideo();

    return () => {
      isCancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, videoId, isYouTube]);

  const handleManualRelink = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRelinking(true);
    try {
      if (videoId) {
        await saveVideoBlob(videoId, file);
      }
      const newBlobUrl = URL.createObjectURL(file);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = newBlobUrl;
      setActiveUrl(newBlobUrl);
      setHasError(false);
      if (onRelink) {
        onRelink(newBlobUrl);
      }
    } catch (err) {
      console.error('Failed to link video file:', err);
    } finally {
      setIsRelinking(false);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (d && !isNaN(d) && onDurationChange) {
      onDurationChange(formatDuration(d));
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
    }
  };

  const changeSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        videoRef.current.requestFullscreen?.();
      }
    }
  };

  if (isYouTube) {
    return (
      <iframe
        src={activeUrl}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center rounded-2xl ${className}`}>
        <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <Film className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">Local Video Session Expired</h3>
        <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
          This local video was uploaded in a previous browser session. Select the video file once to save it permanently in your browser offline storage.
        </p>

        <label className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0077b6] hover:to-[#023e8a] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition">
          <Upload className="w-4 h-4" />
          <span>{isRelinking ? 'Saving...' : 'Re-link Video File'}</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleManualRelink}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className={`group relative bg-black flex items-center justify-center overflow-hidden ${className}`}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#00b4d8]" />
          <span>Loading video player...</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            key={activeUrl}
            src={activeUrl}
            controls
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          >
            Your browser does not support HTML5 video playback.
          </video>

          {/* Floating Quick Action Overlay (Visible on hover on desktop, tap on mobile) */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 text-white shadow-lg">
            <button
              onClick={() => skipTime(-10)}
              title="Rewind 10s"
              className="p-1.5 rounded-lg hover:bg-white/20 text-slate-200 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => skipTime(10)}
              title="Forward 10s"
              className="p-1.5 rounded-lg hover:bg-white/20 text-slate-200 hover:text-white transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                title="Playback Speed"
                className="px-2 py-1 rounded-lg hover:bg-white/20 text-[11px] font-bold text-slate-200 hover:text-white transition flex items-center gap-1"
              >
                <Gauge className="w-3 h-3 text-[#00b4d8]" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute top-full right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl py-1 shadow-2xl z-30 min-w-[70px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`w-full text-left px-3 py-1 text-[11px] font-bold transition flex items-center justify-between ${
                        playbackRate === rate
                          ? 'text-[#00b4d8] bg-cyan-500/10'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <span className="text-[9px]">●</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded-lg hover:bg-white/20 text-slate-200 hover:text-white transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
