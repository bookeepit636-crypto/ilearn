'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileQuestion,
  Flame,
  Megaphone,
  TrendingUp,
  Video
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function DashboardPage() {
  const { user, courses, notifications, schedules } = useApp();

  const announcements = notifications.filter((n) => n.category === 'announcement').slice(0, 2);
  const upcomingEvents = schedules.filter((s) => !s.isCompleted).slice(0, 3);

  const totalLessonsCount = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const overallProgressPct = Math.round(
    (user.completedLessonsCount / (totalLessonsCount || 1)) * 100
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-white" />
              {user.streakDays}-Day Learning Streak Active!
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Continue your bookkeeping mastery. You have completed{' '}
              <span className="font-bold text-white underline">{user.completedLessonsCount}</span> out of{' '}
              <span className="font-bold text-white">{totalLessonsCount}</span> total lessons.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-white transition-all duration-1000"
                  strokeDasharray={`${overallProgressPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{overallProgressPct}%</span>
            </div>
            <div>
              <div className="text-xs text-white/70 font-medium">Overall Progress</div>
              <div className="text-sm font-bold text-white">BookKeep-It Mastery</div>
              <Link href="/courses" className="text-xs text-white underline font-bold">
                Resume Learning →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-theme p-4 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Active Courses</span>
            <BookOpen className="w-4 h-4 text-[#0077b6]" />
          </div>
          <div className="text-2xl font-black text-slate-800">{courses.length}</div>
          <div className="text-[11px] text-[#0077b6] font-semibold mt-1">Core Modules</div>
        </div>

        <div className="card-theme p-4 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Avg Quiz Score</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{user.averageQuizScore}%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {user.totalQuizzesTaken} Quizzes Taken
          </div>
        </div>

        <div className="card-theme p-4 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Study Time</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{user.studyHours}h</div>
          <div className="text-[11px] text-cyan-600 font-semibold mt-1">Total Hours Spent</div>
        </div>

        <div className="card-theme p-4 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{user.streakDays} Days</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Keep it going!</div>
        </div>
      </div>

      {/* Admin Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Megaphone className="w-4 h-4 text-[#0077b6]" />
            <span>Latest Announcements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#0077b6]">{ann.title}</h3>
                  <span className="text-[10px] text-slate-400">{ann.sender}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recently Accessed Modules + Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0077b6]" />
              Recent Course Modules
            </h2>
            <Link href="/courses" className="text-xs text-[#0077b6] font-bold hover:underline">
              View All Courses →
            </Link>
          </div>

          <div className="space-y-4">
            {courses.slice(0, 3).map((crs) => {
              const progressPct = Math.round((crs.completedLessons / crs.totalLessons) * 100);

              return (
                <div
                  key={crs.id}
                  className="card-theme p-5 rounded-3xl bg-white border border-slate-100 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={crs.thumbnail}
                      alt={crs.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {crs.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0077b6] transition">
                        {crs.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{crs.description}</p>
                    </div>
                  </div>

                  <div className="w-full md:w-48 space-y-2 shrink-0">
                    <div className="w-full bg-slate-100 h-5 rounded-full p-0.5 relative overflow-hidden flex items-center">
                      <div
                        className="bg-gradient-to-r from-[#48cae4] to-[#0077b6] h-full rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
                        {progressPct}% Completed
                      </span>
                    </div>

                    <Link
                      href="/courses"
                      className="block text-center w-full py-1.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white text-xs font-bold transition shadow-xs"
                    >
                      Continue Module
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Shortcuts Column */}
        <div className="space-y-6">
          <div className="card-theme p-5 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0077b6]" />
              Quick Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/quizzes"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-center transition group"
              >
                <FileQuestion className="w-6 h-6 text-[#0077b6] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Take Quiz</span>
              </Link>

              <Link
                href="/videos"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-center transition group"
              >
                <Video className="w-6 h-6 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Videos</span>
              </Link>

              <Link
                href="/downloads"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-center transition group"
              >
                <Download className="w-6 h-6 text-cyan-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Templates</span>
              </Link>

              <Link
                href="/schedule"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-center transition group"
              >
                <Calendar className="w-6 h-6 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Schedule</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
