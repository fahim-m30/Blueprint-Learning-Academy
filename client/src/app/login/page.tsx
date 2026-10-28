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
      setEmail('admin@careerpath.com');
      setPassword('admin123');
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
    <div className="min-h-screen bg-[#060a11] text-[#f3f7fc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3a7bb8]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="Blueprint Learning Academy"
              className="w-12 h-12 object-contain rounded-full ring-2 ring-[#ffb531]/60 bg-white p-0.5 shadow-lg"
            />
            <span className="text-2xl font-extrabold text-white">
              Blueprint <span className="text-[#ffb531]">Learning Academy</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white mt-2">
            Sign in to Your Learning Portal
          </h2>
          <p className="text-xs text-[#bccadb] mt-1">
            Access your course lectures, live meet links, tasks, and instructor discussions.
          </p>
        </div>

        <div className="mt-8 bg-[#101c2e] border-2 border-[#2e4666] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-950/70 border border-red-500 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#728296]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#728296]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
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
                  className="text-xs text-[#7fb8ea] hover:text-[#ffb531] transition font-medium"
                >
                  Forgot Password? (Reset via Email OTP)
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold text-sm shadow-lg shadow-[#ffb531]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Buttons for Ease of Testing */}
          <div className="mt-6 pt-5 border-t border-[#1a2c42]">
            <span className="text-[11px] font-semibold text-[#7fb8ea] uppercase tracking-wider block text-center mb-2.5">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="p-2 rounded-lg bg-[#08111d] border border-[#3a7bb8] text-white hover:bg-[#3a7bb8]/20 transition text-center"
              >
                <span className="block font-bold text-[#ffb531]">Admin Demo</span>
                <span className="text-[10px] text-[#bccadb]">admin@careerpath.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="p-2 rounded-lg bg-[#08111d] border border-[#3a7bb8] text-white hover:bg-[#3a7bb8]/20 transition text-center"
              >
                <span className="block font-bold text-emerald-400">Student Demo</span>
                <span className="text-[10px] text-[#bccadb]">student@example.com</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#bccadb] hover:text-[#ffb531] transition">
            ← Back to Homepage
          </Link>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL WITH EMAIL OTP VERIFICATION */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101c2e] border-2 border-[#3a7bb8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e4666]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#ffb531]" />
                <h3 className="text-base font-bold text-white">Reset Password via Email OTP</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-[#bccadb] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  modalFeedback.isError
                    ? 'bg-red-950/70 border-red-500 text-red-200'
                    : 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-3 text-xs">
                <p className="text-[#bccadb]">
                  Enter your registered administrator or student email address. We will send you a 6-digit one-time verification code.
                </p>
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@careerpath.com"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#2e4666] text-[#bccadb]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-4 py-2 rounded-lg bg-[#ffb531] text-[#1a1100] font-bold shadow disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending...' : 'Send Verification Code (OTP)'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">
                    6-Digit Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="e.g. 482915"
                    className="w-full bg-[#08111d] border border-[#ffb531] rounded-lg px-3 py-2 text-center font-mono text-base font-bold text-[#ffb531] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-[#7fb8ea] hover:underline"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow disabled:opacity-50"
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
