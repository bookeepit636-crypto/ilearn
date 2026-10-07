'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Play,
  Radio,
  Users,
  XCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LiveSession } from '@/types';
import { recordAttendanceToSupabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Dynamically import the Jitsi classroom (browser-only)
const JitsiClassroom = dynamic(
  () => import('@/components/live/JitsiClassroom'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70 text-sm font-medium">Loading classroom...</p>
        </div>
      </div>
    )
  }
);

type PageState = 'loading' | 'waiting' | 'prejoin' | 'live' | 'completed' | 'cancelled' | 'not-found' | 'unauthorized';

function PreJoinScreen({
  session,
  user,
  onJoin
}: {
  session: LiveSession;
  user: { name: string; role: string };
  onJoin: () => void;
}) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-200 mb-3">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Ready to join?</h2>
          <p className="text-sm text-slate-500 font-medium line-clamp-1">{session.title}</p>
        </div>

        {/* Session Info */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
          {session.courseTitle && (
            <div className="flex items-center gap-2 text-slate-600">
              <BookOpen className="w-3.5 h-3.5 text-[#0077b6]" />
              <span className="font-semibold text-[#0077b6]">{session.courseTitle}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            {session.date} at {session.startTime}
            {session.endTime ? ` – ${session.endTime}` : ` · ${session.durationMinutes} min`}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-3.5 h-3.5" />
            Instructor: <span className="font-bold text-slate-700">{session.instructorName}</span>
          </div>
        </div>

        {/* Device Controls */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Devices</p>
          <div className="flex items-center gap-3">
            <button
              id="prejoin-toggle-mic"
              onClick={() => setMicOn((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                micOn
                  ? 'bg-green-50 text-green-700 border-2 border-green-300'
                  : 'bg-slate-100 text-slate-500 border-2 border-slate-200'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {micOn ? 'Mic On' : 'Mic Off'}
            </button>
            <button
              id="prejoin-toggle-cam"
              onClick={() => setCamOn((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                camOn
                  ? 'bg-green-50 text-green-700 border-2 border-green-300'
                  : 'bg-slate-100 text-slate-500 border-2 border-slate-200'
              }`}
            >
              {camOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              {camOn ? 'Camera On' : 'Camera Off'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            You can adjust mic and camera after joining using the in-class controls.
          </p>
        </div>

        {/* User Identity */}
        <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-xs text-slate-600">
          Joining as <span className="font-extrabold text-[#0077b6]">{user.name}</span>
          {user.role === 'admin' ? ' (Instructor)' : ' (Student)'}
        </div>

        {/* Join CTA */}
        <button
          id="prejoin-join-btn"
          onClick={onJoin}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white font-extrabold text-sm shadow-lg shadow-cyan-200 hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          <Play className="w-5 h-5" />
          Join Live Class
        </button>
      </div>
    </div>
  );
}

export default function LiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, liveSessions, updateLiveSession } = useApp();

  const sessionId = params?.sessionId as string;
  const [session, setSession] = useState<LiveSession | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [hasJoined, setHasJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const joinTimeRef = useRef<string | null>(null);

  // Resolve session from context
  useEffect(() => {
    if (!sessionId) {
      setPageState('not-found');
      return;
    }
    const found = liveSessions.find((s) => s.id === sessionId);
    if (!found) {
      setPageState('not-found');
      return;
    }
    setSession(found);

    switch (found.status) {
      case 'scheduled':
        setPageState('waiting');
        break;
      case 'live':
        // Proceed directly into the video classroom like Google Meet / Zoom
        setPageState('live');
        break;
      case 'completed':
        setPageState('completed');
        break;
      case 'cancelled':
        setPageState('cancelled');
        break;
      default:
        setPageState('not-found');
    }
  }, [sessionId, liveSessions]);

  // Handle confirmed classroom entry (attendance tracking)
  const handleJoined = useCallback(() => {
    joinTimeRef.current = new Date().toISOString();
    setHasJoined(true);
    // Increment attendees count in session state
    if (session) {
      updateLiveSession(session.id, {
        attendeesCount: (session.attendeesCount ?? 0) + 1
      });
      // Record attendance to Supabase Cloud
      recordAttendanceToSupabase({
        id: `att-${session.id}-${Date.now()}`,
        sessionId: session.id,
        userName: user?.name || 'Student',
        userEmail: user?.email,
        durationMinutes: session.durationMinutes || 60
      });
    }
  }, [session, updateLiveSession, user]);

  const handleLeft = useCallback(() => {
    // When a participant leaves we could record left_at. For now just navigate back.
    router.push('/live');
  }, [router]);

  const handleParticipantJoined = useCallback(() => {
    setParticipantCount((c) => c + 1);
  }, []);

  const handleParticipantLeft = useCallback(() => {
    setParticipantCount((c) => Math.max(0, c - 1));
  }, []);

  // Instructor: start a session from waiting state
  const handleStartSession = useCallback(() => {
    if (!session) return;
    updateLiveSession(session.id, { status: 'live' });
    setPageState('live');
  }, [session, updateLiveSession]);

  // Instructor: end session
  const handleEndSession = useCallback(() => {
    if (!session) return;
    updateLiveSession(session.id, { status: 'completed' });
    router.push('/live');
  }, [session, updateLiveSession, router]);

  /* ------------------------------------------------------------------ */
  /*  RENDER STATES                                                       */
  /* ------------------------------------------------------------------ */

  if (pageState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageState === 'not-found') {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="card-theme bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-800">Session Not Found</h2>
          <p className="text-xs text-slate-500">This live class does not exist or has been removed.</p>
          <div className="pt-2">
            <Link
              href="/live"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Live Classes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (pageState === 'cancelled') {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="card-theme bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-800">Session Cancelled</h2>
          <p className="text-xs text-slate-500">{session.title} has been cancelled.</p>
          <div className="pt-2">
            <Link
              href="/live"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Live Classes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'completed') {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="card-theme bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-xl">
          {/* Status Badge & Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 tracking-wider">
              Session Completed
            </span>
            <h2 className="text-xl font-black text-slate-800 pt-1.5">{session.title}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {session.date} · {session.startTime}{session.endTime ? ` – ${session.endTime}` : ''}
            </p>
          </div>

          {/* Session Details */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 text-left">
            {session.courseTitle && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 font-semibold">Course:</span>
                <span className="font-bold text-[#0077b6]">{session.courseTitle}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-semibold">Instructor:</span>
              <span className="font-bold text-slate-700">{session.instructorName}</span>
            </div>
            {session.attendeesCount !== undefined && session.attendeesCount > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 font-semibold">Attended:</span>
                <span className="font-bold text-slate-700">{session.attendeesCount} students</span>
              </div>
            )}
          </div>

          {session.recordingUrl && (
            <div className="space-y-2 text-left">
              <p className="text-xs font-bold text-slate-700">Class Replay:</p>
              <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-md">
                <iframe
                  src={session.recordingUrl}
                  title="Session Recording"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* ONLY 1 CLEAR BACK BUTTON */}
          <div className="pt-2">
            <Link
              href="/live"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-extrabold text-xs shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Live Classes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'waiting') {
    return (
      <div className="w-full h-full min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="card-theme bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 max-w-lg w-full text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto border border-cyan-100">
            <Clock className="w-7 h-7 text-[#0077b6]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 tracking-wider">
              Upcoming Class
            </span>
            <h2 className="font-black text-slate-800 text-xl pt-1.5">{session.title}</h2>
            <p className="text-xs text-slate-500 font-medium">{session.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-left bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <p className="text-slate-400 font-semibold text-[11px]">Date</p>
              <p className="font-bold text-slate-700">{session.date}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold text-[11px]">Time</p>
              <p className="font-bold text-slate-700">{session.startTime} – {session.endTime || `+${session.durationMinutes}m`}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold text-[11px]">Instructor</p>
              <p className="font-bold text-[#0077b6]">{session.instructorName}</p>
            </div>
            {session.courseTitle && (
              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Course</p>
                <p className="font-bold text-slate-700">{session.courseTitle}</p>
              </div>
            )}
          </div>

          {/* Admin-only: Start Session button */}
          {user.role === 'admin' ? (
            <button
              id="start-session-btn"
              onClick={handleStartSession}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold text-xs shadow-md shadow-red-500/25 hover:shadow-lg transition-all active:scale-95"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Start Live Class & Enter</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-[#0077b6] font-medium">
              Class has not started yet. You will enter automatically as soon as the instructor starts.
            </div>
          )}

          {/* 1 Back Button */}
          <div className="pt-1">
            <Link
              href="/live"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Live Classes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'prejoin') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Back nav + session info header */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <Link href="/live" className="text-slate-400 hover:text-slate-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
              <h1 className="text-base font-black text-slate-800 truncate">{session.title}</h1>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {session.courseTitle && <><span className="font-semibold text-[#0077b6]">{session.courseTitle}</span> · </>}
              {session.instructorName}
            </p>
          </div>
          {/* Instructor controls */}
          {user.role === 'admin' && (
            <button
              id="end-session-btn"
              onClick={handleEndSession}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold text-xs hover:bg-red-100 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              End Session
            </button>
          )}
        </div>

        {/* Pre-join screen before confirming entry */}
        <PreJoinScreen
          session={session}
          user={{ name: user.name, role: user.role }}
          onJoin={() => setPageState('live')}
        />
      </div>
    );
  }

  // ----------------------------------------------------------------
  // LIVE CLASSROOM VIEW
  // ----------------------------------------------------------------
  return (
    <div className="flex-1 w-full h-[100dvh] flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Session top bar */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 bg-slate-900 border-b border-white/10 text-white shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/live"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition"
            title="Leave Meeting"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm shadow-red-500/50">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-md">{session.title}</span>
            </div>
            <p className="text-white/60 text-[10px] sm:text-[11px] truncate">
              {session.instructorName}
              {session.courseTitle ? ` · ${session.courseTitle}` : ''}
              {participantCount > 0 ? ` · ${participantCount + 1} connected` : ''}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {user.role === 'admin' ? (
            <button
              id="live-end-session-btn"
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>End for All</span>
            </button>
          ) : (
            <button
              id="live-leave-session-btn"
              onClick={handleLeft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Jitsi Classroom fills remaining height */}
      <div className="flex-1 w-full h-full min-h-0 relative flex flex-col bg-slate-950">
        <JitsiClassroom
          roomName={session.meetingRoomId}
          displayName={user.name}
          userEmail={user.email}
          isInstructor={user.role === 'admin'}
          sessionTitle={session.title}
          onJoined={handleJoined}
          onLeft={handleLeft}
          onParticipantJoined={handleParticipantJoined}
          onParticipantLeft={handleParticipantLeft}
        />
      </div>
    </div>
  );
}
