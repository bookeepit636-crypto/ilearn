'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, Lock, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const AuthScreen: React.FC = () => {
  const router = useRouter();
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [program, setProgram] = useState('Bachelor of Science in Accountancy');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid credentials');
    } else {
      const trimmed = email.trim().toLowerCase();
      if (trimmed.includes('admin') || trimmed === 'admin@bookkeep-it.edu' || trimmed === 'admin@ilearn.edu') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = register(name, email, password, program);
    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@bookkeep-it.edu');
    setPassword('admin123');
    setMode('login');
  };

  const fillStudentCredentials = () => {
    setEmail('alex.morgan@student.ilearn.edu');
    setPassword('student123');
    setMode('login');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat overflow-y-auto flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundImage: 'url(/bookkeeping-bg.jpg)' }}
    >
      {/* Dark & Cyan Overlay covering full viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/80 via-[#0052ad]/60 to-slate-950/85 backdrop-blur-xs" />

      {/* Login / Register Card Modal */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border border-white/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 text-white text-center space-y-2 shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-white/50">
            <img
              src="/logo.jpeg"
              alt="BookKeep-It Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <p className="text-xs text-white/90 font-medium">
            {mode === 'login'
              ? 'Enter your credentials to access BookKeep-It'
              : 'Register to start your bookkeeping learning journey'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-[#0077b6] text-[#0077b6] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Login</span>
          </button>

          <button
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'border-[#0077b6] text-[#0077b6] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition tracking-wide mt-2"
              >
                Log In
              </button>

              {/* Demo Credentials Quick Fill Bar */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Quick Demo Logins:</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillStudentCredentials}
                    className="flex-1 py-1 px-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-[#0077b6] text-[10px] font-bold"
                  >
                    🎓 Student Account
                  </button>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="flex-1 py-1 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold"
                  >
                    🛡️ Fixed Admin
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 pt-1">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-[#0077b6] font-bold hover:underline"
                >
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* MODE 2: REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@ilearn.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Program / Degree</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="BS Accountancy"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition tracking-wide mt-2"
              >
                Create Account & Begin Learning
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-[#0077b6] font-bold hover:underline"
                >
                  Log in here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
