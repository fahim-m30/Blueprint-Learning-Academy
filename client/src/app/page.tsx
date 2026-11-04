'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseModal from '@/components/CourseModal';
import EnrollmentModal from '@/components/EnrollmentModal';
import { apiRequest } from '@/lib/api';
import { Course, SiteSettings, CourseNotice } from '@/lib/types';
import { DEFAULT_COURSES, DEFAULT_SETTINGS } from '@/lib/initialData';
import {
  Clock,
  BookOpen,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Award,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  CalendarCheck,
  Users,
  Layers,
  Check,
  Copy,
  ExternalLink,
  Briefcase,
  GraduationCap,
  HardHat,
  Star,
  Bell,
  Pin,
  Calendar,
  Rocket,
  Palmtree,
  Megaphone,
  CalendarDays,
  Play,
  Video,
  Radio,
  Maximize2,
  X,
} from 'lucide-react';

function getEmbedVideoInfo(url?: string): { embedUrl: string | null; isDirectVideo: boolean; rawUrl: string } {
  if (!url) return { embedUrl: null, isDirectVideo: false, rawUrl: '' };
  const trimmed = url.trim();

  if (trimmed.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return { embedUrl: trimmed, isDirectVideo: true, rawUrl: trimmed };
  }

  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`,
      isDirectVideo: false,
      rawUrl: trimmed,
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isDirectVideo: false,
      rawUrl: trimmed,
    };
  }

  return { embedUrl: trimmed, isDirectVideo: false, rawUrl: trimmed };
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [settings, setSettings] = useState<SiteSettings | null>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Modal states
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);

  // Dedicated Course Demo Preview Video selector state
  const [selectedDemoCourseId, setSelectedDemoCourseId] = useState<string>('all');
  // Theater mode state for watching demo video in full-screen cinema mode inside website
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  // Close theater mode on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTheaterMode(false);
      }
    };
    if (isTheaterMode) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isTheaterMode]);

  // Live Notice Board states
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<'all' | 'batch_start' | 'vacation' | 'special_notice'>('all');
  const [noticeCourseFilter, setNoticeCourseFilter] = useState<string>('all');
  const [notices, setNotices] = useState<CourseNotice[]>([]);

  useEffect(() => {
    // 1. Immediately hydrate from localStorage if previous fresh data was cached
    try {
      const cachedCourses = localStorage.getItem('bpa_cached_courses');
      const cachedSettings = localStorage.getItem('bpa_cached_settings');
      if (cachedCourses) {
        const parsed = JSON.parse(cachedCourses);
        if (Array.isArray(parsed) && parsed.length > 0) setCourses(parsed);
      }
      if (cachedSettings) {
        const parsed = JSON.parse(cachedSettings);
        if (parsed?.siteName) setSettings(parsed);
      }
    } catch (e) {
      // ignore JSON errors
    }

    // 2. Fetch fresh updates in the background (Stale-While-Revalidate pattern)
    async function loadData() {
      const [coursesRes, settingsRes, noticesRes] = await Promise.all([
        apiRequest<{ courses: Course[] }>('/public/courses'),
        apiRequest<{ settings: SiteSettings }>('/public/settings'),
        apiRequest<{ notices: CourseNotice[] }>('/public/notices'),
      ]);

      if (coursesRes.success && coursesRes.data?.courses && coursesRes.data.courses.length > 0) {
        setCourses(coursesRes.data.courses);
        try {
          localStorage.setItem('bpa_cached_courses', JSON.stringify(coursesRes.data.courses));
        } catch {}
      }
      if (settingsRes.success && settingsRes.data?.settings) {
        setSettings(settingsRes.data.settings);
        try {
          localStorage.setItem('bpa_cached_settings', JSON.stringify(settingsRes.data.settings));
        } catch {}
      }
      if (noticesRes.success && noticesRes.data?.notices) {
        setNotices(noticesRes.data.notices);
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Derive all active notices from public API or from course data
  const allAvailableNotices: CourseNotice[] =
    notices.length > 0
      ? notices
      : courses.flatMap((c) => {
          const list: CourseNotice[] = (c.notices || []).map((n) => ({
            ...n,
            courseId: c._id,
            courseTitle: c.title,
            courseSlug: c.slug,
          }));
          if (c.batchStartDate && !list.some((n) => n.category === 'batch_start')) {
            list.push({
              _id: `auto-${c._id}`,
              title: `Batch Enrollment Open - Starts ${c.batchStartDate}`,
              content: `Official live classes start from ${c.batchStartDate}. Weekly schedule: ${c.batchSchedule || 'Fri & Sat 8:30 PM'}. Limited mentorship seats.`,
              category: 'batch_start',
              date: c.batchStartDate,
              isPinned: true,
              createdAt: c.createdAt || new Date().toISOString(),
              courseId: c._id,
              courseTitle: c.title,
              courseSlug: c.slug,
            });
          }
          return list;
        });

  const filteredNotices = allAvailableNotices
    .filter((n) => noticeCategoryFilter === 'all' || n.category === noticeCategoryFilter)
    .filter((n) => noticeCourseFilter === 'all' || n.courseId === noticeCourseFilter);

  const phone = settings?.contactPhone || '01313893838';
  const whatsapp = (settings?.whatsappNumber || '8801313893838').replace(/\D/g, '');
  const selectedDemoCourse = courses.find((c) => c._id === selectedDemoCourseId) || null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <Navbar settings={settings} />

      {/* =========================================================================
          HERO SECTION: High-Impact, Trust-Driven & Visually Elegant
      ========================================================================= */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-[#f8fafc] border-b border-slate-200/80">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[550px] h-80 sm:h-[550px] bg-blue-500/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-amber-500/7 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Badge with Stars */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 text-xs sm:text-sm font-extrabold shadow-xs max-w-full">
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-slate-400">|</span>
                <span className="truncate">{settings?.heroBadgeText || "Bangladesh's #1 Practical Civil Engineering Academy"}</span>
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[68px] font-black tracking-[-0.035em] leading-[1.08] text-slate-950">
                {settings?.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>
                    Build a real estate career as a{' '}
                    <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                      civil engineer
                    </span>{' '}
                    in Bangladesh.
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                {settings?.heroSubtitle ||
                  'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.'}
              </p>

              {/* Bengali Highlight Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50/60 border-l-4 border-amber-500 border-y border-r border-amber-200 shadow-sm">
                <p className="text-amber-950 font-black text-sm sm:text-base md:text-lg leading-snug flex items-center gap-2">
                  <span className="text-amber-600">✨</span> {(!settings?.heroBengaliNote || /\?{2,}/.test(settings.heroBengaliNote) || settings.heroBengaliNote.includes('???'))
                    ? 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।'
                    : settings.heroBengaliNote}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 pt-2 flex-wrap">
                <a
                  href="#courses"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40 flex items-center justify-center gap-2 transition duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Explore All 6 Courses <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href="#demo-class"
                  className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition duration-200 border border-slate-800 hover:-translate-y-0.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  ফ্রি ডেমো ক্লাস ও ভিডিও <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}?text=Hello!%20I%20want%20to%20learn%20more%20about%20Blueprint%20Learning%20Academy%20courses.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition duration-200 shadow-xs hover:shadow-sm"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" /> Talk to Lead Instructor
                </a>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-7 sm:pt-8 border-t border-slate-200 max-w-lg">
                <div>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl font-black text-blue-700 tracking-tight">{settings?.statsCourses || '6+'}</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-bold leading-tight block mt-1">Industry Courses</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">{settings?.statsExperience || '10+ Yrs'}</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-bold leading-tight block mt-1">Field Experience</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 tracking-tight">{settings?.statsMentorTag || 'BUET'}</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-bold leading-tight block mt-1">Graduate Mentor</span>
                </div>
              </div>
            </div>

            {/* Right Column: Instructor Photo Portrait Card */}
            <div className="lg:col-span-5 flex justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-[320px] xs:max-w-xs sm:max-w-md">
                {/* Glow Background */}
                <div className="absolute -inset-3 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-amber-500/15 to-indigo-500/20 opacity-80 blur-2xl"></div>

                {/* Photo Container */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-blue-950/10 bg-white group">
                  <img
                    src={settings?.instructorImage || "/instructor.jpg?v=2"}
                    alt={`${settings?.instructorName || 'Engr. Md Abdul Mazid'}, Civil Engineer and Lead Instructor at Blueprint Learning Academy`}
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent"></div>

                  {/* Verified Badge Top Corner */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-950 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>BUET Verified Mentor</span>
                  </div>

                  {/* Floating Bio Card on Image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-950 p-4 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <span className="block font-black text-sm sm:text-base text-slate-950">{settings?.instructorName || 'Engr. Md Abdul Mazid'}</span>
                      <span className="block text-xs text-blue-700 font-extrabold mt-0.5">
                        {settings?.instructorDegree || 'B.Sc. in Civil Engineering (BUET)'}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black shrink-0">
                      {settings?.instructorShortExp || '10+ Yrs Exp'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACADEMY NOTICE BOARD & BATCH SCHEDULES (Interactive Notice Center)
      ========================================================================= */}
      <section id="notices" className="py-10 sm:py-14 bg-gradient-to-b from-white via-slate-50/70 to-white border-b border-slate-200/90 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-slate-200/80 pb-6">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Megaphone className="w-3.5 h-3.5" />
                Academy Live Notice Board
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                Batch Start Dates, Holidays &amp; <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Official Notices</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                Check when each course starts, upcoming holiday breaks, and special announcements directly from instructor Engr. Md Abdul Mazid.
              </p>
            </div>

            {/* Course Filter Dropdown */}
            <div className="flex items-center gap-2 self-start md:self-end">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">Filter Course:</span>
              <select
                value={noticeCourseFilter}
                onChange={(e) => setNoticeCourseFilter(e.target.value)}
                className="bg-white border-2 border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 outline-none shadow-sm cursor-pointer"
              >
                <option value="all">All Courses ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {[
              { id: 'all', label: 'All Notices', count: allAvailableNotices.length },
              { id: 'batch_start', label: '🚀 Batch Start Dates', count: allAvailableNotices.filter((n) => n.category === 'batch_start').length },
              { id: 'vacation', label: '🌴 Vacations & Holidays', count: allAvailableNotices.filter((n) => n.category === 'vacation').length },
              { id: 'special_notice', label: '📢 Special Announcements', count: allAvailableNotices.filter((n) => n.category === 'special_notice').length },
            ].map((tab) => {
              const active = noticeCategoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setNoticeCategoryFilter(tab.id as any)}
                  className={`px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition duration-200 ${
                    active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      active ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notice Cards Grid */}
          {filteredNotices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 text-left">
              {filteredNotices.map((notice, idx) => {
                const isBatch = notice.category === 'batch_start';
                const isVacation = notice.category === 'vacation';
                const isSpecial = notice.category === 'special_notice';

                const targetCourse = courses.find((c) => c._id === notice.courseId);

                return (
                  <div
                    key={notice._id || idx}
                    className={`relative rounded-2xl bg-white border-2 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      isBatch
                        ? 'border-emerald-200 hover:border-emerald-500 shadow-xs'
                        : isVacation
                        ? 'border-amber-200 hover:border-amber-500 shadow-xs'
                        : 'border-blue-200 hover:border-blue-600 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                            isBatch
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : isVacation
                              ? 'bg-amber-50 text-amber-900 border border-amber-300'
                              : 'bg-indigo-50 text-indigo-900 border border-indigo-300'
                          }`}
                        >
                          {isBatch && '🚀 Next Batch Start'}
                          {isVacation && '🌴 Vacation / Holiday'}
                          {isSpecial && '📢 Special Masterclass'}
                          {!isBatch && !isVacation && !isSpecial && 'ℹ️ Notice'}
                        </span>

                        {notice.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <Pin className="w-3 h-3 fill-amber-500 text-amber-600" /> Pinned
                          </span>
                        )}
                      </div>

                      {/* Course Title Badge */}
                      {notice.courseTitle && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-200/60 px-2.5 py-1 rounded-lg w-fit">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[260px]">{notice.courseTitle}</span>
                        </div>
                      )}

                      {/* Notice Title */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {notice.title}
                      </h3>

                      {/* Date Pill if available */}
                      {notice.date && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800">
                          <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{notice.date}</span>
                        </div>
                      )}

                      {/* Description Content */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {notice.content}
                      </p>
                    </div>

                    {/* Bottom CTA / Action */}
                    {targetCourse && (
                      <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCourseForDetails(targetCourse)}
                          className="text-xs font-bold text-slate-600 hover:text-blue-700 transition flex items-center gap-1"
                        >
                          <span>Syllabus</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCourseForEnroll(targetCourse)}
                          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition"
                        >
                          <span>Enroll This Batch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-700">No notices found for this filter</h4>
              <p className="text-xs text-slate-500">Check back soon or select another course/filter above.</p>
              <button
                type="button"
                onClick={() => {
                  setNoticeCategoryFilter('all');
                  setNoticeCourseFilter('all');
                }}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          INFINITE MARQUEE ROW (All 6 Specializations)
      ========================================================================= */}
      <section className="py-7 sm:py-9 bg-[#fcfdff] border-b border-slate-200/90 overflow-hidden relative shadow-sm">
        {/* Left & Right Edge Vignette Fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#fcfdff] via-[#fcfdff]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#fcfdff] via-[#fcfdff]/80 to-transparent z-10" />

        <div className="animate-infinite-scroll flex gap-5 sm:gap-6 items-center">
          {[
            { title: 'Real Estate Job Interview Success', tag: 'Career & Interview', icon: Award },
            { title: 'Civil Software: AutoCAD, ETABS & Excel', tag: 'Software Mastery', icon: Layers },
            { title: 'Site & Project Engineering Mastery', tag: 'Site Execution', icon: Building2 },
            { title: 'Estimation, BOQ & Cost Control', tag: 'BOQ & Budgeting', icon: FileSpreadsheet },
            { title: 'MS Project Scheduling & Planning', tag: 'Project Planning', icon: CalendarCheck },
            { title: 'Structural Drawing QA/QC & BBS Detailing', tag: 'QA/QC & Detailing', icon: ShieldCheck },
            { title: 'Real Estate Job Interview Success', tag: 'Career & Interview', icon: Award },
            { title: 'Civil Software: AutoCAD, ETABS & Excel', tag: 'Software Mastery', icon: Layers },
            { title: 'Site & Project Engineering Mastery', tag: 'Site Execution', icon: Building2 },
            { title: 'Estimation, BOQ & Cost Control', tag: 'BOQ & Budgeting', icon: FileSpreadsheet },
            { title: 'MS Project Scheduling & Planning', tag: 'Project Planning', icon: CalendarCheck },
            { title: 'Structural Drawing QA/QC & BBS Detailing', tag: 'QA/QC & Detailing', icon: ShieldCheck },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3.5 sm:gap-4 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-blue-600 shadow-sm hover:shadow-lg hover:shadow-blue-900/10 hover:-translate-y-0.5 transition-all duration-300 shrink-0 group cursor-default"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100/80 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition duration-300 shadow-sm shrink-0">
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {item.tag}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition block whitespace-nowrap">
                    {item.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          FREE DEMO CLASS & RECORDED VIDEO PREVIEW (#demo-class)
      ========================================================================= */}
      {(settings?.demoSectionEnabled ?? true) && (
        <section id="demo-class" className="py-16 sm:py-24 bg-gradient-to-b from-[#091429] via-[#0d1d3a] to-[#0a162b] text-white relative overflow-hidden border-b border-slate-800">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-black tracking-wide shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
                <span>🔴 ফ্রি লাইভ ডেমো ও রেকর্ডেড ক্লাস প্রিভিউ</span>
              </div>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {settings?.demoClassTitle || 'ফ্রি লাইভ ডেমো ক্লাস ও প্র্যাকটিক্যাল ভিডিও প্রিভিউ'}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed">
                {settings?.demoClassSubtitle || 'কোর্সে ভর্তি হওয়ার আগেই আমাদের টিচিং কোয়ালিটি ও রিয়েল প্রজেক্ট সাইট সেশন দেখে নিন।'}
              </p>
            </div>

            {/* Interactive Course Demo Video Selector (Horizontal Scrollable Carousel) */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-3 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">
                    যে কোর্সের ডেমো দেখতে চান ক্লিক করুন:
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('demo-course-scroll-container');
                      if (el) el.scrollBy({ left: -260, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('demo-course-scroll-container');
                      if (el) el.scrollBy({ left: 260, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Bar */}
              <div
                id="demo-course-scroll-container"
                className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                <button
                  type="button"
                  onClick={() => setSelectedDemoCourseId('all')}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 shrink-0 border ${
                    selectedDemoCourseId === 'all'
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>🌟 একাডেমি মাস্টার ডেমো</span>
                </button>

                {courses.map((c, idx) => {
                  const isSelected = selectedDemoCourseId === c._id;
                  const hasCustomVideo = Boolean(c.demoVideoUrl);
                  return (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => setSelectedDemoCourseId(c._id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 shrink-0 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02]'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        0{idx + 1}
                      </span>
                      <span>{c.title}</span>
                      {hasCustomVideo ? (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-slate-950 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Grid: Left (Live Demo Class CTA Card), Right (Embedded Video Player) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              
              {/* Left Column: Live Demo Class Card (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 shadow-2xl relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-6">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      ১টি কমন লাইভ ডেমো ক্লাস
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Google Meet (১টি লিংক)
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      সরাসরি লাইভ ডেমো ক্লাসে অংশ নিন
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      সব বিষয়ের শিক্ষার্থীদের জন্য প্রতি সপ্তাহে <strong>১টি কমন লাইভ গুগল মিট সেশন</strong> অনুষ্ঠিত হয়। আর প্রতিটি কোর্সের আলাদা আলাদা <strong>রেকর্ড করা প্র্যাকটিক্যাল ডেমো ক্লাস</strong> ডানপাশের প্লেয়ার থেকে যেকেউ ওয়েবসাইটেই সরাসরি দেখতে পারবেন।
                    </p>
                  </div>

                  {/* Schedule Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-amber-400 font-extrabold">সরাসরি লাইভ ক্লাসের শিডিউল</span>
                      <span className="block text-sm sm:text-base font-black text-white mt-0.5">
                        {settings?.demoClassDateText || 'প্রতি শুক্রবার রাত ৯:০০ টা (সরাসরি গুগল মিট)'}
                      </span>
                    </div>
                  </div>

                  {/* Benefit Points */}
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>রিয়েল এস্টেট প্রজেক্টের আসল সাইট ড্রয়িং ও বিওকিউ (BOQ) বিশ্লেষণ</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>সাইট ইঞ্জিনিয়ারিং ও জব ইন্টারভিউ প্রস্তুতির বাস্তব রূপরেখা</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>সরাসরি প্রশ্ন-উত্তর ও ক্যারিয়ার কাউন্সেলিং সেশন</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
                  <a
                    href={settings?.demoClassLink || 'https://meet.google.com/new'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
                    <span>{settings?.demoClassBtnText || 'লাইভ ডেমো ক্লাসে যোগ দিন'}</span>
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                  </a>

                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি ব্লুপ্রিন্ট লার্নিং একাডেমির ফ্রি লাইভ ডেমো ক্লাসের লিংক ও শিডিউল পেতে চাই।')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>হোয়াটসঅ্যাপে ডেমো ক্লাসের লিংক ও রিমাইন্ডার নিন</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Demo Recorded Video Player (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 shadow-2xl relative">
                <div className="space-y-4">
                  {/* Top Header of Video */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                      <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                        {selectedDemoCourse ? `${selectedDemoCourse.title} - রেকর্ড করা ডেমো ক্লাস` : 'একাডেমি মাস্টার ডেমো ক্লাস'}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
                      HD Quality • 100% In-Site Playback
                    </span>
                  </div>

                  {/* Course Context Card if Course is Selected */}
                  {selectedDemoCourse && (
                    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-amber-400 font-black block">সিলেক্টেড কোর্স ডেমো:</span>
                        <span className="text-xs sm:text-sm font-black text-white block mt-0.5">{selectedDemoCourse.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCourseForEnroll(selectedDemoCourse)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs hover:scale-105 transition shadow-sm"
                        >
                          ভর্তি হন (৳{selectedDemoCourse.price})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCourseForDetails(selectedDemoCourse)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition"
                        >
                          সিলেবাস
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Video Player Container */}
                  {(() => {
                    const videoToPlay = selectedDemoCourse?.demoVideoUrl || settings?.demoVideoUrl;
                    const videoInfo = getEmbedVideoInfo(videoToPlay);
                    const videoTitle = selectedDemoCourse
                      ? (selectedDemoCourse.demoVideoTitle || `${selectedDemoCourse.title} - ডেমো ক্লাস`)
                      : (settings?.demoVideoTitle || 'সাইট এক্সিকিউশন ও বিওকিউ (BOQ) প্র্যাকটিক্যাল ডেমো ক্লাস');

                    return (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl group/player">
                        {/* Overlay Theater Mode Button on Player */}
                        <button
                          type="button"
                          onClick={() => setIsTheaterMode(true)}
                          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 text-amber-400 hover:text-amber-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-md shadow-lg transition hover:scale-105 cursor-pointer"
                          title="বড় পর্দায় (Theater Mode) দেখুন"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>বড় পর্দায় দেখুন</span>
                        </button>

                        {videoInfo.isDirectVideo ? (
                          <video
                            controls
                            className="w-full h-full object-cover"
                            src={videoInfo.embedUrl || ''}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : videoInfo.embedUrl ? (
                          <iframe
                            src={videoInfo.embedUrl}
                            title={videoTitle}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                            <Video className="w-12 h-12 text-slate-600 mb-2" />
                            <p className="text-sm">Video link not configured yet for this course.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Video Metadata & Info */}
                  <div className="pt-2">
                    <h4 className="text-lg sm:text-xl font-black text-white">
                      {selectedDemoCourse
                        ? (selectedDemoCourse.demoVideoTitle || `${selectedDemoCourse.title} - ডেমো ক্লাস ও প্র্যাকটিক্যাল প্রিভিউ`)
                        : (settings?.demoVideoTitle || 'সাইট এক্সিকিউশন ও বিওকিউ (BOQ) প্র্যাকটিক্যাল ডেমো ক্লাস')}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                      {selectedDemoCourse
                        ? (selectedDemoCourse.demoVideoDescription || selectedDemoCourse.shortDescription)
                        : (settings?.demoVideoDescription || 'বাস্তব প্রজেক্টের আর্কিটেকচারাল ও স্ট্রাকচারাল ড্রয়িং থেকে কাস্টিং ও সাইট ম্যানেজমেন্টের বাস্তব সেশন দেখুন।')}
                    </p>
                  </div>
                </div>

                {/* Bottom Footer Action */}
                <div className="pt-5 mt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <span>প্র্যাকটিক্যাল সাইট ট্রেইনিং • বুয়েট ইঞ্জিনিয়ার ইন্সট্রাক্টর</span>
                  </div>
                  {(() => {
                    const videoToPlay = selectedDemoCourse?.demoVideoUrl || settings?.demoVideoUrl;
                    return videoToPlay ? (
                      <button
                        type="button"
                        onClick={() => setIsTheaterMode(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition duration-200 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                        title="ওয়েবসাইটে থেকেই বড় পর্দায় ফুলস্ক্রিনে দেখুন"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-slate-950" />
                        <span>বড় পর্দায় (Theater Mode) দেখুন</span>
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          THREE CORE PILLARS SECTION (#pillars)
      ========================================================================= */}
      <section id="pillars" className="py-16 sm:py-24 bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Direct Site Competence
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Practical Training. No Fluff.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Master the exact engineering processes required by top Bangladeshi developer companies and site consultants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="luxury-card rounded-2xl p-7 sm:p-8 space-y-4 border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="text-3xl font-black text-slate-200">01</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Read Drawings &amp; Run Sites</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Master architectural and structural drawings, rebar detailing, pre-pour checklists, and subcontractor bills with zero confusion.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-7 sm:p-8 space-y-4 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <span className="text-3xl font-black text-slate-200">02</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Estimate &amp; Build BOQs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extract exact quantities for concrete, rebar cutting length (BBS), brickwork, and prepare commercial bills in professional Excel spreadsheets.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-7 sm:p-8 space-y-4 border-l-4 border-l-indigo-600">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <CalendarCheck className="w-7 h-7" />
                </div>
                <span className="text-3xl font-black text-slate-200">03</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Plan &amp; Track Projects</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create WBS, CPM schedules in MS Project, mitigate monsoon delay risks, and organize snag-free developer handovers on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN COURSES CATALOG SECTION (#courses)
      ========================================================================= */}
      <section id="courses" className="py-20 sm:py-28 md:py-32 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-5">
            <div className="space-y-2">
              <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">
                Select Your Specialization
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                Industry Focused Courses
              </h2>
              <p className="text-base text-slate-600 max-w-xl">
                Click any course to inspect class-by-class syllabus topics, live schedule, and immediate enrollment.
              </p>
            </div>
            <div className="self-start md:self-auto text-xs sm:text-sm font-black text-amber-950 bg-amber-50 border border-amber-300 px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              ✨ 50% Off Limited Batch Offer Active
            </div>
          </div>

          {/* Grid of Courses */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-4 shadow-xs">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-12 bg-slate-200 rounded"></div>
                  <div className="h-8 bg-slate-200 rounded mt-4"></div>
                  <div className="h-10 bg-slate-200 rounded-xl mt-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="luxury-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3.5">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-xs">
                        {course.category}
                      </span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Interactive Batch
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 group-hover:text-blue-700 transition-colors tracking-tight leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {/* Highlights meta */}
                    <div className="grid grid-cols-2 gap-3 my-4 pt-3.5 border-t border-slate-100 text-xs sm:text-sm text-slate-700 font-bold">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{course.durationDays} Days Duration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{course.totalClasses} Live Classes</span>
                      </div>
                    </div>

                    {/* Sample syllabus topics preview */}
                    <div className="space-y-2 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                        Included Topics:
                      </span>
                      {course.syllabus?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action & Price Footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3.5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                          ৳{course.price.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm line-through text-slate-400 ml-2 font-semibold">
                          ৳{course.regularPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        50% OFF
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setSelectedCourseForDetails(course)}
                        className="py-3 px-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 shadow-sm hover:border-slate-300"
                      >
                        Curriculum
                      </button>
                      <button
                        onClick={() => setSelectedCourseForEnroll(course)}
                        className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black transition shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30 flex items-center justify-center gap-1.5 truncate hover:scale-105"
                      >
                        Enroll Now <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          DEDICATED INSTRUCTOR SECTION (#about)
      ========================================================================= */}
      <section id="about" className="py-20 sm:py-28 md:py-32 bg-gradient-to-b from-white via-slate-50/60 to-white border-b border-slate-200/80 relative overflow-hidden">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 lg:gap-16 items-center">
            {/* Instructor Photo with Executive Frame */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] xs:max-w-xs sm:max-w-sm">
                {/* Multi-layered Glow Background */}
                <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-tr from-blue-600/20 via-amber-500/20 to-indigo-600/20 opacity-80 blur-2xl"></div>

                {/* Luxury Outer Border Container */}
                <div className="relative p-1.5 rounded-[30px] bg-gradient-to-b from-amber-400/50 via-slate-200 to-blue-500/40 shadow-2xl shadow-slate-900/10">
                  <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-slate-950 group">
                    <img
                      src={settings?.instructorImage || "/instructor.jpg?v=2"}
                      alt={`${settings?.instructorName || 'Engr. Md Abdul Mazid'}, Civil Engineer and Founder of Blueprint Learning Academy`}
                      className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-105"
                    />

                    {/* Gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

                    {/* Verified Mentor Badge (Top Left) */}
                    <div className="absolute top-3.5 left-3.5 z-10 bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{settings?.statsMentorTag || 'BUET'} Civil Alumni</span>
                    </div>

                    {/* Experience Tag (Top Right) */}
                    <div className="absolute top-3.5 right-3.5 z-10 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
                      <HardHat className="w-3.5 h-3.5 text-amber-500" />
                      <span>{settings?.instructorShortExp || '10+ Yrs Exp'}</span>
                    </div>

                    {/* Bottom Bio Card */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="block font-black text-slate-950 text-base sm:text-lg tracking-tight">
                            {settings?.instructorName || 'Engr. Md Abdul Mazid'}
                          </span>
                          <span className="block text-xs font-extrabold text-blue-700 mt-0.5">
                            {settings?.instructorDegree || 'B.Sc. in Civil Engineering (BUET)'}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-black shrink-0 flex items-center gap-1 shadow-sm">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mentor</span>
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Senior Structural &amp; Site Lead</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          1-on-1 Support
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Bio & Mission */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-widest shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Lead Instructor &amp; Mentor</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.12]">
                  Learn From a <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 bg-clip-text text-transparent">Working Senior Engineer</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs sm:text-sm">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    {settings?.instructorDegree || 'B.Sc. in Civil Engineering (BUET)'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs sm:text-sm">
                    <HardHat className="w-4 h-4 text-amber-600" />
                    {settings?.instructorExp || '10+ Years On Real Projects in Bangladesh'}
                  </span>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                {settings?.instructorBio ||
                  'Engr. Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience leading residential, commercial, and high-rise developer construction projects in Dhaka. He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks and what Bangladeshi developer companies and site consultants actually demand.'}
              </p>

              {/* 4 Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-white border border-slate-200/90 hover:border-amber-400 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-950 group-hover:text-amber-600 transition">
                    {settings?.feature1Title || 'Real Developer Drawings'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {settings?.feature1Desc || 'Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 hover:border-emerald-500 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-950 group-hover:text-emerald-700 transition">
                    {settings?.feature2Title || 'Live Site Situations'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {settings?.feature2Desc || 'Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 hover:border-blue-500 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-950 group-hover:text-blue-700 transition">
                    Direct Mentor WhatsApp
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Ask questions, clarify site difficulties, and receive direct audio/text guidance whenever you face a problem on site.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 hover:border-indigo-500 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-slate-950 group-hover:text-indigo-700 transition">
                    CV &amp; Interview Review
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Submit your CV for personalized instructor feedback and real-estate technical interview prep tips.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('আসসালামু আলাইকুম স্যার, আমি ব্লুপ্রিন্ট লার্নিং একাডেমির কোর্স ও ক্যারিয়ার গাইডেন্স সম্পর্কে জানতে চাই।')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Message Instructor on WhatsApp</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-1" />
                </a>
                <a
                  href="#courses"
                  className="px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm text-center transition flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
                >
                  <span>Explore All 6 Courses</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PAYMENT INSTRUCTIONS & BKASH/NAGAD GUIDE (#payment)
      ========================================================================= */}
      <section id="payment" className="py-20 sm:py-28 md:py-32 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="luxury-card rounded-3xl p-6 sm:p-10 md:p-14 border border-slate-200 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">
                  Direct Verification &amp; Instant Access
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                  How Payment &amp; Enrollment Works
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  We use straightforward bKash and Nagad Send Money. Once you submit your Transaction ID, our admin team
                  verifies it, generates your student login credentials, and emails them directly to your inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* bKash Card */}
                  <div className="bg-pink-50/80 border border-pink-200 p-5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pink-700 font-bold uppercase tracking-wider">Official bKash Number</span>
                      <button
                        onClick={() => handleCopy(settings?.bkashNumber || '01313893838')}
                        className="text-xs font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1 bg-pink-100/80 px-2 py-1 rounded-md transition"
                      >
                        {copiedNumber === (settings?.bkashNumber || '01313893838') ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-xl sm:text-2xl font-mono font-black text-pink-950 block">
                      {settings?.bkashNumber || '01313893838'}
                    </span>
                    <span className="text-xs text-pink-700 font-semibold block">
                      {settings?.bkashType || 'Personal (Send Money)'}
                    </span>
                  </div>

                  {/* Nagad Card */}
                  <div className="bg-orange-50/80 border border-orange-200 p-5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-700 font-bold uppercase tracking-wider">Official Nagad Number</span>
                      <button
                        onClick={() => handleCopy(settings?.nagadNumber || '01313893838')}
                        className="text-xs font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 bg-orange-100/80 px-2 py-1 rounded-md transition"
                      >
                        {copiedNumber === (settings?.nagadNumber || '01313893838') ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-xl sm:text-2xl font-mono font-black text-orange-950 block">
                      {settings?.nagadNumber || '01313893838'}
                    </span>
                    <span className="text-xs text-orange-700 font-semibold block">
                      {settings?.nagadType || 'Personal (Send Money)'}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-blue-50/90 border-l-4 border-blue-600 rounded-r-2xl text-xs sm:text-sm text-slate-800 space-y-2">
                  <p className="text-slate-950 font-black text-sm">Easy 4-Step Process:</p>
                  <p>1. Open your bKash or Nagad app and choose <strong>Send Money</strong>.</p>
                  <p>2. Send the exact course amount to our official number above, adding your name in the Reference.</p>
                  <p>3. Copy the TrxID from your SMS and paste it in the course enrollment form.</p>
                  <p>4. Check your email for your auto-generated student login password!</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto text-2xl">
                  💬
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950">Have Pre-Enrollment Questions?</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Need syllabus clarification or help choosing the right course for your career goals? Talk directly with our team.
                </p>
                <div className="space-y-3 pt-2">
                  <a
                    href={`https://wa.me/${whatsapp}?text=Hello,%20I%20have%20a%20question%20about%20Blueprint%20Learning%20Academy%20courses.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                  >
                    Direct WhatsApp Support
                  </a>
                  <a
                    href={`tel:${phone}`}
                    className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    Call Helpline: {phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ SECTION (#faq)
      ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 space-y-2">
            <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-base text-slate-600">Answers to common queries from aspiring civil engineers.</p>
          </div>

          <div className="space-y-4">
            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-sm">
              <summary className="flex items-center justify-between font-black text-base sm:text-lg text-slate-950 gap-2">
                <span>Who should join these courses?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0 font-bold">▼</span>
              </summary>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                Fresh civil engineering graduates (B.Sc. and Diploma), junior site engineers, and working professionals looking to transition smoothly into real estate developers, structural consultancies, or project management firms in Bangladesh.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-sm">
              <summary className="flex items-center justify-between font-black text-base sm:text-lg text-slate-950 gap-2">
                <span>How are classes held and do I get recordings?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0 font-bold">▼</span>
              </summary>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                Live interactive classes are conducted via Google Meet in evening slots (8:00 PM / 8:30 PM BST) so working engineers can join easily. Full HD recordings of every class are uploaded to your Student Dashboard alongside downloadable Excel BOQ sheets and AutoCAD drawings.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-sm">
              <summary className="flex items-center justify-between font-black text-base sm:text-lg text-slate-950 gap-2">
                <span>How will I receive my login credentials?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0 font-bold">▼</span>
              </summary>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                After you submit your enrollment form with your bKash/Nagad Transaction ID, our admin confirms the transaction. The system immediately generates an auto-generated password and dispatches a confirmation email containing your login details and direct course WhatsApp group link.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-sm">
              <summary className="flex items-center justify-between font-black text-base sm:text-lg text-slate-950 gap-2">
                <span>Will I receive a course completion certificate?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0 font-bold">▼</span>
              </summary>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                Yes! Upon completing the course lectures and submitting the designated assignments, students receive an official verifiable digital certificate from Blueprint Learning Academy.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer settings={settings} />

      {/* =========================================================================
          IMMERSIVE FULLSCREEN THEATER MODE MODAL (100% On-Site Big Screen Playback)
      ========================================================================= */}
      {isTheaterMode && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 md:p-8 animate-in fade-in duration-200 overflow-y-auto">
          {/* Theater Header */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 sm:pb-4 max-w-6xl w-full mx-auto shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-black block">
                  {selectedDemoCourse ? `${selectedDemoCourse.title} • রেকর্ড করা ডেমো ক্লাস` : 'একাডেমি মাস্টার ডেমো ক্লাস'}
                </span>
                <h3 className="text-sm sm:text-lg font-black text-white truncate mt-0.5">
                  {selectedDemoCourse
                    ? (selectedDemoCourse.demoVideoTitle || `${selectedDemoCourse.title} - ডেমো ক্লাস ও প্র্যাকটিক্যাল প্রিভিউ`)
                    : (settings?.demoVideoTitle || 'সাইট এক্সিকিউশন ও বিওকিউ (BOQ) প্র্যাকটিক্যাল ডেমো ক্লাস')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsTheaterMode(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-black transition flex items-center gap-2 hover:scale-105 cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>বন্ধ করুন (Esc)</span>
              </button>
            </div>
          </div>

          {/* Theater Player Container */}
          <div className="max-w-6xl w-full mx-auto my-auto py-3">
            {(() => {
              const videoToPlay = selectedDemoCourse?.demoVideoUrl || settings?.demoVideoUrl;
              const videoInfo = getEmbedVideoInfo(videoToPlay);
              const videoTitle = selectedDemoCourse
                ? (selectedDemoCourse.demoVideoTitle || `${selectedDemoCourse.title} - ডেমো ক্লাস`)
                : (settings?.demoVideoTitle || 'সাইট এক্সিকিউশন ও বিওকিউ (BOQ) প্র্যাকটিক্যাল ডেমো ক্লাস');

              return (
                <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl">
                  {videoInfo.isDirectVideo ? (
                    <video
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      src={videoInfo.embedUrl || ''}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : videoInfo.embedUrl ? (
                    <iframe
                      src={videoInfo.embedUrl}
                      title={videoTitle}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <Video className="w-16 h-16 text-slate-600 mb-2" />
                      <p className="text-base font-bold">ভিডিও লিংক লোড করা যায়নি।</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Theater Footer: Course Context & Switchers */}
          <div className="max-w-6xl w-full mx-auto border-t border-slate-800 pt-3 sm:pt-4 shrink-0">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Course switch tabs inside theater */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none w-full md:w-auto">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
                  অন্যান্য কোর্স ডেমো:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDemoCourseId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition border cursor-pointer ${
                    selectedDemoCourseId === 'all'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🌟 মাস্টার ডেমো
                </button>
                {courses.map((c, i) => (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => setSelectedDemoCourseId(c._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                      selectedDemoCourseId === c._id
                        ? 'bg-amber-400 text-slate-950 font-black border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    0{i + 1}. {c.title}
                  </button>
                ))}
              </div>

              {/* Action buttons if course is selected */}
              {selectedDemoCourse && (
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTheaterMode(false);
                      setSelectedCourseForEnroll(selectedDemoCourse);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm hover:scale-105 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    ভর্তি হন (৳{selectedDemoCourse.price})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTheaterMode(false);
                      setSelectedCourseForDetails(selectedDemoCourse);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
                  >
                    সিলেবাস দেখুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CourseModal
        course={selectedCourseForDetails}
        isOpen={!!selectedCourseForDetails}
        onClose={() => setSelectedCourseForDetails(null)}
        onEnroll={(course) => setSelectedCourseForEnroll(course)}
      />

      <EnrollmentModal
        course={selectedCourseForEnroll}
        settings={settings}
        isOpen={!!selectedCourseForEnroll}
        onClose={() => setSelectedCourseForEnroll(null)}
      />

      {/* Floating 24/7 WhatsApp Quick Support Button */}
      <a
        href={`https://wa.me/${whatsapp}?text=Hello!%20I%20have%20questions%20about%20Blueprint%20Learning%20Academy%20courses.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-600/40 flex items-center gap-2.5 font-black text-xs sm:text-sm transition duration-300 hover:scale-105 group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
        <MessageCircle className="w-5 h-5 text-white shrink-0" />
        <span className="hidden sm:inline">Talk on WhatsApp</span>
      </a>
    </div>
  );
}
