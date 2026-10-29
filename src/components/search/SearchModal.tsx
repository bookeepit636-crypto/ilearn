'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, FileQuestion, Search, Video, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, courses, videos, quizzes, materials } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const filteredCourses = trimmed
    ? courses.filter(
        (c) => c.title.toLowerCase().includes(trimmed) || c.description.toLowerCase().includes(trimmed)
      )
    : courses.slice(0, 3);

  const filteredVideos = trimmed
    ? videos.filter(
        (v) => v.title.toLowerCase().includes(trimmed) || v.topic.toLowerCase().includes(trimmed)
      )
    : videos.slice(0, 3);

  const filteredQuizzes = trimmed
    ? quizzes.filter((q) => q.title.toLowerCase().includes(trimmed))
    : quizzes.slice(0, 3);

  const filteredMaterials = trimmed
    ? materials.filter(
        (m) => m.title.toLowerCase().includes(trimmed) || m.category.toLowerCase().includes(trimmed)
      )
    : materials.slice(0, 3);

  const hasResults =
    filteredCourses.length > 0 ||
    filteredVideos.length > 0 ||
    filteredQuizzes.length > 0 ||
    filteredMaterials.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0077b6]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookkeeping courses, quizzes, videos, templates..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium"
            autoFocus
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto space-y-6">
          {!hasResults && (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No matching learning materials found for &quot;{query}&quot;</p>
            </div>
          )}

          {/* Courses Section */}
          {filteredCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4" /> Courses
              </div>
              <div className="space-y-1.5">
                {filteredCourses.map((crs) => (
                  <Link
                    key={crs.id}
                    href="/courses"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{crs.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{crs.description}</p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-cyan-50 text-[#0077b6] border border-cyan-200 px-2 py-0.5 rounded-full">
                      {crs.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {filteredVideos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                <Video className="w-4 h-4" /> Video Lessons
              </div>
              <div className="space-y-1.5">
                {filteredVideos.map((vid) => (
                  <Link
                    key={vid.id}
                    href="/videos"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{vid.title}</h4>
                      <p className="text-xs text-slate-500">{vid.topic} • {vid.duration}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Section */}
          {filteredQuizzes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                <FileQuestion className="w-4 h-4" /> Quizzes
              </div>
              <div className="space-y-1.5">
                {filteredQuizzes.map((qz) => (
                  <Link
                    key={qz.id}
                    href="/quizzes"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{qz.title}</h4>
                      <p className="text-xs text-slate-500">{qz.questions.length} questions • Passing: {qz.passingScore}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Materials Section */}
          {filteredMaterials.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">
                <Download className="w-4 h-4" /> Templates & Downloads
              </div>
              <div className="space-y-1.5">
                {filteredMaterials.map((mat) => (
                  <Link
                    key={mat.id}
                    href="/downloads"
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{mat.title}</h4>
                      <p className="text-xs text-slate-500">{mat.category} ({mat.fileType.toUpperCase()}) • {mat.fileSize}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Press <kbd className="font-mono text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">ESC</kbd> to exit</span>
          <span className="font-medium text-[#0077b6]">BookKeep-It Knowledge Engine</span>
        </div>
      </div>
    </div>
  );
};
