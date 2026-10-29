import { NextResponse } from 'next/server';
import { VideoLesson } from '@/types';
import { initialVideos } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

declare global {
  // eslint-disable-next-line no-var
  var __videosStore: VideoLesson[] | undefined;
}

function getVideosStore(): VideoLesson[] {
  if (!globalThis.__videosStore) {
    globalThis.__videosStore = [...initialVideos];
  }
  return globalThis.__videosStore;
}

function setVideosStore(videos: VideoLesson[]) {
  globalThis.__videosStore = videos;
}

// GET /api/videos
export async function GET() {
  try {
    let store = getVideosStore();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const map = new Map<string, VideoLesson>();
          store.forEach((v) => map.set(v.id, v));
          data.forEach((row: any) => {
            map.set(row.id, {
              id: row.id,
              title: row.title,
              topic: row.topic,
              duration: row.duration,
              videoUrl: row.video_url,
              thumbnailUrl: row.thumbnail_url,
              description: row.description || '',
              keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
              viewsCount: row.views_count || 0,
              courseId: row.course_id || undefined,
              lessonId: row.lesson_id || undefined,
              createdAt: row.created_at
            });
          });
          store = Array.from(map.values());
          setVideosStore(store);
        }
      } catch (err) {
        console.warn('Supabase fetch videos API note:', err);
      }
    }

    return NextResponse.json(
      { success: true, videos: store },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST /api/videos - Create or Upsert video
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const video = (body.video || body) as VideoLesson;

    if (!video || !video.title) {
      return NextResponse.json({ success: false, error: 'Video title is required.' }, { status: 400 });
    }

    if (!video.videoUrl) {
      return NextResponse.json({ success: false, error: 'Video URL or file is required.' }, { status: 400 });
    }

    const completeVideo: VideoLesson = {
      id: video.id || `vid-${Date.now()}`,
      title: video.title.trim(),
      topic: video.topic ? video.topic.trim() : 'Basic Accounting Principles',
      duration: video.duration || '15:00',
      videoUrl: video.videoUrl,
      thumbnailUrl:
        video.thumbnailUrl ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
      description: video.description ? video.description.trim() : 'Instructional bookkeeping lecture.',
      keyTakeaways: Array.isArray(video.keyTakeaways) && video.keyTakeaways.length > 0
        ? video.keyTakeaways
        : [`Key lesson points for ${video.title}`, 'Practical bookkeeping examples'],
      viewsCount: video.viewsCount || 0,
      courseId: video.courseId || undefined,
      lessonId: video.lessonId || undefined,
      createdAt: video.createdAt || new Date().toISOString()
    };

    const currentStore = getVideosStore();
    const existingIndex = currentStore.findIndex((v) => v.id === completeVideo.id);

    let updatedStore: VideoLesson[];
    if (existingIndex >= 0) {
      updatedStore = currentStore.map((v) => (v.id === completeVideo.id ? completeVideo : v));
    } else {
      updatedStore = [completeVideo, ...currentStore];
    }
    setVideosStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('videos').upsert(
          {
            id: completeVideo.id,
            title: completeVideo.title,
            course_id: completeVideo.courseId,
            lesson_id: completeVideo.lessonId,
            topic: completeVideo.topic,
            duration: completeVideo.duration,
            video_url: completeVideo.videoUrl,
            thumbnail_url: completeVideo.thumbnailUrl,
            description: completeVideo.description,
            key_takeaways: completeVideo.keyTakeaways,
            views_count: completeVideo.viewsCount
          },
          { onConflict: 'id' }
        );
        if (error) console.warn('Supabase upsert video note:', error.message);
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, video: completeVideo, videos: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT /api/videos - Update existing video
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body as { id: string; updates: Partial<VideoLesson> };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing video id' }, { status: 400 });
    }

    const currentStore = getVideosStore();
    const existing = currentStore.find((v) => v.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
    }

    const updatedVideo: VideoLesson = {
      ...existing,
      ...updates,
      id
    };

    const updatedStore = currentStore.map((v) => (v.id === id ? updatedVideo : v));
    setVideosStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('videos').upsert(
          {
            id: updatedVideo.id,
            title: updatedVideo.title,
            course_id: updatedVideo.courseId,
            lesson_id: updatedVideo.lessonId,
            topic: updatedVideo.topic,
            duration: updatedVideo.duration,
            video_url: updatedVideo.videoUrl,
            thumbnail_url: updatedVideo.thumbnailUrl,
            description: updatedVideo.description,
            key_takeaways: updatedVideo.keyTakeaways,
            views_count: updatedVideo.viewsCount
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, video: updatedVideo, videos: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE /api/videos?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing video id' }, { status: 400 });
    }

    const currentStore = getVideosStore();
    const updatedStore = currentStore.filter((v) => v.id !== id);
    setVideosStore(updatedStore);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('videos').delete().eq('id', id);
      } catch (e) {
        // silent fallback
      }
    }

    return NextResponse.json({ success: true, videos: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
