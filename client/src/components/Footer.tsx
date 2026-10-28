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
  const email = settings?.contactEmail || 'info@concretepathacademy.com';

  return (
    <footer className="border-t border-[#2e4666] bg-[#070b12] text-[#bccadb] py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏗️</span>
            <span className="text-xl font-extrabold text-white">
              Concrete Path <span className="text-[#ffb531]">Academy</span>
            </span>
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
        <p>© {currentYear} Concrete Path Academy. All rights reserved.</p>
        <p>Built with Next.js, Express & MongoDB for Civil Engineers in Bangladesh.</p>
      </div>
    </footer>
  );
}
