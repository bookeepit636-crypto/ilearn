'use client';

import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  PieChart,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ProgressTrackerPage() {
  const { user, courses } = useApp();

  const totalLessonsCount = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const overallProgressPct = Math.round(
    (user.completedLessonsCount / (totalLessonsCount || 1)) * 100
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-[#0077b6]" />
          Learning Progress Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your course completion metrics, topic mastery breakdown, and quiz score performance over time.
        </p>
      </div>

      {/* Main Overall Progress Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> BookKeep-It Progress
          </span>
          <h2 className="text-2xl font-black">
            Overall Completion: <span className="text-cyan-200">{overallProgressPct}%</span>
          </h2>
          <p className="text-sm text-white/80 max-w-xl">
            You have finished <span className="font-bold text-white">{user.completedLessonsCount}</span> of{' '}
            <span className="font-bold text-white">{totalLessonsCount}</span> lessons and taken{' '}
            <span className="font-bold text-white">{user.totalQuizzesTaken}</span> quizzes with an average score of{' '}
            <span className="font-bold text-white">{user.averageQuizScore}%</span>.
          </p>
        </div>

        <div className="w-full md:w-64 space-y-2 shrink-0">
          <div className="w-full bg-white/20 h-4 rounded-full p-0.5 overflow-hidden backdrop-blur-md">
            <div
              className="bg-white h-full rounded-full transition-all duration-1000 shadow-md"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-white/80">
            <span>0%</span>
            <span>50%</span>
            <span>100% Mastered</span>
          </div>
        </div>
      </div>

      {/* Course Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0077b6]" />
          Module Progress Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((crs) => {
            const crsPct = Math.round((crs.completedLessons / crs.totalLessons) * 100);

            return (
              <div key={crs.id} className="card-theme p-5 rounded-3xl bg-white border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#0077b6] uppercase bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                    {crs.code}
                  </span>
                  <span className="text-xs font-black text-[#0077b6]">{crsPct}%</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">{crs.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {crs.completedLessons} of {crs.totalLessons} lessons completed
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Earned Student Badges
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Debit & Credit Master</h4>
            <span className="text-[10px] text-emerald-600 font-bold block">Unlocked</span>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 text-[#0077b6] flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Quiz Whiz (100%)</h4>
            <span className="text-[10px] text-emerald-600 font-bold block">Unlocked</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">6-Day Streak</h4>
            <span className="text-[10px] text-emerald-600 font-bold block">Unlocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
