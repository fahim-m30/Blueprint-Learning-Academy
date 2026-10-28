'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, removeAuthToken } from '@/lib/api';
import { SiteSettings } from '@/lib/types';
import { Phone, MessageCircle, LogIn, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  settings?: SiteSettings | null;
}

export default function Navbar({ settings }: NavbarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    window.location.href = '/login';
  };

  const phone = settings?.contactPhone || '01313893838';
  const whatsapp = settings?.whatsappNumber || '8801313893838';

  return (
    <nav className="sticky top-0 z-50 bg-[#080d1a]/90 backdrop-blur-xl border-b border-[#1c2b48] shadow-2xl shadow-black/40">
      {/* Top micro contact banner */}
      <div className="bg-[#050811] border-b border-[#1c2b48]/60 py-1.5 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <a href={`tel:${phone}`}>{phone}</a>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:flex items-center gap-1.5 hover:text-white transition">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp: +{whatsapp}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sky-400 font-semibold hidden md:inline flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Real Estate Engineering Batches Open
            </span>
            {user ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {user.name} ({user.role})
              </span>
            ) : (
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition hover:underline">
                Student &amp; Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 sm:gap-4 group">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-sky-500 to-amber-400 opacity-60 blur-md group-hover:opacity-100 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 bg-white p-1 transition duration-300 group-hover:scale-105"
              />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white block leading-tight">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-[11px] sm:text-xs tracking-widest uppercase text-sky-400 font-extrabold mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <a href="/#courses" className="hover:text-sky-400 transition-colors">
              Courses
            </a>
            <a href="/#about" className="hover:text-sky-400 transition-colors">
              Instructor
            </a>
            <a href="/#payment" className="hover:text-sky-400 transition-colors">
              How to Pay
            </a>
            <a href="/#faq" className="hover:text-sky-400 transition-colors">
              FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Portal
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    My Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-850/60 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-semibold transition duration-150"
                >
                  <LogIn className="w-4 h-4 text-sky-400" />
                  Login
                </Link>
                <a
                  href="/#courses"
                  className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition duration-150"
                >
                  Enroll Now
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
