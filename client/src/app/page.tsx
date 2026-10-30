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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <Navbar settings={settings} />

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] sm:text-xs font-bold tracking-wide shadow-xs max-w-full truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Bangladesh&apos;s #1 Practical Civil Engineering Academy</span>
              </div>

              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.18] sm:leading-[1.15] text-slate-900">
                Build a real estate career as a{' '}
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  civil engineer
                </span>{' '}
                in Bangladesh.
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
                {settings?.heroSubtitle ||
                  'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.'}
              </p>

              {/* Bengali Highlight Badge */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border-l-4 border-amber-500 border-y border-r border-amber-200 shadow-xs">
                <p className="text-amber-950 font-bold text-xs sm:text-sm lg:text-base leading-snug">
                  {settings?.heroBengaliNote || 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                <a
                  href="#courses"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition duration-200 hover:scale-[1.02]"
                >
                  Explore All Courses <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition duration-200 shadow-xs"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" /> Talk to Instructor
                </a>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-200 max-w-lg">
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-blue-700">6+</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-tight block">Industry Courses</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">10+ Yrs</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-tight block">Field Experience</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl lg:text-3xl font-black text-amber-600">BUET</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-tight block">Trained Instructor</span>
                </div>
              </div>
            </div>

            {/* Right Column: Instructor Photo Portrait Card */}
            <div className="lg:col-span-5 flex justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-[280px] xs:max-w-xs sm:max-w-md">
                {/* Glow Background */}
                <div className="absolute -inset-2 sm:-inset-3 rounded-3xl bg-gradient-to-tr from-blue-500/15 via-amber-500/10 to-indigo-500/15 opacity-80 blur-2xl"></div>

                {/* Photo Container */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-blue-900/10 bg-white group">
                  <img
                    src="/instructor.jpg"
                    alt="Md Abdul Mazid, Civil Engineer and Lead Instructor at Blueprint Learning Academy"
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                  {/* Instructor Badge Tag */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
                          Md Abdul Mazid <span className="text-amber-500">★</span>
                        </h3>
                        <p className="text-[11px] sm:text-xs font-bold text-blue-700 truncate">Lead Instructor &amp; Civil Engineer</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">B.Sc. in Civil Engineering (BUET)</p>
                      </div>
                      <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-xs shrink-0">
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
        <div className="w-full overflow-hidden opacity-20 pointer-events-none mt-10 sm:mt-12 -mb-6">
          <svg className="w-full h-12 sm:h-16 md:h-20 text-blue-600" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
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
      <section className="py-5 sm:py-6 bg-slate-100/80 border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
          <span className="font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            Featured Career Programs
          </span>
          <span className="hidden sm:inline text-slate-500">Click any course to inspect complete class breakdown</span>
        </div>

        <div className="relative overflow-hidden w-full max-w-full">
          <div className="animate-infinite-scroll flex gap-3 sm:gap-4">
            {courses.concat(courses).map((course, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCourseForDetails(course)}
                className="w-64 sm:w-80 shrink-0 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 shadow-xs group"
              >
                <div className="flex items-center justify-between text-[11px] text-blue-700 mb-1">
                  <span className="font-semibold truncate max-w-[140px]">{course.category}</span>
                  <span className="font-black text-amber-600 shrink-0">৳{course.price.toLocaleString()}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                  {course.title}
                </h4>
                <div className="flex items-center gap-3 mt-2 text-[11px] sm:text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> {course.durationDays} Days
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-600" /> {course.totalClasses} Classes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES SECTION */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">Career Transformation</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">What You Will Be Able To Do</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Every course ends with tangible skills you can immediately put on your CV or execute on your next site inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-50 hover:bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg sm:text-xl text-amber-700">
                💼
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Get Shortlisted &amp; Hired</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build an engineering CV that passes developer HR screening and master technical interview questions.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-white border-l-4 border-blue-600 border-y border-r border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-lg sm:text-xl text-blue-700">
                📐
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Read Drawings &amp; Run Sites</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Master architectural and structural drawings, rebar detailing, pre-pour checklists, and subcontractor bills.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-white border-l-4 border-emerald-500 border-y border-r border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg sm:text-xl text-emerald-700">
                📊
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Estimate &amp; Build BOQs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extract exact quantities for concrete, rebar cutting length (BBS), brickwork, and prepare commercial bills in Excel.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-white border-l-4 border-indigo-500 border-y border-r border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg sm:text-xl text-indigo-700">
                📅
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Plan &amp; Track Projects</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create WBS, CPM schedules in MS Project, mitigate monsoon delay risks, and organize snag-free handovers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN COURSES SECTION */}
      <section id="courses" className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
                Select Your Specialization
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">Industry Focused Courses</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl">
                Click any course card to inspect class-by-class syllabus topics, schedule, and immediate enrollment.
              </p>
            </div>
            <div className="self-start md:self-auto text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] sm:text-xs">
                        {course.category}
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 text-[11px] sm:text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online Batch
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {/* Highlights meta */}
                    <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{course.durationDays} Days Duration</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{course.totalClasses} Classes</span>
                      </div>
                    </div>

                    {/* Sample syllabus topics preview */}
                    <div className="space-y-1.5 mb-5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included Topics:
                      </span>
                      {course.syllabus?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action & Price Footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xl sm:text-2xl font-black text-slate-900">
                          ৳{course.price.toLocaleString()}
                        </span>
                        <span className="text-xs line-through text-slate-400 ml-2">
                          ৳{course.regularPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        50% OFF
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedCourseForDetails(course)}
                        className="py-2.5 px-2 sm:px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setSelectedCourseForEnroll(course)}
                        className="py-2.5 px-2 sm:px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition shadow-sm shadow-amber-500/20 flex items-center justify-center gap-1 truncate"
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
      <section id="about" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Instructor Photo with Tag */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[280px] xs:max-w-xs sm:max-w-sm">
                <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-blue-500/15 via-amber-500/15 to-indigo-500/15 opacity-80 blur-2xl"></div>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white group">
                  <img
                    src="/instructor.jpg"
                    alt="Md Abdul Mazid, civil engineer and founder of Blueprint Learning Academy"
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 font-black text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl shadow-lg flex items-center justify-between">
                    <span>Md Abdul Mazid</span>
                    <span className="text-[11px] sm:text-xs font-bold text-blue-700">BUET Civil Engg.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Bio & Mission */}
            <div className="md:col-span-7 space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block">
                  Lead Instructor &amp; Mentor
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
                  Learn From a Working Senior Engineer
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-700">
                  B.Sc. in Civil Engineering (BUET) • 10+ Years On Real Projects in Bangladesh
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience
                leading residential, commercial, and high-rise developer construction projects in Dhaka.
                He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks
                and what Bangladeshi developer companies and site consultants actually demand.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl space-y-1">
                  <div className="text-lg sm:text-xl text-amber-500">📐</div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Real Developer Drawings</h4>
                  <p className="text-xs text-slate-600">
                    Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl space-y-1">
                  <div className="text-lg sm:text-xl text-emerald-600">🏗️</div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Live Site Situations</h4>
                  <p className="text-xs text-slate-600">
                    Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> Message Instructor on WhatsApp
                </a>
                <a
                  href="#courses"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm text-center transition"
                >
                  Explore All 6 Courses
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENT INSTRUCTIONS & BKASH GUIDE */}
      <section id="payment" className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-5 sm:p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                  Direct Verification &amp; Instant Access
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
                  How Payment &amp; Enrollment Works
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We use simple bKash and Nagad Send Money. Once you submit your Transaction ID, our admin team
                  verifies it, generates your student login credentials, and emails them directly to your inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <div className="bg-pink-50/70 border border-pink-200 p-4 rounded-xl">
                    <span className="text-xs text-pink-700 block font-semibold">Official bKash Number:</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-pink-800 block mt-1">
                      {settings?.bkashNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-pink-600 block mt-0.5">
                      {settings?.bkashType || 'Personal (Send Money)'}
                    </span>
                  </div>
                  <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-xl">
                    <span className="text-xs text-orange-700 block font-semibold">Official Nagad Number:</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-orange-800 block mt-1">
                      {settings?.nagadNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-orange-600 block mt-0.5">
                      {settings?.nagadType || 'Personal (Send Money)'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 bg-blue-50/70 border-l-4 border-blue-600 rounded-r-xl text-xs text-slate-700 space-y-1">
                  <p className="text-slate-900 font-bold">Easy 4-Step Process:</p>
                  <p>1. Open your bKash or Nagad app and choose <strong>Send Money</strong>.</p>
                  <p>2. Send the exact course amount to our official number above, adding your name in the Reference.</p>
                  <p>3. Copy the TrxID from your SMS and paste it in the course enrollment form.</p>
                  <p>4. Check your email for your auto-generated student login password!</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto text-xl sm:text-2xl">
                  💬
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Have Pre-Enrollment Questions?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Need syllabus clarification or help choosing the right course for your career goals? Talk directly with our team.
                </p>
                <div className="space-y-2.5 pt-2">
                  <a
                    href={`https://wa.me/${whatsapp}?text=Hello,%20I%20have%20a%20question%20about%20Blueprint%20Learning%20Academy%20courses.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                  >
                    Direct WhatsApp Support
                  </a>
                  <a
                    href={`tel:${phone}`}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
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
      <section id="faq" className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">Got Questions?</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">Answers to common queries from aspiring civil engineers.</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 gap-2">
                <span>Who should join these courses?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Fresh civil engineering graduates (B.Sc. and Diploma), junior site engineers, and working professionals looking to transition smoothly into real estate developers, structural consultancies, or project management firms in Bangladesh.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 gap-2">
                <span>How are classes held and do I get recordings?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Live interactive classes are conducted via Google Meet in evening slots (8:00 PM / 8:30 PM BST) so working engineers can join easily. Full HD recordings of every class are uploaded to your Student Dashboard alongside downloadable Excel BOQ sheets and AutoCAD drawings.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 gap-2">
                <span>How will I receive my login credentials?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                After you submit your enrollment form with your bKash/Nagad Transaction ID, our admin confirms the transaction. The system immediately generates an auto-generated password and dispatches a confirmation email containing your login details and direct course WhatsApp group link.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 gap-2">
                <span>Will I receive a course completion certificate?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
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
        className="fixed right-3 bottom-4 sm:right-5 sm:bottom-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-600/40 flex items-center gap-2.5 font-bold text-xs sm:text-sm transition duration-300 hover:scale-105 group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
        <MessageCircle className="w-5 h-5 text-white shrink-0" />
        <span className="hidden sm:inline">Talk on WhatsApp</span>
      </a>
    </div>
  );
}
