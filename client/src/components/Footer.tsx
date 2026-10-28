'use client';

import React from 'react';
import { SiteSettings } from '@/lib/types';
import { Phone, Mail, MessageCircle } from 'lucide-react';

interface FooterProps {
  settings?: SiteSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const phone = settings?.contactPhone || '01313893838';
  const whatsapp = settings?.whatsappNumber || '8801313893838';
  const email = settings?.contactEmail || 'info@blueprintlearningacademy.com';

  return (
    <footer className="border-t border-[#1c2b48] bg-[#050914] text-slate-300 py-14 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500 via-sky-500 to-amber-400 opacity-50 blur-sm"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-16 h-16 object-contain rounded-full ring-2 ring-amber-400 bg-white p-1 shadow-xl shadow-amber-500/20"
              />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block leading-tight">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-xs uppercase tracking-widest text-sky-400 font-extrabold mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-md text-slate-400 mb-4">
            Building practical engineering capabilities for Bangladesh’s construction &amp; real estate industry.
            Real drawings, actual BOQ, site QA/QC, and technical interview success.
          </p>
          <p className="text-xs text-sky-400 font-semibold bg-sky-950/40 border border-sky-800/40 inline-block px-3 py-1 rounded-lg">
            সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-[#1c2b48] pb-1.5 inline-block">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><a href="/#courses" className="hover:text-amber-400 transition-colors">All Courses</a></li>
            <li><a href="/#about" className="hover:text-amber-400 transition-colors">Lead Instructor</a></li>
            <li><a href="/#payment" className="hover:text-amber-400 transition-colors">Payment &amp; bKash Guide</a></li>
            <li><a href="/#faq" className="hover:text-amber-400 transition-colors">Frequently Asked Questions</a></li>
            <li><a href="/login" className="hover:text-amber-400 transition-colors">Student &amp; Admin Portal</a></li>
          </ul>
        </div>

        {/* Contact Help */}
        <div>
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-[#1c2b48] pb-1.5 inline-block">
            Support &amp; Helpline
          </h4>
          <ul className="space-y-3.5 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <a href={`tel:${phone}`} className="hover:text-white font-medium">{phone}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white font-medium">
                WhatsApp: +{whatsapp}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-sky-400" />
              </div>
              <a href={`mailto:${email}`} className="hover:text-white font-medium truncate">{email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#1c2b48] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {currentYear} {settings?.siteName || 'Blueprint Learning Academy'}. All rights reserved.</p>
        <p>Built with Next.js, Express &amp; MongoDB for Civil Engineers in Bangladesh.</p>
      </div>
    </footer>
  );
}
