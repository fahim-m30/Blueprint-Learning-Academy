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
    <nav className="sticky top-0 z-50 bg-[#060a11]/90 backdrop-blur-md border-b border-[#2e4666]">
      {/* Top micro contact banner */}
      <div className="bg-[#0b1624] border-b border-[#1a2c42] py-1.5 px-4 text-xs text-[#bccadb]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-[#ffb531]" />
              <a href={`tel:${phone}`}>{phone}</a>
            </span>
            <span className="hidden sm:inline text-[#2e4666]">|</span>
            <span className="hidden sm:flex items-center gap-1.5 hover:text-white transition">
              <MessageCircle className="w-3.5 h-3.5 text-[#25d366]" />
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp: +{whatsapp}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#7fb8ea] font-medium hidden md:inline">
              Practical Real Estate Engineering Batches Open
            </span>
            {user ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Logged in as {user.name} ({user.role})
              </span>
            ) : (
              <Link href="/login" className="text-[#ffb531] hover:underline flex items-center gap-1">
                Student & Admin Portal
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
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#ffb531] to-[#3a7bb8] opacity-50 blur-sm group-hover:opacity-100 transition duration-300"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full ring-2 ring-[#ffb531] shadow-xl shadow-[#ffb531]/20 bg-white p-1 transition duration-300 group-hover:scale-105"
              />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white block leading-tight">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="text-[#ffb531]">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-[11px] sm:text-xs tracking-widest uppercase text-[#7fb8ea] font-extrabold mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#bccadb]">
            <a href="/#courses" className="hover:text-white transition">
              Courses
            </a>
            <a href="/#about" className="hover:text-white transition">
              Instructor
            </a>
            <a href="/#payment" className="hover:text-white transition">
              How to Pay
            </a>
            <a href="/#faq" className="hover:text-white transition">
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3a7bb8] hover:bg-[#3a7bb8]/80 text-white font-bold text-sm shadow-md transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Portal
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold text-sm shadow-md transition"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    My Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-[#2e4666] text-[#bccadb] hover:text-white hover:bg-[#101c2e] transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#3a7bb8] text-[#f3f7fc] hover:bg-[#101c2e] text-sm font-semibold transition"
                >
                  <LogIn className="w-4 h-4 text-[#7fb8ea]" />
                  Login
                </Link>
                <a
                  href="/#courses"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold text-sm shadow-lg shadow-[#ffb531]/20 transition"
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
