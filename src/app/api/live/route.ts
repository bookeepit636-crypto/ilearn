import { NextResponse } from 'next/server';
import { LiveSession, LiveSessionParticipant, LiveSessionStatus } from '@/types';

// Global in-memory live sessions store shared across API calls in the Node/Next runtime.
// Ensures 100% real-time synchronization between Admin and Students with zero mock data.
declare global {
  // eslint-disable-next-line no-var
  var __liveSessionsStore: LiveSession[] | undefined;
}

function isTerminal(status?: LiveSessionStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

function getStore(): LiveSession[] {
  if (!globalThis.__liveSessionsStore) {
    globalThis.__liveSessionsStore = [];
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

// POST /api/live - Create session, upsert session, or record student participant
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Participant Join Action
    if (body.action === 'join') {
      const { sessionId, participant } = body as {
        sessionId: string;
        participant: LiveSessionParticipant;
      };

      if (!sessionId || !participant || !participant.userName) {
        return NextResponse.json({ success: false, error: 'Invalid join payload' }, { status: 400 });
      }

      const current = getStore();
      const existing = current.find((s) => s.id === sessionId);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      // Check if session has ended or been cancelled
      if (isTerminal(existing.status)) {
        return NextResponse.json(
          { success: false, error: 'Session has already ended or been cancelled', status: existing.status },
          { status: 403 }
        );
      }

      const participantsList = existing.participants || [];
      const alreadyJoinedIndex = participantsList.findIndex(
        (p) => (p.userId && p.userId === participant.userId) || p.userName === participant.userName
      );

      let updatedParticipants: LiveSessionParticipant[];
      if (alreadyJoinedIndex >= 0) {
        updatedParticipants = participantsList.map((p, idx) =>
          idx === alreadyJoinedIndex ? { ...p, ...participant, leftAt: undefined } : p
        );
      } else {
        updatedParticipants = [...participantsList, participant];
      }

      const updatedSession: LiveSession = {
        ...existing,
        participants: updatedParticipants,
        attendeesCount: updatedParticipants.length,
        updatedAt: new Date().toISOString()
      };

      const updatedStore = current.map((s) => (s.id === sessionId ? updatedSession : s));
      setStore(updatedStore);

      return NextResponse.json({ success: true, session: updatedSession, sessions: updatedStore });
    }

    // 2. Participant Leave Action
    if (body.action === 'leave') {
      const { sessionId, userId, userName } = body as {
        sessionId: string;
        userId?: string;
        userName: string;
      };

      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Invalid leave payload' }, { status: 400 });
      }

      const current = getStore();
      const existing = current.find((s) => s.id === sessionId);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      const participantsList = existing.participants || [];
      const updatedParticipants = participantsList.map((p) => {
        if ((userId && p.userId === userId) || (userName && p.userName === userName)) {
          return {
            ...p,
            leftAt: new Date().toISOString(),
            attendanceStatus: 'left' as const
          };
        }
        return p;
      });

      const updatedSession: LiveSession = {
        ...existing,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString()
      };

      const updatedStore = current.map((s) => (s.id === sessionId ? updatedSession : s));
      setStore(updatedStore);

      return NextResponse.json({ success: true, session: updatedSession, sessions: updatedStore });
    }

    // 3. Regular Upsert Session
    const session = body.session as LiveSession;

    if (!session || !session.id || !session.title) {
      return NextResponse.json({ success: false, error: 'Invalid session data' }, { status: 400 });
    }

    const current = getStore();
    const index = current.findIndex((s) => s.id === session.id);

    let updated: LiveSession[];
    if (index >= 0) {
      const existing = current[index];
      // Prevent reversing terminal state
      let resolvedStatus = session.status;
      if (isTerminal(existing.status) && !isTerminal(session.status)) {
        resolvedStatus = existing.status;
      }

      const mergedSession: LiveSession = {
        ...existing,
        ...session,
        status: resolvedStatus,
        participants: session.participants || existing.participants || [],
        attendeesCount: (session.participants || existing.participants || []).length,
        updatedAt: new Date().toISOString()
      };
      updated = current.map((s) => (s.id === session.id ? mergedSession : s));
    } else {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const initialSession: LiveSession = {
        ...session,
        startTime: session.status === 'live' && !session.startTime ? nowStr : session.startTime,
        participants: session.participants || [],
        attendeesCount: (session.participants || []).length,
        createdAt: session.createdAt || new Date().toISOString()
      };
      updated = [initialSession, ...current];
    }

    setStore(updated);
    const saved = updated.find((s) => s.id === session.id);

    return NextResponse.json({ success: true, session: saved, sessions: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT /api/live - Update session status or details with strict state permanence
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body as { id: string; updates: Partial<LiveSession> };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing session ID' }, { status: 400 });
    }

    const current = getStore();
    const existing = current.find((s) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Terminal State Enforcer: Once Completed or Cancelled, it CANNOT revert to Live or Scheduled
    if (isTerminal(existing.status) && (updates.status === 'live' || updates.status === 'scheduled')) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change status from ${existing.status} back to ${updates.status}. Terminal state is permanent.`,
          session: existing
        },
        { status: 400 }
      );
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // Auto-record actual start time if transitioning to live
    let finalStartTime = updates.startTime || existing.startTime;
    if (updates.status === 'live' && !updates.startTime && existing.status !== 'live') {
      finalStartTime = nowTime;
    }

    // Auto-record actual end time if transitioning to completed
    let finalEndTime = updates.endTime || existing.endTime;
    if (updates.status === 'completed' && !updates.endTime) {
      finalEndTime = nowTime;
    }

    const updated = current.map((s) =>
      s.id === id
        ? {
            ...s,
            ...updates,
            startTime: finalStartTime,
            endTime: finalEndTime,
            updatedAt: new Date().toISOString()
          }
        : s
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
