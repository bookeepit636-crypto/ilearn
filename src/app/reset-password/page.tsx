'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetAccountPassword } = useApp();

  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token') || '';
    const urlEmail = searchParams.get('email') || '';

    setToken(urlToken);
    setEmail(urlEmail);

    // Also parse Supabase access token in hash if present
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      if (type === 'recovery') {
        const accessToken = params.get('access_token');
        if (accessToken) setToken(accessToken);
      }
    }
  }, [searchParams]);

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 6;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score: 0 to 3
  const strengthScore = [hasMinLength, hasLetters, hasNumbers].filter(Boolean).length;
  const strengthText =
    newPassword.length === 0
      ? ''
      : strengthScore <= 1
      ? 'Weak'
      : strengthScore === 2
      ? 'Medium'
      : 'Strong';

  const strengthColor =
    strengthScore <= 1
      ? 'bg-rose-500'
      : strengthScore === 2
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (!email) {
      setErrorMsg('Missing email parameter. Please use the exact link sent to your Gmail inbox.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call server-side API to update in persistent store
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to reset password. The link might have expired.');
        setIsLoading(false);
        return;
      }

      // 2. Also update in client state & localStorage
      await resetAccountPassword(email, newPassword);

      setIsSuccess(true);
      setIsLoading(false);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err: any) {
      setErrorMsg(err?.message || 'A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat overflow-y-auto flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundImage: 'url(/bookkeeping-bg.jpg)' }}
    >
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/85 via-[#0052ad]/65 to-slate-950/90 backdrop-blur-xs" />

      {/* Main Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border border-white/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#023e8a] p-6 text-white text-center space-y-2 shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-white/50 p-1">
            <img
              src="/logo.jpeg"
              alt="BookKeep-It Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight">BookKeep-It</h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
            <span>Secure Password Reset</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-800">Password Changed!</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your BookKeep-It password has been updated securely. You can now sign in using your new credentials.
                </p>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-2 tracking-wide cursor-pointer"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Enter a new secure password for your account{' '}
                  {email ? <strong className="text-slate-800 font-bold">({email})</strong> : ''}.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Strength</span>
                      <span className={strengthScore >= 3 ? 'text-emerald-600' : strengthScore === 2 ? 'text-amber-600' : 'text-rose-600'}>
                        {strengthText}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthScore / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-2.5 text-slate-800 focus:outline-none focus:border-[#0077b6] text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-700 font-bold' : ''}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLetters && hasNumbers ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={hasLetters && hasNumbers ? 'text-emerald-700 font-bold' : ''}>
                    Mix of letters and numbers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isMatch ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={isMatch ? 'text-emerald-700 font-bold' : ''}>
                    Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !hasMinLength || !isMatch}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-cyan-500/30 transition tracking-wide mt-3 cursor-pointer"
              >
                {isLoading ? 'Updating Password...' : 'Reset & Save Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold hover:underline"
                >
                  Cancel & Return to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
