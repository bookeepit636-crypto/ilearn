'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Trash2,
  Video,
  X,
  Search,
  Share2,
  Heart,
  BookmarkCheck,
  FileText,
  ListVideo,
  Sparkles,
  Check,
  Film
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VideoLesson } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { saveVideoBlob, generateVideoThumbnail } from '@/lib/videoStorage';

export default function VideosPage() {
  const { videos, user, addVideo, deleteVideo } = useApp();
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(videos[0] || null);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'details' | 'queue'>('details');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Student interaction states
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<string, boolean>>({});
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // New video form state
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('Basic Accounting Principles');
  const [newDuration, setNewDuration] = useState('15:00');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [generatedThumb, setGeneratedThumb] = useState<string>('');

  // Sync activeVideo when videos list updates
  useEffect(() => {
    if (!activeVideo && videos.length > 0) {
      setActiveVideo(videos[0]);
    } else if (activeVideo) {
      const match = videos.find((v) => v.id === activeVideo.id);
      if (match && (match.videoUrl !== activeVideo.videoUrl || match.duration !== activeVideo.duration)) {
        setActiveVideo(match);
      }
    }
  }, [videos, activeVideo]);

  // Load student notes when activeVideo changes
  useEffect(() => {
    if (activeVideo && typeof window !== 'undefined') {
      const savedNote = localStorage.getItem(`ilearn_video_note_${activeVideo.id}`) || '';
      setStudentNotes(savedNote);
    }
  }, [activeVideo?.id]);

  const handleSaveNotes = (val: string) => {
    setStudentNotes(val);
    if (activeVideo && typeof window !== 'undefined') {
      localStorage.setItem(`ilearn_video_note_${activeVideo.id}`, val);
    }
  };

  const handleToggleLike = (vidId: string) => {
    setLikedVideos((prev) => ({
      ...prev,
      [vidId]: !prev[vidId]
    }));
  };

  const handleToggleTakeaway = (index: number) => {
    const key = `${activeVideo?.id}_${index}`;
    setCheckedTakeaways((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCopyShare = () => {
    if (typeof window !== 'undefined' && activeVideo) {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDetectedDuration = (detected: string) => {
    if (activeVideo && activeVideo.duration !== detected) {
      setActiveVideo((prev) => prev ? { ...prev, duration: detected } : prev);
    }
  };

  const topics = ['All', 'Basic Accounting Principles', 'Bookkeeping Cycle', 'Trial Balance & Adjustments'];

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesTopic = selectedTopic === 'All' || v.topic === selectedTopic;
      const matchesSearch =
        !searchQuery.trim() ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [videos, selectedTopic, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedRawFile(file);
    setUploadingFile(true);

    // Auto-generate high-res video frame thumbnail
    try {
      const thumb = await generateVideoThumbnail(file);
      setGeneratedThumb(thumb);
    } catch {
      // ignore
    }

    try {
      const url = await uploadToCloudinary(file, 'auto');
      setNewUrl(url);
    } catch (err) {
      console.warn('Video upload fallback to local stream:', err);
      setNewUrl(URL.createObjectURL(file));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    let embedUrl = newUrl;
    if (newUrl.includes('youtube.com/watch?v=')) {
      const vidId = newUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    } else if (newUrl.includes('youtu.be/')) {
      const vidId = newUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }

    const newVid: VideoLesson = {
      id: `vid-${Date.now()}`,
      title: newTitle,
      topic: newTopic,
      duration: newDuration,
      videoUrl: embedUrl,
      thumbnailUrl:
        generatedThumb ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
      description: newDescription || 'Instructional video lesson.',
      keyTakeaways: [
        `Master fundamental concepts of ${newTitle}`,
        'Practical bookkeeping and ledger recording techniques',
        'Review standard problem solving steps'
      ],
      viewsCount: 1
    };

    if (selectedRawFile) {
      await saveVideoBlob(newVid.id, selectedRawFile);
    }

    addVideo(newVid);
    setActiveVideo(newVid);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setSelectedRawFile(null);
    setGeneratedThumb('');
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0077b6] to-[#00b4d8] text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Video className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Bookkeeping Video Classroom
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Watch step-by-step instructional tutorials on journal entries, debits & credits, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user.role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          )}

          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0077b6] focus:ring-1 focus:ring-[#0077b6]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Topic Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedTopic === t
                ? 'bg-gradient-to-r from-[#0077b6] to-[#0096c7] text-white shadow-sm shadow-cyan-500/25'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Player & Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Player & Active Details */}
        <div className="lg:col-span-2 space-y-4">
          {activeVideo ? (
            <div className="card-theme p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              {/* Responsive Video Container */}
              <div className="aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-md">
                <VideoPlayer
                  src={activeVideo.videoUrl}
                  videoId={activeVideo.id}
                  title={activeVideo.title}
                  className="w-full h-full"
                  onDurationChange={handleDetectedDuration}
                />
              </div>

              {/* Title & Metadata Bar */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-[#0077b6] uppercase bg-cyan-50 border border-cyan-200/70 px-2.5 py-0.5 rounded-lg">
                    {activeVideo.topic}
                  </span>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {activeVideo.duration}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      {activeVideo.viewsCount} views
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                    {activeVideo.title}
                  </h2>

                  {/* Quick Action Buttons (Share, Like) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleLike(activeVideo.id)}
                      className={`p-2 rounded-xl border transition ${
                        likedVideos[activeVideo.id]
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title="Favorite video"
                    >
                      <Heart
                        className={`w-4 h-4 ${likedVideos[activeVideo.id] ? 'fill-rose-500' : ''}`}
                      />
                    </button>

                    <button
                      onClick={handleCopyShare}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
                      title="Share / Copy Link"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeVideo.description}
                </p>

                {/* Mobile Tab Switcher (Visible only on small screens) */}
                <div className="flex lg:hidden items-center border-b border-slate-200 pt-2">
                  <button
                    onClick={() => setMobileTab('details')}
                    className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                      mobileTab === 'details'
                        ? 'border-[#0077b6] text-[#0077b6]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Notes & Takeaways</span>
                  </button>
                  <button
                    onClick={() => setMobileTab('queue')}
                    className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                      mobileTab === 'queue'
                        ? 'border-[#0077b6] text-[#0077b6]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListVideo className="w-3.5 h-3.5" />
                    <span>Video Library ({filteredVideos.length})</span>
                  </button>
                </div>

                {/* Mobile View: Playlist tab */}
                {mobileTab === 'queue' && (
                  <div className="block lg:hidden space-y-2 pt-2">
                    <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                      {filteredVideos.map((vid) => {
                        const isActive = activeVideo.id === vid.id;
                        return (
                          <div
                            key={vid.id}
                            onClick={() => {
                              setActiveVideo(vid);
                              setMobileTab('details');
                            }}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isActive
                                ? 'bg-cyan-50/80 border-[#0077b6] shadow-xs'
                                : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900">
                              <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Video className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="overflow-hidden flex-1 space-y-0.5">
                              <span className="text-[10px] text-[#0077b6] font-bold uppercase block truncate">
                                {vid.topic}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                {vid.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 block">{vid.duration}</span>
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-bold text-[#0077b6] bg-cyan-100/70 px-2 py-0.5 rounded-md">
                                Playing
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Desktop Details or Mobile Tab Details */}
                <div className={`${mobileTab === 'details' ? 'block' : 'hidden lg:block'} space-y-4 pt-1`}>
                  {/* Interactive Takeaways Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/20 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#0077b6] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Key Lesson Takeaways
                      </h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        Check off as you learn
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {activeVideo.keyTakeaways.map((point, idx) => {
                        const isChecked = !!checkedTakeaways[`${activeVideo.id}_${idx}`];
                        return (
                          <li
                            key={idx}
                            onClick={() => handleToggleTakeaway(idx)}
                            className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none group"
                          >
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 transition ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 bg-white group-hover:border-[#0077b6]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span className={`${isChecked ? 'line-through text-slate-400' : ''}`}>
                              {point}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Student Interactive Note-taking */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>My Lecture Notes (Private)</span>
                    </h4>
                    <textarea
                      rows={2}
                      value={studentNotes}
                      onChange={(e) => handleSaveNotes(e.target.value)}
                      placeholder="Write your study notes, formulas, or key reminders here... (Auto-saved)"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-theme p-16 text-center text-slate-400 rounded-3xl bg-white border border-slate-200">
              Select a video from the list to begin streaming.
            </div>
          )}
        </div>

        {/* Right Column: Video Library Playlist (Always visible on Desktop) */}
        <div className="hidden lg:block space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-[#0077b6]" />
              <span>Video Library ({filteredVideos.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Click to Play</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[750px] pr-1">
            {filteredVideos.map((vid) => {
              const isActive = activeVideo?.id === vid.id;

              return (
                <div
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                    isActive
                      ? 'bg-cyan-50/80 border-[#0077b6] shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  <div className="overflow-hidden flex-1 space-y-1">
                    <span className="text-[10px] text-[#0077b6] font-bold uppercase block truncate">
                      {vid.topic}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#0077b6] transition line-clamp-1">
                      {vid.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">{vid.duration}</span>
                  </div>

                  {user.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVideo(vid.id);
                        if (activeVideo?.id === vid.id) {
                          setActiveVideo(videos.find((v) => v.id !== vid.id) || null);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {filteredVideos.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white border border-slate-200">
                No videos match your search or filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Upload Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-[#0077b6]" />
                Upload Educational Video
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. How to Record Adjusting Journal Entries"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Topic Category</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                >
                  <option>Basic Accounting Principles</option>
                  <option>Bookkeeping Cycle</option>
                  <option>Trial Balance & Adjustments</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Upload MP4 File directly
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-[#0077b6] hover:file:bg-cyan-100 cursor-pointer"
                />
                {uploadingFile && (
                  <p className="text-[10px] text-[#0077b6] font-bold mt-1">Processing video file...</p>
                )}
                {generatedThumb && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Auto-extracted video frame thumbnail!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Or Paste Video URL (YouTube or Direct Video)
                </label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0077b6] hover:to-[#023e8a] text-white font-bold shadow-md shadow-cyan-500/20 transition"
                >
                  Publish Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
