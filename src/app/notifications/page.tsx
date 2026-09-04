'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Mail,
  Megaphone,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function NotificationsInboxPage() {
  const {
    notifications,
    user,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    broadcastAnnouncement
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'announcement' | 'quiz' | 'unread'>('all');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'announcement') return n.category === 'announcement';
    if (filter === 'quiz') return n.category === 'quiz';
    return true;
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMsg) return;

    broadcastAnnouncement(announcementTitle, announcementMsg);
    setIsBroadcastModalOpen(false);
    setAnnouncementTitle('');
    setAnnouncementMsg('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#0077b6]" />
            My Mail & Platform Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with course announcements, instructor messages, quiz reminders, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Announcement
            </button>
          )}

          <button
            onClick={markAllNotificationsAsRead}
            className="px-4 py-2 rounded-full bg-white border border-slate-200 text-[#0077b6] hover:bg-slate-50 font-bold text-xs flex items-center gap-2 shadow-xs transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'announcement', 'quiz', 'unread'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              filter === cat
                ? 'bg-[#0077b6] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-theme p-16 text-center text-slate-400 rounded-3xl bg-white">
            <Mail className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No messages found in this filter view.</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                notif.isRead
                  ? 'card-theme bg-white border-slate-200/80 text-slate-600'
                  : 'bg-blue-50/80 border-[#0077b6] text-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    notif.category === 'announcement'
                      ? 'bg-cyan-100 text-[#0077b6]'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {notif.category === 'announcement' ? (
                    <Megaphone className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-[#00b4d8] text-white rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <div className="text-right shrink-0 text-xs text-slate-400">
                <span className="block font-medium text-slate-700">{notif.sender}</span>
                <span className="text-[10px] font-mono">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#0077b6]" />
                Broadcast Announcement
              </h3>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Schedule Change: Review Session"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Message Body</label>
                <textarea
                  rows={4}
                  required
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="Message content..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Send Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
