'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Radio,
  Users,
  Video,
  XCircle
} from 'lucide-react';
import { useApp, isMockLiveSession } from '@/context/AppContext';
import { LiveSession, LiveSessionStatus } from '@/types';

const STATUS_CONFIG: Record<LiveSessionStatus, { label: string; pill: string; dot?: string }> = {
  live: {
    label: 'LIVE NOW',
    pill: 'bg-red-500 text-white',
    dot: 'bg-red-400'
  },
  scheduled: {
    label: 'Upcoming',
    pill: 'bg-cyan-100 text-cyan-700'
  },
  completed: {
    label: 'Completed',
    pill: 'bg-slate-100 text-slate-600'
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-slate-100 text-slate-400'
  }
};

type FilterTab = 'all' | 'live' | 'scheduled' | 'completed';

function SessionCard({ session }: { session: LiveSession }) {
  const config = STATUS_CONFIG[session.status];

  return (
    <div
      className={`card-theme p-5 rounded-3xl flex flex-col gap-4 ${
        session.status === 'live' ? 'ring-2 ring-red-400 ring-offset-2 shadow-lg shadow-red-100' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {/* Status pill */}
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${config.pill}`}
            >
              {session.status === 'live' && (
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
              )}
              {config.label}
            </span>
            {/* Course badge */}
            {session.courseTitle && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0077b6]">
                <BookOpen className="w-3 h-3" />
                {session.courseTitle}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{session.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{session.description}</p>
        </div>

        {/* Video icon accent */}
        <div
          className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
            session.status === 'live' ? 'bg-red-50' : 'bg-cyan-50'
          }`}
        >
          <Video
            className={`w-5 h-5 ${session.status === 'live' ? 'text-red-500' : 'text-cyan-600'}`}
          />
        </div>
      </div>

      {/* Session Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {session.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {session.startTime}
          {session.endTime ? ` – ${session.endTime}` : ` · ${session.durationMinutes} min`}
        </span>
        {((session.participants?.length || session.attendeesCount || 0) > 0) && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {session.participants?.length || session.attendeesCount} {session.status === 'live' ? 'in room' : 'attended'}
          </span>
        )}
      </div>

      {/* Instructor */}
      <div className="text-xs text-slate-600 font-medium">
        Instructor: <span className="text-[#0077b6] font-bold">{session.instructorName}</span>
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {session.status === 'live' && (
          <Link
            href={`/live/${session.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md shadow-red-200 transition"
          >
            <Radio className="w-4 h-4" />
            Join Live Class
          </Link>
        )}
        {session.status === 'scheduled' && (
          <Link
            href={`/live/${session.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs shadow-md shadow-cyan-200 transition"
          >
            <Clock className="w-4 h-4" />
            View Details
          </Link>
        )}
        {session.status === 'completed' && session.recordingUrl && (
          <Link
            href={`/live/${session.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            <Play className="w-4 h-4" />
            Watch Replay
          </Link>
        )}
        {session.status === 'completed' && !session.recordingUrl && (
          <span className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            Session Ended
          </span>
        )}
        {session.status === 'cancelled' && (
          <span className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 text-slate-400 font-bold text-xs">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
}

export default function LiveClassesPage() {
  const { liveSessions } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const cleanSessions = liveSessions.filter((s) => !isMockLiveSession(s));
  const liveNow = cleanSessions.filter((s) => s.status === 'live');
  const filtered =
    activeTab === 'all'
      ? cleanSessions
      : cleanSessions.filter((s) => s.status === activeTab);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Sessions', count: cleanSessions.length },
    { key: 'live', label: '🔴 Live Now', count: liveNow.length },
    { key: 'scheduled', label: 'Upcoming', count: cleanSessions.filter((s) => s.status === 'scheduled').length },
    { key: 'completed', label: 'Past Replays', count: cleanSessions.filter((s) => s.status === 'completed').length }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-black text-slate-800">Live Classes</h1>
        </div>
        <p className="text-sm text-slate-500">
          Join live virtual bookkeeping sessions, reviews, and Q&A classes with your instructors — all inside BookKeep-It.
        </p>
      </div>

      {/* Live Now Alert Banner */}
      {liveNow.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white shadow-lg shadow-red-200">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-10 w-32 h-32 bg-white rounded-full" />
            <div className="absolute -bottom-8 right-4 w-20 h-20 bg-white rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wide text-red-100">
                  Live Now
                </span>
              </div>
              <p className="font-bold text-lg leading-tight">{liveNow[0].title}</p>
              <p className="text-red-100 text-xs mt-1">
                with {liveNow[0].instructorName}
                {(liveNow[0].participants?.length || liveNow[0].attendeesCount) ? ` · ${liveNow[0].participants?.length || liveNow[0].attendeesCount} in room` : ''}
              </p>
            </div>
            <Link
              href={`/live/${liveNow[0].id}`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 rounded-full font-extrabold text-sm shadow hover:shadow-md transition"
            >
              <Radio className="w-4 h-4" />
              Join Now
            </Link>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`live-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-[#0077b6] text-white shadow-md shadow-cyan-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0077b6] hover:text-[#0077b6]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Session Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-slate-500">No sessions found</p>
          <p className="text-xs mt-1">
            {activeTab === 'live'
              ? 'No class is currently live.'
              : activeTab === 'scheduled'
              ? 'No upcoming classes scheduled yet.'
              : 'No sessions in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
