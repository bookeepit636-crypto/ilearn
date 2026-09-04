'use client';

import React, { useState, useEffect, useRef } from 'react';
import { isYouTubeUrl, formatYouTubeEmbedUrl, getVideoBlob, saveVideoBlob } from '@/lib/videoStorage';
import { AlertCircle, Film, Upload, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  videoId?: string;
  title?: string;
  className?: string;
  onRelink?: (newUrl: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoId,
  title = 'Video player',
  className = 'w-full h-full',
  onRelink
}) => {
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isRelinking, setIsRelinking] = useState<boolean>(false);
  const objectUrlRef = useRef<string | null>(null);

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
      // 1. Try to load from IndexedDB if videoId is available
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

      // 2. If no IndexedDB record found
      if (!isCancelled) {
        if (src.startsWith('blob:')) {
          // Check if this blob URL is actually alive or revoked
          fetch(src, { method: 'HEAD' })
            .then(() => {
              if (!isCancelled) {
                setActiveUrl(src);
                setIsLoading(false);
              }
            })
            .catch(() => {
              // The blob was revoked by browser refresh
              if (!isCancelled) {
                setHasError(true);
                setIsLoading(false);
              }
            });
        } else {
          // Regular http/https or Cloudinary URL
          setActiveUrl(src);
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

  if (isYouTube) {
    return (
      <iframe
        src={activeUrl}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
          This local video was uploaded in a previous browser session. Select the video file once to save it permanently in your browser storage so it survives all future hard refreshes.
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
    <div className={`relative bg-black flex items-center justify-center ${className}`}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#00b4d8]" />
          <span>Loading video player...</span>
        </div>
      ) : (
        <video
          key={activeUrl}
          src={activeUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        >
          Your browser does not support HTML5 video playback.
        </video>
      )}
    </div>
  );
};
