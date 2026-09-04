import { createClient } from '@supabase/supabase-js';

// Read environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Authentication Helper Functions
export async function supabaseLogin(email: string, password?: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'student123'
    });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Supabase auth sign-in warning:', e);
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
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Supabase auth sign-up warning:', e);
    return null;
  }
}

export async function supabaseLogout() {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase sign-out warning:', e);
  }
}
