'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setAuthToken, setCurrentUser } from '@/lib/api';
import { Lock, Mail, ArrowRight, ShieldAlert, KeyRound, CheckCircle, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(res.message || 'Invalid email or password. Please try again.');
    }
  };

  const fillDemo = (role: 'admin' | 'student') => {
    if (role === 'admin') {
      setEmail('admin.blueprintlearning@gmail.com');
      setPassword('adabor14');
    } else {
      setEmail('student@example.com');
      setPassword('student123');
    }
    setErrorMsg('');
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2.5 mb-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-400 to-blue-500 opacity-40 blur-md group-hover:opacity-80 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full ring-2 ring-blue-600/20 bg-white p-1 shadow-md group-hover:scale-105 transition"
              />
            </div>
            <div className="text-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
                Blueprint <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Learning Academy</span>
              </span>
              <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-blue-700 font-extrabold mt-0.5">
                Real Estate Career Courses for Civil Engineers
              </span>
            </div>
          </Link>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-2">
            Sign in to Your Learning Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your course lectures, live meet links, tasks, and instructor discussions.
          </p>
        </div>

        <div className="mt-6 bg-white border border-slate-200 py-6 sm:py-8 px-4 sm:px-8 shadow-xl rounded-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 sm:p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setModalFeedback(null);
                    setOtpSent(false);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-800 transition font-medium"
                >
                  Forgot Password? (Reset via Email OTP)
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block text-center mb-2.5">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-800 transition text-center"
              >
                <span className="block font-bold text-amber-600">Admin Login</span>
                <span className="text-[10px] text-slate-500 truncate block">admin.blueprintlearning</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 text-slate-800 transition text-center"
              >
                <span className="block font-bold text-emerald-600">Student Demo</span>
                <span className="text-[10px] text-slate-500 truncate block">student@example.com</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-blue-700 transition font-semibold">
            ← Back to Academy Homepage
          </Link>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL WITH EMAIL OTP VERIFICATION */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Reset Password via Email OTP</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  modalFeedback.isError
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Enter your registered administrator or student email address. We will send you a 6-digit one-time verification code.
                </p>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin.blueprintlearning@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-xs disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    6-Digit Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="e.g. 482915"
                    className="w-full bg-slate-50 border border-amber-400 rounded-xl px-3 py-2 text-center font-mono text-base font-bold text-amber-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-blue-700 hover:underline"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs disabled:opacity-50"
                  >
                    {otpLoading ? 'Verifying...' : 'Set New Password'}
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
