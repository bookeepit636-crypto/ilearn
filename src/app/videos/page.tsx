'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Trash2,
  Video,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VideoLesson } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function VideosPage() {
  const { videos, user, addVideo, deleteVideo } = useApp();
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(videos[0] || null);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New video form state
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('Basic Accounting Principles');
  const [newDuration, setNewDuration] = useState('15:00');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const topics = ['All', 'Basic Accounting Principles', 'Bookkeeping Cycle', 'Trial Balance & Adjustments'];

  const filteredVideos =
    selectedTopic === 'All' ? videos : videos.filter((v) => v.topic === selectedTopic);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const url = await uploadToCloudinary(file, 'video');
      setNewUrl(url);
    } catch (err) {
      alert('Video upload failed: ' + (err as Error).message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    let embedUrl = newUrl;
    if (newUrl.includes('youtube.com/watch?v=')) {
      const vidId = newUrl.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${vidId}`;
    }

    const newVid: VideoLesson = {
      id: `vid-${Date.now()}`,
      title: newTitle,
      topic: newTopic,
      duration: newDuration,
      videoUrl: embedUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
      description: newDescription || 'Instructional video lesson.',
      keyTakeaways: ['Key takeaway step 1', 'Key takeaway step 2'],
      viewsCount: 1
    };

    addVideo(newVid);
    setActiveVideo(newVid);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-[#0077b6]" />
            Bookkeeping Video Classroom
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Watch step-by-step instructional tutorials on journal entries, debits & credits, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Upload Educational Video (Cloudinary)
            </button>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedTopic === t
                    ? 'bg-[#0077b6] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          {activeVideo ? (
            <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-md">
                <iframe
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0077b6] uppercase bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full">
                    {activeVideo.topic}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeVideo.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      {activeVideo.viewsCount} views
                    </span>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-slate-800">{activeVideo.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{activeVideo.description}</p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-[#0077b6] uppercase tracking-wider">
                    Key Lesson Takeaways
                  </h4>
                  <ul className="space-y-1.5">
                    {activeVideo.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-theme p-16 text-center text-slate-400 rounded-3xl bg-white">
              Select a video from the list to begin streaming.
            </div>
          )}
        </div>

        {/* Video Queue */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Video Library ({filteredVideos.length})</span>
            <span className="text-xs text-slate-400">Click to Play</span>
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[750px] pr-1">
            {filteredVideos.map((vid) => {
              const isActive = activeVideo?.id === vid.id;

              return (
                <div
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                    isActive
                      ? 'bg-blue-50/80 border-[#0077b6] shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  <div className="overflow-hidden flex-1 space-y-0.5">
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
                Upload Video (Cloudinary & YouTube)
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
                <label className="block text-slate-700 font-semibold mb-1">
                  Upload MP4 File directly to Cloudinary
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-[#0077b6] hover:file:bg-cyan-100"
                />
                {uploadingFile && (
                  <p className="text-[10px] text-[#0077b6] font-bold mt-1">Uploading to Cloudinary...</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Or Paste Video URL (YouTube or Cloudinary CDN)
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
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
