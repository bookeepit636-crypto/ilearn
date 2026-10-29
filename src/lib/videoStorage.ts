// Client-side IndexedDB persistence for uploaded video files and blobs
// Ensures that uploaded videos survive hard page refreshes and browser restarts without 413 payload limits

const DB_NAME = 'ilearn_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported or running server-side'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a binary video Blob or File into IndexedDB keyed by ID
 */
export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save video to IndexedDB:', err);
  }
}

/**
 * Retrieves a stored video Blob from IndexedDB
 */
export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Removes a video Blob from IndexedDB
 */
export async function deleteVideoBlob(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

/**
 * Helper to check if a URL is a YouTube embed or video link
 */
export function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  );
}

/**
 * Formats YouTube URLs into standard embed URLs
 */
export function formatYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const vidId = url.split('watch?v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${vidId}`;
  }
  if (url.includes('youtu.be/')) {
    const vidId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${vidId}`;
  }
  return url;
}

/**
 * Formats duration in seconds into H:MM:SS or M:SS
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extracts a frame from a local video file to use as thumbnail
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500');
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    let finished = false;
    const cleanup = () => {
      if (!finished) {
        finished = true;
        URL.revokeObjectURL(url);
      }
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.5, (video.duration || 10) * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 640);
        canvas.height = Math.min(video.videoHeight || 360, 360);
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Failed to capture frame from video:', err);
      }
      cleanup();
      resolve('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500');
    };

    video.onerror = () => {
      cleanup();
      resolve('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500');
    };

    setTimeout(() => {
      cleanup();
      resolve('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500');
    }, 4000);
  });
}

