'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileQuestion,
  GraduationCap,
  Video,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Course, Lesson } from '@/types';
import confetti from 'canvas-confetti';

export default function CoursesPage() {
  const { courses, toggleLessonCompletion } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'latest' | 'progress'>('latest');

  // Dynamically derived from global courses state so updates reflect immediately
  const activeCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId) || null
    : null;

  const activeLesson = activeCourse
    ? activeCourse.topics.flatMap((t) => t.lessons).find((l) => l.id === selectedLessonId) ||
      activeCourse.topics[0]?.lessons[0] ||
      null
    : null;

  const handleToggleLessonCompletion = (crsId: string, lsnId: string) => {
    toggleLessonCompletion(crsId, lsnId);
    const targetLsn = activeCourse?.topics.flatMap((t) => t.lessons).find((l) => l.id === lsnId);
    const willBeCompleted = targetLsn ? !targetLsn.isCompleted : true;
    if (willBeCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    }
  };

  // Derive student courses dynamically with true completion percentages calculated directly from their lessons
  const allStudentCourses = courses
    .map((c) => {
      const actualTotal =
        c.topics && c.topics.length > 0
          ? c.topics.reduce((sum, t) => sum + (t.lessons ? t.lessons.length : 0), 0)
          : (c.totalLessons || 1);
      const actualCompleted =
        c.topics && c.topics.length > 0
          ? c.topics.reduce((sum, t) => sum + (t.lessons ? t.lessons.filter((l) => l.isCompleted).length : 0), 0)
          : (c.completedLessons || 0);
      const pct = Math.round((actualCompleted / (actualTotal || 1)) * 100);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        progressPct: Math.min(100, Math.max(0, pct)),
        image: c.thumbnail || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
        category: c.category,
        rawCourse: c
      };
    })
    .sort((a, b) => {
      if (sortOrder === 'progress') {
        return b.progressPct - a.progressPct;
      }
      return 0;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Section Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Continue Learning
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Pick up where you left off in your current classes
          </p>
        </div>

        {/* Sort & See All Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setSortOrder((prev) => (prev === 'latest' ? 'progress' : 'latest'))}
              className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shadow-2xs transition active:scale-95"
            >
              <span>Sort by <strong className="text-[#0077b6] capitalize">{sortOrder}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-[#0077b6]" />
            </button>
          </div>

          <button className="px-5 py-1.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition">
            See All
          </button>
        </div>
      </div>

      {/* 3-Column Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allStudentCourses.map((crs) => {
          const dynamicCourse = crs.rawCourse;

          return (
            <div
              key={crs.id}
              onClick={() => {
                setSelectedCourseId(dynamicCourse.id);
                if (dynamicCourse?.topics[0]?.lessons[0]) {
                  setSelectedLessonId(dynamicCourse.topics[0].lessons[0].id);
                }
              }}
              className="card-theme p-5 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Image Container with Top-Right Floating Circle Arrow Action Button */}
                <div className="relative h-44 rounded-2xl overflow-hidden">
                  <img
                    src={crs.image}
                    alt={crs.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Sky-Blue Floating Action Arrow Icon (↗) */}
                  <div className="absolute top-3 right-3 floating-arrow-btn">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Course Info */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-[#0077b6] transition leading-snug">
                    {crs.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {crs.description}
                  </p>
                </div>
              </div>

              {/* Progress Pill Bar Matching Screenshot */}
              <div className="pt-4 mt-2">
                <div className="w-full bg-slate-100 h-6 rounded-full p-0.5 relative overflow-hidden flex items-center border border-slate-200/60">
                  <div
                    className="bg-gradient-to-r from-[#48cae4] to-[#0077b6] h-full rounded-full transition-all duration-700"
                    style={{ width: `${crs.progressPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-xs">
                    {crs.progressPct}% Completed
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Course Drawer Modal */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[94vh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] sm:text-xs text-[#0077b6] font-bold uppercase tracking-wider block">
                  {activeCourse.code} • {activeCourse.category}
                </span>
                <h2 className="text-base sm:text-xl font-black text-slate-800 truncate">{activeCourse.title}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCourseId(null);
                  setSelectedLessonId(null);
                }}
                className="p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Topics List (max-h-44 on mobile, full-height on desktop) */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-4 max-h-44 md:max-h-none overflow-y-auto space-y-3 sm:space-y-4 bg-slate-50/50 shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Course Outline
                </h3>

                {activeCourse.topics.map((tpc, tIdx) => (
                  <div key={tpc.id} className="space-y-2">
                    <div className="text-xs font-bold text-[#0077b6] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#00b4d8]/20 text-[#0077b6] text-[10px] flex items-center justify-center font-black">
                        {tIdx + 1}
                      </span>
                      {tpc.title}
                    </div>

                    <div className="space-y-1 pl-2">
                      {tpc.lessons.map((lsn) => {
                        const isSelected = activeLesson?.id === lsn.id;

                        return (
                          <div
                            key={lsn.id}
                            onClick={() => setSelectedLessonId(lsn.id)}
                            className={`p-2.5 rounded-2xl cursor-pointer flex items-center justify-between text-xs transition ${
                              isSelected
                                ? 'bg-[#0077b6] text-white font-bold shadow-md shadow-blue-500/20'
                                : 'hover:bg-slate-200/60 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLessonCompletion(activeCourse.id, lsn.id);
                                }}
                                className="shrink-0"
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 transition ${
                                    lsn.isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-400'
                                  }`}
                                />
                              </button>
                              <span className="truncate">{lsn.title}</span>
                            </div>
                            <span className={`text-[10px] shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {lsn.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Selected Lesson Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
                {activeLesson ? (
                  <div className="space-y-6 max-w-3xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs text-slate-400">Duration: {activeLesson.duration}</span>
                        <h2 className="text-xl font-extrabold text-slate-800">{activeLesson.title}</h2>
                      </div>
                      <button
                        onClick={() => handleToggleLessonCompletion(activeCourse.id, activeLesson.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                          activeLesson.isCompleted
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-[#00b4d8] hover:bg-[#0077b6] text-white shadow-md shadow-cyan-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {activeLesson.isCompleted ? 'Completed ✓' : 'Mark as Complete'}
                      </button>
                    </div>

                    {/* Lesson Video */}
                    {activeLesson.videoUrl && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#0077b6] uppercase tracking-wider flex items-center gap-1.5">
                          <Video className="w-4 h-4" /> Video Lecture
                        </h4>
                        <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                          <iframe
                            src={activeLesson.videoUrl}
                            title={activeLesson.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    <div className="prose text-sm text-slate-600 space-y-3 leading-relaxed whitespace-pre-line">
                      {activeLesson.contentMarkdown}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <Link
                        href="/quizzes"
                        onClick={() => {
                          setSelectedCourseId(null);
                          setSelectedLessonId(null);
                        }}
                        className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 flex items-center gap-3 transition font-bold text-xs"
                      >
                        <FileQuestion className="w-5 h-5 text-[#0077b6]" />
                        <span>Take Lesson Quiz</span>
                      </Link>

                      <Link
                        href="/downloads"
                        onClick={() => {
                          setSelectedCourseId(null);
                          setSelectedLessonId(null);
                        }}
                        className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 flex items-center gap-3 transition font-bold text-xs"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                        <span>Download Worksheets</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Select a lesson from the left course outline to begin reading.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
