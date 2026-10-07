import { NextResponse } from 'next/server';
import { LiveSession } from '@/types';
import { initialLiveSessions } from '@/lib/mockData';

// Global in-memory live sessions store shared across API calls in the Node/Next runtime
// This guarantees instant synchronization between Admin and Students even before
// or alongside Supabase database synchronization.
declare global {
  // eslint-disable-next-line no-var
  var __liveSessionsStore: LiveSession[] | undefined;
}

function getStore(): LiveSession[] {
  if (!globalThis.__liveSessionsStore) {
    globalThis.__liveSessionsStore = [...initialLiveSessions];
  }
  return globalThis.__liveSessionsStore;
}

function setStore(sessions: LiveSession[]) {
  globalThis.__liveSessionsStore = sessions;
}

// GET /api/live - Returns all live sessions
export async function GET() {
  try {
    const sessions = getStore();
    return NextResponse.json(
      { success: true, sessions },
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

// POST /api/live - Create or upsert a live session
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = body.session as LiveSession;

    if (!session || !session.id || !session.title) {
      return NextResponse.json({ success: false, error: 'Invalid session data' }, { status: 400 });
    }

    const current = getStore();
    const index = current.findIndex((s) => s.id === session.id);

    let updated: LiveSession[];
    if (index >= 0) {
      updated = current.map((s) => (s.id === session.id ? { ...s, ...session } : s));
    } else {
      updated = [session, ...current];
    }

    setStore(updated);

    return NextResponse.json({ success: true, session, sessions: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT /api/live - Update session status or details
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body as { id: string; updates: Partial<LiveSession> };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing session ID' }, { status: 400 });
    }

    const current = getStore();
    const updated = current.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );

    setStore(updated);
    const session = updated.find((s) => s.id === id);

    return NextResponse.json({ success: true, session, sessions: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE /api/live?id=... - Delete a session
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing session ID' }, { status: 400 });
    }

    const current = getStore();
    const updated = current.filter((s) => s.id !== id);
    setStore(updated);

    return NextResponse.json({ success: true, sessions: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
