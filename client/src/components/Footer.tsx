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
    <footer className="border-t border-[#2e4666] bg-[#070b12] text-[#bccadb] py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#ffb531] to-[#3a7bb8] opacity-50 blur-sm"></div>
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="relative w-16 h-16 object-contain rounded-full ring-2 ring-[#ffb531] bg-white p-1 shadow-xl shadow-[#ffb531]/20"
              />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block leading-tight">
                {settings?.siteName || (
                  <>
                    Blueprint <span className="text-[#ffb531]">Learning Academy</span>
                  </>
                )}
              </span>
              <span className="block text-xs uppercase tracking-widest text-[#7fb8ea] font-bold mt-0.5">
                {settings?.tagline || 'Real Estate Career Courses for Civil Engineers'}
              </span>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-md text-[#bccadb]/80 mb-4">
            Building practical engineering capabilities for Bangladesh’s construction & real estate industry.
            Real drawings, actual BOQ, site QA/QC, and technical interview success.
          </p>
          <p className="text-xs text-[#7fb8ea] font-medium">
            সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#2e4666] pb-1 inline-block">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/#courses" className="hover:text-[#ffb531] transition">All Courses</a></li>
            <li><a href="/#about" className="hover:text-[#ffb531] transition">Lead Instructor</a></li>
            <li><a href="/#payment" className="hover:text-[#ffb531] transition">Payment & bKash Guide</a></li>
            <li><a href="/#faq" className="hover:text-[#ffb531] transition">Frequently Asked Questions</a></li>
            <li><a href="/login" className="hover:text-[#ffb531] transition">Student Portal</a></li>
          </ul>
        </div>

        {/* Contact Help */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#2e4666] pb-1 inline-block">
            Support & Helpline
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#ffb531] shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-white">{phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25d366] shrink-0" />
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp: +{whatsapp}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7fb8ea] shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#1a2c42] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#728296] gap-4">
        <p>© {currentYear} {settings?.siteName || 'Blueprint Learning Academy'}. All rights reserved.</p>
        <p>Built with Next.js, Express & MongoDB for Civil Engineers in Bangladesh.</p>
      </div>
    </footer>
  );
}
