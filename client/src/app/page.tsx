'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseModal from '@/components/CourseModal';
import EnrollmentModal from '@/components/EnrollmentModal';
import { apiRequest } from '@/lib/api';
import { Course, SiteSettings } from '@/lib/types';
import {
  Clock,
  BookOpen,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [coursesRes, settingsRes] = await Promise.all([
        apiRequest<{ courses: Course[] }>('/public/courses'),
        apiRequest<{ settings: SiteSettings }>('/public/settings'),
      ]);

      if (coursesRes.success && coursesRes.data?.courses) {
        setCourses(coursesRes.data.courses);
      }
      if (settingsRes.success && settingsRes.data?.settings) {
        setSettings(settingsRes.data.settings);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const phone = settings?.contactPhone || '01313893838';
  const whatsapp = settings?.whatsappNumber || '8801313893838';

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <Navbar settings={settings} />

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-[11px] sm:text-xs font-bold tracking-wide shadow-sm max-w-full truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Bangladesh&apos;s #1 Practical Civil Engineering Academy</span>
              </div>

              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.18] sm:leading-[1.15] text-white">
                Build a real estate career as a{' '}
                <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  civil engineer
                </span>{' '}
                in Bangladesh.
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
                {settings?.heroSubtitle ||
                  'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.'}
              </p>

              {/* Bengali Highlight Badge */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border-l-4 border-amber-400 border-y border-r border-slate-800 shadow-lg">
                <p className="text-amber-300 font-bold text-xs sm:text-sm lg:text-base leading-snug">
                  {settings?.heroBengaliNote || 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                <a
                  href="#courses"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition duration-200 hover:scale-[1.02]"
                >
                  Explore All Courses <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition duration-200 shadow-md"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" /> Talk to Instructor
                </a>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-800/80 max-w-lg">
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-amber-400">6+</span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block">Industry Courses</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-white">10+ Yrs</span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block">Field Experience</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-sky-400">BUET</span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block">Trained Instructor</span>
                </div>
              </div>
            </div>

            {/* Right Column: Instructor Photo Portrait Card */}
            <div className="lg:col-span-5 flex justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-[280px] xs:max-w-xs sm:max-w-md">
                {/* Glow Background */}
                <div className="absolute -inset-2 sm:-inset-3 rounded-3xl bg-gradient-to-tr from-sky-500/30 via-amber-500/20 to-blue-600/30 opacity-70 blur-2xl"></div>

                {/* Photo Container */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-sky-400/30 shadow-2xl shadow-sky-950/50 bg-slate-900 group">
                  <img
                    src="/instructor.jpg"
                    alt="Md Abdul Mazid, Civil Engineer and Lead Instructor at Blueprint Learning Academy"
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/25 to-transparent"></div>

                  {/* Instructor Badge Tag */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 truncate">
                          Md Abdul Mazid <span className="text-amber-400">★</span>
                        </h3>
                        <p className="text-[11px] sm:text-xs font-semibold text-amber-400 truncate">Lead Instructor &amp; Civil Engineer</p>
                        <p className="text-[10px] sm:text-[11px] text-sky-400 font-medium truncate">B.Sc. in Civil Engineering (BUET)</p>
                      </div>
                      <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-md shrink-0">
                        10+ Yrs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural CAD Blueprint Skyline Decor */}
        <div className="w-full overflow-hidden opacity-25 pointer-events-none mt-10 sm:mt-12 -mb-6">
          <svg className="w-full h-12 sm:h-16 md:h-20 text-sky-400" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
              <pattern id="cad-fl" width="10" height="12" patternUnits="userSpaceOnUse">
                <path d="M0 12h10" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="60" y="50" width="90" height="70" fill="url(#cad-fl)" />
              <rect x="170" y="20" width="70" height="100" fill="url(#cad-fl)" />
              <rect x="270" y="60" width="110" height="60" fill="url(#cad-fl)" />
              <rect x="420" y="30" width="80" height="90" fill="url(#cad-fl)" />
              <path d="M560 120V10h60M560 10l-30 14M620 10v24M590 10V0M530 24h30" />
              <rect x="700" y="55" width="100" height="65" fill="url(#cad-fl)" />
              <rect x="840" y="15" width="75" height="105" fill="url(#cad-fl)" />
              <rect x="950" y="45" width="120" height="75" fill="url(#cad-fl)" />
            </g>
          </svg>
        </div>
      </section>

      {/* CONTINUOUS SCROLLING COURSES TICKER */}
      <section className="py-5 sm:py-6 bg-[#050811] border-y border-[#1c2b48] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Featured Career Programs
          </span>
          <span className="hidden sm:inline text-slate-400">Click any course to inspect complete class breakdown</span>
        </div>

        <div className="relative overflow-hidden w-full max-w-full">
          <div className="animate-infinite-scroll flex gap-3 sm:gap-4">
            {courses.concat(courses).map((course, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCourseForDetails(course)}
                className="w-64 sm:w-80 shrink-0 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/80 rounded-xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 shadow-md group"
              >
                <div className="flex items-center justify-between text-[11px] text-sky-400 mb-1">
                  <span className="font-semibold truncate max-w-[140px]">{course.category}</span>
                  <span className="font-black text-amber-400 shrink-0">৳{course.price.toLocaleString()}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                  {course.title}
                </h4>
                <div className="flex items-center gap-3 mt-2 text-[11px] sm:text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> {course.durationDays} Days
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-sky-400" /> {course.totalClasses} Classes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES SECTION */}
      <section className="py-14 sm:py-20 bg-[#080d1a] border-b border-[#1c2b48]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">Career Transformation</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">What You Will Be Able To Do</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every course ends with tangible skills you can immediately put on your CV or execute on your next site inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-[#111a2e] to-[#0a0f1d] border-l-4 border-amber-400 border-y border-r border-slate-800 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-lg hover:border-slate-700 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg sm:text-xl text-amber-400">
                💼
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Get Shortlisted &amp; Hired</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build an engineering CV that passes developer HR screening and master technical interview questions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#111a2e] to-[#0a0f1d] border-l-4 border-sky-400 border-y border-r border-slate-800 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-lg hover:border-slate-700 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-lg sm:text-xl text-sky-400">
                📐
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Read Drawings &amp; Run Sites</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Master architectural and structural drawings, rebar detailing, pre-pour checklists, and subcontractor bills.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#111a2e] to-[#0a0f1d] border-l-4 border-emerald-400 border-y border-r border-slate-800 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-lg hover:border-slate-700 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg sm:text-xl text-emerald-400">
                📊
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Estimate &amp; Build BOQs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extract exact quantities for concrete, rebar cutting length (BBS), brickwork, and prepare commercial bills in Excel.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#111a2e] to-[#0a0f1d] border-l-4 border-indigo-400 border-y border-r border-slate-800 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-lg hover:border-slate-700 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg sm:text-xl text-indigo-400">
                📅
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Plan &amp; Track Projects</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create WBS, CPM schedules in MS Project, mitigate monsoon delay risks, and organize snag-free handovers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN COURSES SECTION */}
      <section id="courses" className="py-16 sm:py-24 bg-[#0a1020] border-b border-[#1c2b48]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                Select Your Specialization
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">Industry Focused Courses</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
                Click any course card to inspect class-by-class syllabus topics, schedule, and immediate enrollment.
              </p>
            </div>
            <div className="self-start md:self-auto text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-sm">
              ✨ 50% Off Limited Batch Offer Active
            </div>
          </div>

          {/* Grid of Courses */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-12 bg-slate-800 rounded"></div>
                  <div className="h-8 bg-slate-800 rounded mt-4"></div>
                  <div className="h-10 bg-slate-800 rounded-xl mt-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-gradient-to-b from-[#111c34] via-[#0d162a] to-[#090e1c] border border-slate-800/90 hover:border-sky-400/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold text-[11px] sm:text-xs">
                        {course.category}
                      </span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px] sm:text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Online Batch
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {/* Highlights meta */}
                    <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-800 text-[11px] sm:text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{course.durationDays} Days Duration</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{course.totalClasses} Classes</span>
                      </div>
                    </div>

                    {/* Sample syllabus topics preview */}
                    <div className="space-y-1.5 mb-5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Included Topics:
                      </span>
                      {course.syllabus?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action & Price Footer */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xl sm:text-2xl font-black text-amber-400">
                          ৳{course.price.toLocaleString()}
                        </span>
                        <span className="text-xs line-through text-slate-500 ml-2">
                          ৳{course.regularPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        50% OFF
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedCourseForDetails(course)}
                        className="py-2.5 px-2 sm:px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setSelectedCourseForEnroll(course)}
                        className="py-2.5 px-2 sm:px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1 truncate"
                      >
                        Enroll Now <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DEDICATED INSTRUCTOR SECTION (#about / #instructor) */}
      <section id="about" className="py-16 sm:py-24 bg-[#080d1a] border-b border-[#1c2b48]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Instructor Photo with Tag */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[280px] xs:max-w-xs sm:max-w-sm">
                <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-sky-500/30 via-amber-500/25 to-blue-600/30 opacity-70 blur-2xl"></div>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-sky-400/40 shadow-2xl bg-slate-900 group">
                  <img
                    src="/instructor.jpg"
                    alt="Md Abdul Mazid, civil engineer and founder of Blueprint Learning Academy"
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl shadow-xl flex items-center justify-between">
                    <span>Md Abdul Mazid</span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900/80">BUET Civil Engg.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Bio & Mission */}
            <div className="md:col-span-7 space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                  Lead Instructor &amp; Mentor
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                  Learn From a Working Senior Engineer
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-sky-400">
                  B.Sc. in Civil Engineering (BUET) • 10+ Years On Real Projects in Bangladesh
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience
                leading residential, commercial, and high-rise developer construction projects in Dhaka.
                He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks
                and what Bangladeshi developer companies and site consultants actually demand.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-xl space-y-1">
                  <div className="text-lg sm:text-xl text-amber-400">📐</div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Real Developer Drawings</h4>
                  <p className="text-xs text-slate-400">
                    Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-xl space-y-1">
                  <div className="text-lg sm:text-xl text-emerald-400">🏗️</div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Live Site Situations</h4>
                  <p className="text-xs text-slate-400">
                    Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> Message Instructor on WhatsApp
                </a>
                <a
                  href="#courses"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs sm:text-sm text-center transition"
                >
                  Explore All 6 Courses
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENT INSTRUCTIONS & BKASH GUIDE */}
      <section id="payment" className="py-16 sm:py-24 bg-[#0a1020] border-b border-[#1c2b48]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#101b33] via-[#0d1629] to-[#090e1c] border-2 border-sky-500/30 rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Direct Verification &amp; Instant Access
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
                  How Payment &amp; Enrollment Works
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  We use simple bKash and Nagad Send Money. Once you submit your Transaction ID, our admin team
                  verifies it, generates your student login credentials, and emails them directly to your inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block font-medium">Official bKash Number:</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-pink-400 block mt-1">
                      {settings?.bkashNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {settings?.bkashType || 'Personal (Send Money)'}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block font-medium">Official Nagad Number:</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-orange-400 block mt-1">
                      {settings?.nagadNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {settings?.nagadType || 'Personal (Send Money)'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-900/90 border-l-4 border-emerald-400 rounded-r-xl text-xs text-slate-300 space-y-1">
                  <p className="text-white font-bold">Easy 4-Step Process:</p>
                  <p>1. Open your bKash or Nagad app and choose <strong>Send Money</strong>.</p>
                  <p>2. Send the exact course amount to our official number above, adding your name in the Reference.</p>
                  <p>3. Copy the TrxID from your SMS and paste it in the course enrollment form.</p>
                  <p>4. Check your email for your auto-generated student login password!</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/15 border-2 border-amber-400/50 text-amber-400 flex items-center justify-center mx-auto text-xl sm:text-2xl">
                  💬
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">Have Pre-Enrollment Questions?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Need syllabus clarification or help choosing the right course for your career goals? Talk directly with our team.
                </p>
                <div className="space-y-2.5 pt-2">
                  <a
                    href={`https://wa.me/${whatsapp}?text=Hello,%20I%20have%20a%20question%20about%20Blueprint%20Learning%20Academy%20courses.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                  >
                    Direct WhatsApp Support
                  </a>
                  <a
                    href={`tel:${phone}`}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    Call Helpline: {phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-24 bg-[#080d1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">Got Questions?</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">Answers to common queries from aspiring civil engineers.</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <details className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-white gap-2">
                <span>Who should join these courses?</span>
                <span className="transition group-open:rotate-180 text-amber-400 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Fresh civil engineering graduates (B.Sc. and Diploma), junior site engineers, and working professionals looking to transition smoothly into real estate developers, structural consultancies, or project management firms in Bangladesh.
              </p>
            </details>

            <details className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-white gap-2">
                <span>How are classes held and do I get recordings?</span>
                <span className="transition group-open:rotate-180 text-amber-400 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Live interactive classes are conducted via Google Meet in evening slots (8:00 PM / 8:30 PM BST) so working engineers can join easily. Full HD recordings of every class are uploaded to your Student Dashboard alongside downloadable Excel BOQ sheets and AutoCAD drawings.
              </p>
            </details>

            <details className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-white gap-2">
                <span>How will I receive my login credentials?</span>
                <span className="transition group-open:rotate-180 text-amber-400 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                After you submit your enrollment form with your bKash/Nagad Transaction ID, our admin confirms the transaction. The system immediately generates an auto-generated password and dispatches a confirmation email containing your login details and direct course WhatsApp group link.
              </p>
            </details>

            <details className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-white gap-2">
                <span>Will I receive a course completion certificate?</span>
                <span className="transition group-open:rotate-180 text-amber-400 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Yes! Upon completing the course lectures and submitting the designated assignments, students receive an official verifiable digital certificate from Blueprint Learning Academy.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer settings={settings} />

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
        className="fixed right-3 bottom-4 sm:right-5 sm:bottom-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-white p-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center gap-2.5 font-bold text-xs sm:text-sm transition duration-300 hover:scale-105 group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
        <MessageCircle className="w-5 h-5 text-white shrink-0" />
        <span className="hidden sm:inline">Talk on WhatsApp</span>
      </a>
    </div>
  );
}
