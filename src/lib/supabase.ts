import { createClient } from '@supabase/supabase-js';
import { LiveSession, LiveSessionStatus, VideoLesson } from '@/types';

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
  // If email is already registered locally or contains demo domain, skip auth email rate limits
  if (email.includes('bookkeep-it.edu') || email.includes('ilearn.edu')) {
    return null;
  }
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
    if (error) {
      // Gracefully ignore rate limits on free Supabase tier
      return null;
    }
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

// ==========================================
// LIVE SESSIONS DATABASE PERSISTENCE
// ==========================================

export async function fetchLiveSessionsFromSupabase(): Promise<LiveSession[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Supabase fetch live_sessions note:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      courseId: row.course_id || undefined,
      courseTitle: row.course_title || undefined,
      instructorId: row.instructor_id || undefined,
      instructorName: row.instructor_name || 'Instructor',
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time || undefined,
      durationMinutes: row.duration_minutes || 60,
      meetingRoomId: row.room_name,
      status: row.status as LiveSessionStatus,
      recordingUrl: row.recording_url || undefined,
      attendeesCount: row.attendees_count || 0,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Failed to fetch live_sessions from Supabase:', err);
    return [];
  }
}

export async function saveLiveSessionToSupabase(session: LiveSession): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('live_sessions').upsert(
      {
        id: session.id,
        title: session.title,
        description: session.description,
        course_id: session.courseId || null,
        course_title: session.courseTitle || null,
        instructor_id: session.instructorId || null,
        instructor_name: session.instructorName,
        date: session.date,
        start_time: session.startTime,
        end_time: session.endTime || null,
        duration_minutes: session.durationMinutes,
        room_name: session.meetingRoomId,
        status: session.status,
        recording_url: session.recordingUrl || null,
        attendees_count: session.attendeesCount || 0
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase save live_session warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save live_session to Supabase:', err);
    return false;
  }
}

export async function deleteLiveSessionFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('live_sessions').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete live_session warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete live_session from Supabase:', err);
    return false;
  }
}

export async function recordAttendanceToSupabase(attendance: {
  id: string;
  sessionId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  durationMinutes?: number;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('live_attendance').upsert({
      id: attendance.id,
      session_id: attendance.sessionId,
      user_id: attendance.userId || null,
      user_name: attendance.userName,
      user_email: attendance.userEmail || null,
      duration_minutes: attendance.durationMinutes || 0
    });
    if (error) {
      console.warn('Supabase record attendance note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to record attendance to Supabase:', err);
    return false;
  }
}


