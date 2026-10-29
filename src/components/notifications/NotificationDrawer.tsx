'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Mail, Megaphone, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  if (!isNotificationDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0077b6]" />
            <h3 className="font-extrabold text-slate-800 text-base">My Mail & Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-[#0077b6] hover:underline flex items-center gap-1 font-bold"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark read
            </button>
            <button
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">Your inbox is empty</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const formattedDate = new Date(notif.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                      : 'bg-blue-50/80 border-[#0077b6] text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {notif.category === 'announcement' ? (
                        <Megaphone className="w-4 h-4 text-[#0077b6] shrink-0" />
                      ) : (
                        <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#00b4d8] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>From: {notif.sender}</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <Link
            href="/notifications"
            onClick={() => setIsNotificationDrawerOpen(false)}
            className="text-xs text-[#0077b6] hover:underline font-extrabold"
          >
            View Full Notifications Inbox →
          </Link>
        </div>
      </div>
    </div>
  );
};
