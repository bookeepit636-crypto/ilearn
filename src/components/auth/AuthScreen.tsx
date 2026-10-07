'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  RotateCw,
  Send,
  ShieldCheck,
  User,
  UserPlus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const AuthScreen: React.FC = () => {
  const router = useRouter();
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [program, setProgram] = useState('Bachelor of Science in Accountancy');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password specific states
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentInfo, setResetSentInfo] = useState<{ email: string; resetUrl?: string } | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid credentials');
    } else {
      const trimmed = email.trim().toLowerCase();
      if (
        trimmed.includes('admin') ||
        trimmed === 'admin@bookkeep-it.edu' ||
        trimmed === 'admin@ilearn.edu' ||
        trimmed === 'admin@gmail.com' ||
        trimmed === 'bookeepit636@gmail.com'
      ) {
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
    } else {
      router.push('/');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSendingReset(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to send reset link. Please try again.');
        setIsSendingReset(false);
        return;
      }

      setResetSentInfo({
        email: trimmedEmail,
        resetUrl: data.resetUrl
      });
      setSuccessMsg(`A password reset link has been dispatched to ${trimmedEmail}.`);
      setIsSendingReset(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to contact password reset service.');
      setIsSendingReset(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat overflow-y-auto flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundImage: 'url(/bookkeeping-bg.jpg)' }}
    >
      {/* Dark & Cyan Overlay covering full viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/85 via-[#0052ad]/65 to-slate-950/90 backdrop-blur-xs" />

      {/* Login / Register / Forgot Card Modal */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border border-white/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 text-white text-center space-y-2 shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-white/50 p-1">
            <img
              src="/logo.jpeg"
              alt="BookKeep-It Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login'
              ? 'Login to BookKeep-It'
              : mode === 'register'
              ? 'Create Account'
              : 'Reset Password'}
          </h2>
          <p className="text-xs text-white/90 font-medium">
            {mode === 'login'
              ? 'Enter your credentials to access BookKeep-It LMS'
              : mode === 'register'
              ? 'Register to start your interactive bookkeeping journey'
              : 'Enter your registered Gmail to receive a password reset link'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
              setResetSentInfo(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
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
              setSuccessMsg('');
              setResetSentInfo(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'border-[#0077b6] text-[#0077b6] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>

          {mode === 'forgot' && (
            <button
              className="flex-1 py-3 text-center transition border-b-2 flex items-center justify-center gap-1.5 border-[#0077b6] text-[#0077b6] bg-white"
            >
              <KeyRound className="w-4 h-4" />
              <span>Forgot Pass</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && !resetSentInfo && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
              ✓ {successMsg}
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
                    placeholder="student@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                      setResetSentInfo(null);
                    }}
                    className="text-[#0077b6] hover:text-[#023e8a] font-bold hover:underline transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition tracking-wide mt-2 cursor-pointer"
              >
                Log In
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Need an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[#0077b6] font-bold hover:underline cursor-pointer"
                >
                  Create Account here
                </button>
              </div>
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
                    placeholder="e.g. Maria Santos"
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
                    placeholder="student@gmail.com"
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
                    placeholder="Create a password (min. 6 characters)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition tracking-wide mt-2 cursor-pointer"
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
                    setSuccessMsg('');
                  }}
                  className="text-[#0077b6] font-bold hover:underline cursor-pointer"
                >
                  Log in here
                </button>
              </p>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-4 text-xs">
              {resetSentInfo ? (
                <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center text-[#0077b6] shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-[#0077b6]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-800">
                      Reset Link Sent to Gmail!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                      We sent a secure password reset link to{' '}
                      <strong className="text-slate-900 font-bold">{resetSentInfo.email}</strong>.
                      Please check your Gmail inbox (and Spam/Junk folder) to choose a new password.
                    </p>
                  </div>

                  {/* Direct shortcut button for local testing and immediate verification */}
                  {resetSentInfo.resetUrl && (
                    <div className="pt-2">
                      <a
                        href={resetSentInfo.resetUrl}
                        className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Open Reset Password Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleForgotPasswordSubmit}
                      disabled={isSendingReset}
                      className="text-[#0077b6] hover:text-[#023e8a] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className={`w-3 h-3 ${isSendingReset ? 'animate-spin' : ''}`} />
                      <span>Resend Email</span>
                    </button>

                    <span className="text-slate-300">•</span>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                        setResetSentInfo(null);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Enter the email address registered with your BookKeep-It account. We will send you a secure link to reset your password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-2 tracking-wide cursor-pointer"
                  >
                    {isSendingReset ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Sending Link to Gmail...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Reset Link to Gmail</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-slate-500 hover:text-slate-800 text-xs font-bold hover:underline cursor-pointer"
                    >
                      Remember your password? Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
