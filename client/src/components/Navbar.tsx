'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, removeAuthToken } from '@/lib/api';
import { SiteSettings } from '@/lib/types';
import { Phone, MessageCircle, LogIn, LayoutDashboard, ShieldCheck, LogOut, Menu, X, ChevronRight } from 'lucide-react';

interface NavbarProps {
  settings?: SiteSettings | null;
}

export default function Navbar({ settings }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <nav className="sticky top-0 z-50 bg-[#080d1a]/95 backdrop-blur-xl border-b border-[#1c2b48] shadow-2xl shadow-black/40">
      {/* Top micro contact banner */}
      <div className="bg-[#050811] border-b border-[#1c2b48]/60 py-1.5 px-3 sm:px-6 text-[11px] sm:text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4 truncate">
            <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-white transition shrink-0">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{phone}</span>
            </a>
            <span className="text-slate-700 hidden xs:inline">|</span>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:flex items-center gap-1.5 hover:text-white transition truncate"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp: +{whatsapp}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sky-400 font-semibold hidden md:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Batches Open
            </span>
            {user ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{user.name}</span>
              </span>
            ) : (
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition hover:underline">
                Portal Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 lg:h-24 py-2">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 lg:gap-4 group min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500 via-sky-500 to-amber-400 opacity-60 blur-md group-hover:opacity-100 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain rounded-full ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 bg-white p-0.5 sm:p-1 transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0">
              <span className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white block leading-tight truncate">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-[9px] xs:text-[10px] sm:text-[11px] lg:text-xs tracking-wider uppercase text-sky-400 font-extrabold truncate mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <a href="/#courses" className="hover:text-amber-400 transition-colors">
              Courses
            </a>
            <a href="/#about" className="hover:text-amber-400 transition-colors">
              Instructor
            </a>
            <a href="/#payment" className="hover:text-amber-400 transition-colors">
              How to Pay
            </a>
            <a href="/#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </div>

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Admin</span> Portal
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">My</span> Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition duration-150"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                  <span>Login</span>
                </Link>
                <a
                  href="/#courses"
                  className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition duration-150"
                >
                  Enroll Now
                </a>
              </>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0f1d] border-b border-[#1c2b48] shadow-2xl px-4 py-5 animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="flex flex-col space-y-1">
            <a
              href="/#courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/70 font-semibold text-sm transition"
            >
              <span>Explore Courses</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/70 font-semibold text-sm transition"
            >
              <span>Lead Instructor</span>
              <ChevronRight className="w-4 h-4 text-sky-400" />
            </a>
            <a
              href="/#payment"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/70 font-semibold text-sm transition"
            >
              <span>Payment &amp; bKash Guide</span>
              <ChevronRight className="w-4 h-4 text-pink-400" />
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/70 font-semibold text-sm transition"
            >
              <span>Frequently Asked Questions</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </a>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Direct Helpline
            </a>
            <a
              href="/#courses"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Enroll in a Course Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
