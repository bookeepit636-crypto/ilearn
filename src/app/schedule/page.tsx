'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Radio,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SchedulePage() {
  const { schedules, addScheduleItem, toggleScheduleCompletion, liveSessions } = useApp();
  const upcomingLiveSessions = liveSessions.filter((s) => s.status === 'live' || s.status === 'scheduled');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'quiz' | 'lesson' | 'review' | 'deadline'>('review');
  const [date, setDate] = useState('2026-08-25');
  const [time, setTime] = useState('14:00');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    addScheduleItem({
      title,
      type,
      date,
      time,
      description: description || 'Study activity session.'
    });

    setIsAddModalOpen(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#0077b6]" />
            Study Schedule & Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize your bookkeeping study plan, live review sessions, and quiz submission deadlines.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Study Reminder
        </button>
      </div>

      {/* Live Class Sessions (synced) */}
      {upcomingLiveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-600 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            Live & Upcoming Classes
          </h2>
          {upcomingLiveSessions.map((session) => (
            <div
              key={session.id}
              className={`card-theme p-4 rounded-2xl flex items-center gap-4 ${
                session.status === 'live' ? 'ring-2 ring-red-400 ring-offset-2' : ''
              }`}
            >
              <div className="shrink-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  session.status === 'live' ? 'bg-red-50' : 'bg-cyan-50'
                }`}>
                  <Radio className={`w-4 h-4 ${session.status === 'live' ? 'text-red-500' : 'text-cyan-600'}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    session.status === 'live' ? 'bg-red-500 text-white' : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {session.status === 'live' ? '🔴 LIVE NOW' : 'Live Meet'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 truncate">{session.title}</h3>
                <p className="text-xs text-slate-500">
                  {session.date} · {session.startTime}
                  {session.instructorName ? ` · ${session.instructorName}` : ''}
                </p>
              </div>
              <Link
                href={`/live/${session.id}`}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold text-xs ${
                  session.status === 'live'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#00b4d8] text-white hover:bg-[#0077b6]'
                } transition`}
              >
                {session.status === 'live' ? 'Join' : 'View'}
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schedules.map((item) => (
          <div
            key={item.id}
            className={`card-theme p-5 rounded-3xl bg-white border border-slate-100 transition-all ${
              item.isCompleted ? 'opacity-60 bg-slate-50' : 'hover:border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button onClick={() => toggleScheduleCompletion(item.id)} className="mt-0.5">
                  <CheckCircle2
                    className={`w-5 h-5 transition ${
                      item.isCompleted ? 'text-emerald-500 fill-emerald-100' : 'text-slate-300'
                    }`}
                  />
                </button>

                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.type === 'quiz'
                        ? 'bg-cyan-100 text-[#0077b6]'
                        : item.type === 'review'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.type}
                  </span>

                  <h3 className={`text-base font-bold ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className="text-xs font-extrabold text-[#0077b6] block">{item.date}</span>
                <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0077b6]" />
                Add Study Activity
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Practice T-Account Ledger Exercises"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold shadow-md shadow-cyan-500/20"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
