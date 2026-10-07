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

// Auto-expire live sessions where authoritative end_at has been reached
function checkAndAutoExpireSessions(sessions: LiveSession[]): { updated: LiveSession[]; changed: boolean } {
  const nowMs = Date.now();
  let changed = false;

  const updated = sessions.map((s) => {
    if (s.status === 'live' && s.endAt && nowMs >= new Date(s.endAt).getTime()) {
      changed = true;
      const endTimestamp = new Date(s.endAt);
      return {
        ...s,
        status: 'completed' as LiveSessionStatus,
        endedAt: s.endedAt || s.endAt,
        endTime: s.endTime || endTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        updatedAt: new Date().toISOString()
      };
    }
    return s;
  });

  return { updated, changed };
}

// GET /api/live - Returns all live sessions
export async function GET() {
  try {
    const rawSessions = getStore();
    const { updated, changed } = checkAndAutoExpireSessions(rawSessions);
    if (changed) {
      setStore(updated);
    }

    return NextResponse.json(
      { success: true, sessions: updated },
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

      // Check if authoritative end_at has passed
      if (existing.endAt && Date.now() >= new Date(existing.endAt).getTime()) {
        const expiredSession: LiveSession = {
          ...existing,
          status: 'completed',
          endedAt: existing.endedAt || existing.endAt,
          updatedAt: new Date().toISOString()
        };
        const updatedStore = current.map((s) => (s.id === sessionId ? expiredSession : s));
        setStore(updatedStore);

        return NextResponse.json(
          { success: false, error: 'Session duration has expired', status: 'completed' },
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

    // Duration is strictly 40 or 60 (default to 60)
    const duration = session.durationMinutes === 40 || session.durationMinutes === 60 ? session.durationMinutes : 60;
    const now = new Date();

    let startedAt = session.startedAt;
    let endAt = session.endAt;
    let endedAt = session.endedAt;

    if (session.status === 'live') {
      if (!startedAt) {
        startedAt = now.toISOString();
      }
      if (!endAt) {
        endAt = new Date(new Date(startedAt).getTime() + duration * 60000).toISOString();
      }
    } else if (session.status === 'completed') {
      if (!endedAt) {
        endedAt = now.toISOString();
      }
    }

    const actualDate = session.date || (startedAt ? new Date(startedAt).toISOString().split('T')[0] : now.toISOString().split('T')[0]);
    const actualStartTime = session.startTime || (startedAt ? new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const actualEndTime = session.endTime || (endAt ? new Date(endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined);

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
        durationMinutes: duration,
        startedAt: existing.startedAt || startedAt,
        endAt: existing.endAt || endAt,
        endedAt: session.status === 'completed' ? (session.endedAt || endedAt || new Date().toISOString()) : existing.endedAt,
        date: session.date || existing.date,
        startTime: session.startTime || existing.startTime,
        endTime: session.endTime || existing.endTime,
        status: resolvedStatus,
        participants: session.participants || existing.participants || [],
        attendeesCount: (session.participants || existing.participants || []).length,
        updatedAt: new Date().toISOString()
      };
      updated = current.map((s) => (s.id === session.id ? mergedSession : s));
    } else {
      const initialSession: LiveSession = {
        ...session,
        durationMinutes: duration,
        startedAt,
        endAt,
        endedAt,
        date: actualDate,
        startTime: actualStartTime,
        endTime: actualEndTime,
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

    const now = new Date();
    const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const duration = updates.durationMinutes || existing.durationMinutes || 60;

    // Auto-record authoritative start time and calculate end_at if transitioning to live
    let finalStartedAt = updates.startedAt || existing.startedAt;
    let finalEndAt = updates.endAt || existing.endAt;
    let finalStartTime = updates.startTime || existing.startTime;
    let finalEndTime = updates.endTime || existing.endTime;
    let finalEndedAt = updates.endedAt || existing.endedAt;

    if (updates.status === 'live' && existing.status !== 'live') {
      finalStartedAt = now.toISOString();
      finalEndAt = new Date(now.getTime() + duration * 60000).toISOString();
      finalStartTime = nowTime;
      finalEndTime = new Date(now.getTime() + duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Auto-record actual end time if transitioning to completed
    if (updates.status === 'completed') {
      finalEndedAt = now.toISOString();
      if (!finalEndTime) {
        finalEndTime = nowTime;
      }
    }

    const updated = current.map((s) =>
      s.id === id
        ? {
            ...s,
            ...updates,
            durationMinutes: duration,
            startedAt: finalStartedAt,
            endAt: finalEndAt,
            endedAt: finalEndedAt,
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
