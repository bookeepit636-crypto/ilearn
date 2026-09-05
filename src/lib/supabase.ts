import { createClient } from '@supabase/supabase-js';
import { VideoLesson } from '@/types';

// Read environment variables with fallback defaults to ensure seamless Vercel production deployment
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbojhxmnoxunvkccyokx.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2poeG1ub3h1bnZrY2N5b2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODI3MzksImV4cCI6MjEwMjk1ODczOX0.yHfOR5JMSyToeEkmF7V5qr1IRTCrXHRP3BDV690XAAE';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// VIDEO DATABASE PERSISTENCE (Shared Cloud Sync)
// ==========================================

export async function fetchVideosFromSupabase(): Promise<VideoLesson[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch videos note:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      topic: row.topic,
      duration: row.duration,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      description: row.description || '',
      keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
      viewsCount: row.views_count || 0
    }));
  } catch (err) {
    console.warn('Failed to fetch videos from Supabase:', err);
    return [];
  }
}

export async function saveVideoToSupabase(video: VideoLesson): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('videos').upsert(
      {
        id: video.id,
        title: video.title,
        topic: video.topic,
        duration: video.duration,
        video_url: video.videoUrl,
        thumbnail_url: video.thumbnailUrl,
        description: video.description,
        key_takeaways: video.keyTakeaways,
        views_count: video.viewsCount || 0
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase save video warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save video to Supabase:', err);
    return false;
  }
}

export async function deleteVideoFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete video warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete video from Supabase:', err);
    return false;
  }
}

// ==========================================
// SUPABASE AUTHENTICATION
// ==========================================

export async function supabaseLogin(email: string, password?: string) {
  if (!isSupabaseConfigured()) return null;
  // Bypass external Supabase Auth network call for demo mock accounts to prevent 400 console logs
  if (email.includes('bookkeep-it.edu') || email.includes('ilearn.edu')) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'student123'
    });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function supabaseRegister(name: string, email: string, password?: string, program?: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || 'student123',
      options: {
        data: {
          name,
          program: program || 'BS Accountancy'
        }
      }
    });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function supabaseLogout() {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

