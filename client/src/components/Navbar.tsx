'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, removeAuthToken } from '@/lib/api';
import { SiteSettings } from '@/lib/types';
import { Phone, MessageCircle, LogIn, LayoutDashboard, ShieldCheck, LogOut, Menu, X, ChevronRight, Sparkles } from 'lucide-react';

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
  const whatsapp = (settings?.whatsappNumber || '8801313893838').replace(/\D/g, '');

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs">
      {/* Top micro contact banner */}
      <div className="bg-[#0b132b] text-slate-300 py-1.5 px-3 sm:px-6 text-[11px] sm:text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4 truncate">
            <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-white transition shrink-0 font-medium">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{phone}</span>
            </a>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:flex items-center gap-1.5 hover:text-white transition truncate font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp: +{whatsapp}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-blue-300 font-bold hidden md:inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-800/50 px-2.5 py-0.5 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Batches Open (50% Off)
            </span>
            {user ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="truncate max-w-[100px] sm:max-w-[150px]">{user.name}</span>
              </span>
            ) : (
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-extrabold transition hover:underline flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22 lg:h-24 py-2 sm:py-2.5">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 xs:gap-3.5 sm:gap-4 group min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400 via-blue-500 to-indigo-600 opacity-45 blur-md group-hover:opacity-85 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 object-contain rounded-full ring-2 xs:ring-3 ring-amber-400/90 shadow-lg shadow-blue-950/15 bg-white p-1 sm:p-1.5 transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0">
              <span className="text-base xs:text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-950 block leading-tight truncate">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-[9px] xs:text-[10px] sm:text-[11px] lg:text-xs tracking-wider uppercase text-blue-700 font-black truncate mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="/#courses" className="hover:text-blue-700 transition-colors py-1">
              Courses
            </a>
            <a href="/#about" className="hover:text-blue-700 transition-colors py-1">
              Instructor
            </a>
            <a href="/#pillars" className="hover:text-blue-700 transition-colors py-1">
              Why Blueprint
            </a>
            <a href="/#payment" className="hover:text-blue-700 transition-colors py-1">
              How to Pay
            </a>
            <a href="/#faq" className="hover:text-blue-700 transition-colors py-1">
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
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden xs:inline">Admin</span> Portal
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 transition"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden xs:inline">My</span> Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 text-xs sm:text-sm font-bold transition duration-150 shadow-2xs"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <span>Login</span>
                </Link>
                <a
                  href="/#courses"
                  className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition duration-150 hover:scale-105"
                >
                  Explore Courses
                </a>
              </>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-blue-700" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-4 py-5 animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="flex flex-col space-y-1">
            <a
              href="/#courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition"
            >
              <span>Explore Courses</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition"
            >
              <span>Lead Instructor Profile</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </a>
            <a
              href="/#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition"
            >
              <span>Why Blueprint Academy</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </a>
            <a
              href="/#payment"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition"
            >
              <span>Payment &amp; bKash Guide</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-800 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition"
            >
              <span>Frequently Asked Questions</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              user.role === 'admin' ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 text-white font-black text-center text-sm shadow-md"
                >
                  Go to Admin Portal
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-center text-sm shadow-md"
                >
                  Open My Student Dashboard
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-center text-sm shadow-xs"
                >
                  Sign in to Learning Portal
                </Link>
                <a
                  href="/#courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-center text-sm shadow-md"
                >
                  Enroll in a Course
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
