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
