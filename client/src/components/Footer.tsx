'use client';

import React from 'react';
import { SiteSettings } from '@/lib/types';
import { Phone, Mail, MessageCircle, ShieldCheck, Award, Building2 } from 'lucide-react';

interface FooterProps {
  settings?: SiteSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const phone = settings?.contactPhone || '01313893838';
  const whatsapp = (settings?.whatsappNumber || '8801313893838').replace(/\D/g, '');
  const email = settings?.contactEmail || 'info@blueprintlearningacademy.com';

  return (
    <footer className="border-t border-slate-800 bg-[#0b132b] text-slate-300 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        {/* Brand */}
        <div className="sm:col-span-2 space-y-4">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-500 via-blue-500 to-amber-400 opacity-60 blur-lg"></div>
              <img
                src="/logo.png?v=5"
                alt="Blueprint Learning Academy"
                className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain rounded-full shadow-2xl shadow-amber-500/30 transition hover:scale-105"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white block leading-tight truncate">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-blue-400 font-black truncate mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-md text-slate-300">
            Building practical engineering capabilities for Bangladesh’s construction &amp; real estate industry.
            Real developer drawings, actual BOQ, site QA/QC, and technical interview success.
          </p>
          <div className="pt-1">
            <p className="text-xs sm:text-sm text-amber-300 font-extrabold bg-blue-950/70 border border-blue-800/60 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl">
              <span>✨</span> সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-wider mb-4 border-b border-slate-700/80 pb-2 inline-block">
            Quick Navigation
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li><a href="/#courses" className="hover:text-amber-400 transition-colors block py-0.5 font-medium">All Courses</a></li>
            <li><a href="/#about" className="hover:text-amber-400 transition-colors block py-0.5 font-medium">Lead Instructor</a></li>
            <li><a href="/#pillars" className="hover:text-amber-400 transition-colors block py-0.5 font-medium">Why Blueprint Academy</a></li>
            <li><a href="/#payment" className="hover:text-amber-400 transition-colors block py-0.5 font-medium">Payment &amp; bKash Guide</a></li>
            <li><a href="/#faq" className="hover:text-amber-400 transition-colors block py-0.5 font-medium">Frequently Asked Questions</a></li>
            <li><a href="/login" className="hover:text-amber-400 transition-colors block py-0.5 font-bold text-amber-300">Student &amp; Admin Portal →</a></li>
          </ul>
        </div>

        {/* Contact Help */}
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-wider mb-4 border-b border-slate-700/80 pb-2 inline-block">
            Support &amp; Helpline
          </h4>
          <ul className="space-y-3.5 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <a href={`tel:${phone}`} className="hover:text-white font-bold">{phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white font-bold truncate">
                WhatsApp: +{whatsapp}
              </a>
            </li>
            <li className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <a href={`mailto:${email}`} className="hover:text-white font-medium truncate min-w-0">{email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 text-center sm:text-left">
        <p>© {currentYear} {settings?.siteName || 'Blueprint Learning Academy'}. All rights reserved.</p>
        <p className="flex items-center gap-2 justify-center sm:justify-start">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Built for Civil Engineers in Bangladesh
        </p>
      </div>
    </footer>
  );
}
