'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setAuthToken, setCurrentUser, getAuthToken, getCurrentUser } from '@/lib/api';
import { Lock, Mail, ArrowRight, ShieldAlert, KeyRound, CheckCircle, X, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect straight to the appropriate dashboard
  useEffect(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    if (token && user) {
      if (user.role === 'admin') {
        window.location.replace('/admin');
      } else {
        window.location.replace('/dashboard');
      }
    }
  }, []);

  // Forgot password OTP modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      setCurrentUser(res.data.user);

      if (res.data.user.role === 'admin') {
        window.location.replace('/admin');
      } else {
        window.location.replace('/dashboard');
      }
    } else {
      setErrorMsg(res.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setModalFeedback({ text: 'Please enter your registered email.', isError: true });
      return;
    }
    setOtpLoading(true);
    setModalFeedback(null);
    const res = await apiRequest('/auth/request-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email: resetEmail.trim() }),
    });
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
      setModalFeedback({ text: res.message || 'Verification code sent to your email.', isError: false });
    } else {
      setModalFeedback({ text: res.message || 'Error sending code.', isError: true });
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPass) {
      setModalFeedback({ text: 'Please provide both the 6-digit code and your new password.', isError: true });
      return;
    }
    setOtpLoading(true);
    setModalFeedback(null);
    const res = await apiRequest('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: resetEmail.trim(),
        otp: resetOtp.trim(),
        newPassword: newPass,
      }),
    });
    setOtpLoading(false);
    if (res.success) {
      setModalFeedback({ text: 'Password reset successful! Please log in with your new password.', isError: false });
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword(newPass);
        setEmail(resetEmail);
      }, 1500);
    } else {
      setModalFeedback({ text: res.message || 'Invalid or expired code.', isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Ambient Radial Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-blue-500/8 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-amber-500/6 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-400 via-blue-500 to-indigo-600 opacity-40 blur-lg group-hover:opacity-75 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full ring-4 ring-blue-600/20 bg-white p-1.5 shadow-xl group-hover:scale-105 transition"
              />
            </div>
            <div className="text-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 block tracking-tight">
                Blueprint <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">Learning Academy</span>
              </span>
              <span className="block text-xs sm:text-sm uppercase tracking-widest text-blue-700 font-extrabold mt-1">
                Real Estate Career Courses for Civil Engineers
              </span>
            </div>
          </Link>

          <div className="pt-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Sign in to Your Learning Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
              Access your class recordings, live Google Meet sessions, downloadable drawings, and instructor support.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white border border-slate-200/90 py-8 sm:py-10 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="leading-relaxed font-semibold">{errorMsg}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Email Address / ব্যবহারকারীর ইমেইল *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 outline-none transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Password / পাসওয়ার্ড *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setModalFeedback(null);
                    setOtpSent(false);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-800 transition font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 outline-none transition font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40 flex items-center justify-center gap-2.5 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Official Verified Portal
            </span>
            <span className="text-slate-400">SSL Encrypted Session</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700 transition font-bold">
            ← Return to Academy Homepage
          </Link>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">Reset Your Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                  modalFeedback.isError
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered student or admin email. We will send a secure 6-digit one-time verification code (OTP).
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email *</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending OTP...' : 'Send 6-Digit Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  A verification code has been dispatched to <strong>{resetEmail}</strong>.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit Code (OTP) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="e.g. 482915"
                    className="w-full bg-slate-50 border border-amber-400 rounded-xl px-3.5 py-2.5 text-center font-mono text-lg font-black tracking-widest text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50"
                  >
                    {otpLoading ? 'Updating Password...' : 'Verify & Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
