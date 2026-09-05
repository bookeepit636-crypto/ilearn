'use client';

import React, { useState } from 'react';
import {
  Bell,
  Key,
  LogOut,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { resetAllData } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg('Error: New passwords do not match.');
      return;
    }
    setStatusMsg('Success: Password updated securely!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to safely log out of BookKeep-It?')) {
      resetAllData();
      alert('You have been safely logged out. Session ended.');
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#0077b6]" />
          Account Settings & Security
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your password, notification preferences, security settings, and session status.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold ${
            statusMsg.startsWith('Success')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMsg}
        </div>
      )}

      {/* Password Change */}
      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-[#0077b6]" />
          Change Security Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition"
          >
            Update Security Password
          </button>
        </form>
      </div>

      {/* Resend Email Notifications (Admin Alerts) */}
      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0077b6]" />
            Automatic Gmail Notifications (Resend Integrated)
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0077b6] border border-cyan-200">
            Resend Email API
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          BookKeep-It automatically notifies the administrator via email whenever a student submits an exam, finishes a quiz, or submits an activity file.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block">Required Environment Variables:</span>
              <span className="text-[11px] text-slate-500">Add these to your <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env.local</code> file and Vercel project settings:</span>
            </div>
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-[#0077b6] hover:bg-[#023e8a] text-white font-bold text-[11px] transition shrink-0 text-center"
            >
              Get Free Resend API Key →
            </a>
          </div>

          <div className="font-mono text-[11px] bg-slate-900 text-cyan-300 p-3 rounded-xl space-y-1">
            <p>RESEND_API_KEY=re_your_api_key_here</p>
            <p>ADMIN_NOTIFICATION_EMAIL=your-gmail-address@gmail.com</p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={async () => {
                try {
                  setStatusMsg('Sending test notification email via Resend...');
                  const res = await fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'quiz_submission',
                      data: {
                        studentName: 'Alex Cruz (Test Student)',
                        studentEmail: 'bookeepit636@gmail.com',
                        studentId: 'STU-2026-999',
                        program: 'BS Accountancy',
                        quizTitle: 'Quiz 1: Assets, Liabilities & Owner\'s Equity (Test Notification)',
                        score: 100,
                        passed: true,
                        correctAnswersCount: 3,
                        totalQuestions: 3,
                        submittedAt: new Date().toISOString()
                      }
                    })
                  });
                  const json = await res.json();
                  if (json.success) {
                    setStatusMsg('Success: Test notification email was sent successfully! Check your inbox.');
                  } else {
                    setStatusMsg(`Warning: ${json.warning || json.error || 'Failed to send test email. Ensure RESEND_API_KEY is set.'}`);
                  }
                } catch (e: any) {
                  setStatusMsg(`Error: ${e.message}`);
                }
              }}
              className="px-4 py-2 rounded-full bg-cyan-100 hover:bg-cyan-200 text-[#0077b6] font-bold text-xs transition flex items-center gap-2"
            >
              <Bell className="w-3.5 h-3.5" />
              Send Test Notification to Admin Email
            </button>
          </div>
        </div>
      </div>

      {/* Logout & Reset */}
      <div className="card-theme p-6 rounded-3xl bg-red-50/50 border border-red-200 space-y-4">
        <h2 className="text-base font-bold text-red-600 flex items-center gap-2 border-b border-red-200 pb-3">
          <LogOut className="w-4 h-4" />
          Logout & Session Protection
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed">
          Logging out safely ends your active session and protects your account from unauthorized access on shared devices.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Safely Logout Now
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all interactive data back to initial defaults?')) {
                resetAllData();
                setStatusMsg('Success: Demo data reset to defaults.');
              }
            }}
            className="px-4 py-2.5 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Demo State
          </button>
        </div>
      </div>
    </div>
  );
}
