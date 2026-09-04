'use client';

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Edit,
  Flame,
  Save,
  Upload,
  User
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function ProfilePage() {
  const { user, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  const [program, setProgram] = useState(user.program);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'
  ];

  // Cloudinary Direct Image Upload Handler
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessMsg('');

    try {
      const uploadedUrl = await uploadToCloudinary(file, 'image');
      setAvatarUrl(uploadedUrl);
      updateProfile({ avatarUrl: uploadedUrl });
      setUploadSuccessMsg('✓ Profile photo successfully uploaded to Cloudinary!');
    } catch (err) {
      console.warn('Cloudinary upload fallback:', err);
      const fallbackUrl = URL.createObjectURL(file);
      setAvatarUrl(fallbackUrl);
      updateProfile({ avatarUrl: fallbackUrl });
      setUploadSuccessMsg('✓ Profile photo updated!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      bio,
      program,
      avatarUrl
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-xl"
            />
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-[#0077b6] cursor-pointer hover:bg-slate-100 shadow-md transition">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white uppercase backdrop-blur-md">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-white/80">{user.program}</p>
            <p className="text-xs text-white/70 font-mono">Student ID: {user.studentId}</p>

            {uploadSuccessMsg && (
              <p className="text-xs text-emerald-300 font-bold pt-1 animate-in fade-in">
                {uploadSuccessMsg}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md border border-white/30 transition"
          >
            <Edit className="w-4 h-4 text-white" />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-6"
        >
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Update Profile Information & Avatar
          </h3>

          {/* Cloudinary Profile Upload Section */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-3">
            <label className="block text-xs font-bold text-[#0077b6] flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Upload Custom Profile Photo (Cloudinary Integrated)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 shadow-2xs">
                <Camera className="w-4 h-4 text-[#0077b6]" />
                <span>{isUploading ? 'Uploading Image...' : 'Choose Image File from Computer'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#0077b6]"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Or Choose Avatar Preset</label>
            <div className="flex items-center gap-3">
              {avatarPresets.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preset ${idx}`}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-12 h-12 rounded-full object-cover cursor-pointer border-2 transition ${
                    avatarUrl === url ? 'border-[#0077b6] scale-110 shadow-md' : 'border-transparent opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Program / Course</label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Short Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-[#0077b6]" /> About Me
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{user.bio}</p>
            <div className="pt-2 text-xs space-y-1.5 text-slate-500">
              <p>📧 Email: {user.email}</p>
              <p>🎓 Program: {user.program}</p>
              <p>🆔 Student ID: {user.studentId}</p>
            </div>
          </div>

          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Flame className="w-4 h-4 text-amber-500" /> Learning Stats
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Study Hours Logged</span>
                <span className="font-extrabold text-slate-800">{user.studyHours} Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Completed Lessons</span>
                <span className="font-extrabold text-slate-800">{user.completedLessonsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quizzes Taken</span>
                <span className="font-extrabold text-slate-800">{user.totalQuizzesTaken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Average Quiz Score</span>
                <span className="font-extrabold text-emerald-600">{user.averageQuizScore}%</span>
              </div>
            </div>
          </div>

          <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-indigo-600" /> Achieved Badges
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-[#0077b6] font-bold flex items-center gap-2">
                <Award className="w-4 h-4" /> Bookkeeping Fundamentals Master
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Trial Balance 100% Accuracy
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
