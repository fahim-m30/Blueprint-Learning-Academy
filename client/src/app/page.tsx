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
  Award,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  CalendarCheck,
  Users,
  Layers,
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
  const whatsapp = (settings?.whatsappNumber || '8801313893838').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <Navbar settings={settings} />

      {/* HERO SECTION */}
      <section className="relative pt-10 pb-18 sm:pt-16 sm:pb-24 md:pt-22 md:pb-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-[#f8fafc]">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[550px] h-80 sm:h-[550px] bg-blue-500/7 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-amber-500/6 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs sm:text-sm font-extrabold tracking-wide shadow-sm max-w-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="truncate">{settings?.heroBadgeText || "Bangladesh's #1 Practical Civil Engineering Academy"}</span>
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              <h1 className="text-3.5xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[66px] xl:text-[72px] font-black tracking-[-0.035em] leading-[1.08] text-slate-950">
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

              <p className="text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                {settings?.heroSubtitle ||
                  'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.'}
              </p>

              {/* Bengali Highlight Badge */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-orange-50/60 border-l-4 border-amber-500 border-y border-r border-amber-200/80 shadow-sm">
                <p className="text-amber-950 font-extrabold text-sm sm:text-base md:text-lg leading-snug">
                  ✨ {settings?.heroBengaliNote || 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-2">
                <a
                  href="#courses"
                  className="px-7 sm:px-9 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40 flex items-center justify-center gap-2.5 transition duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Explore All 6 Courses <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 sm:px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition duration-200 shadow-sm hover:shadow-md"
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
              <div className="relative w-full max-w-[300px] xs:max-w-xs sm:max-w-md">
                {/* Glow Background */}
                <div className="absolute -inset-3 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-amber-500/15 to-indigo-500/20 opacity-80 blur-2xl"></div>

                {/* Photo Container */}
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-blue-950/10 bg-white group">
                  <img
                    src={settings?.instructorImage || "/instructor.jpg?v=2"}
                    alt={`${settings?.instructorName || 'Engr. Md Abdul Mazid'}, Civil Engineer and Lead Instructor at Blueprint Learning Academy`}
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                  {/* Floating Bio Card on Image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-950 p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between">
                    <div>
                      <span className="block font-black text-sm sm:text-base">{settings?.instructorName || 'Engr. Md Abdul Mazid'}</span>
                      <span className="block text-[11px] sm:text-xs text-blue-700 font-extrabold mt-0.5">
                        {settings?.instructorDegree || 'B.Sc. in Civil Engineering (BUET)'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] sm:text-[11px] font-black shrink-0">
                      {settings?.instructorShortExp || '10+ Yrs Exp'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFINITE MARQUEE ROW (All 6 Specializations) */}
      <section className="py-7 sm:py-9 bg-white border-y border-slate-200/90 overflow-hidden relative shadow-xs">
        {/* Left & Right Edge Vignette Fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

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
                className="flex items-center gap-3.5 sm:gap-4 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-[#fcfdff] border-2 border-slate-200/90 hover:border-blue-600 shadow-xs hover:shadow-lg hover:shadow-blue-900/10 hover:-translate-y-0.5 transition-all duration-300 shrink-0 group cursor-default"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100/80 border border-blue-200/80 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition duration-300 shadow-xs shrink-0">
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
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

      {/* THREE CORE PILLARS SECTION */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Direct Site Competence
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Practical Training. No Fluff.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Master the exact engineering processes required by top Bangladeshi developer companies and site consultants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-l-4 border-l-blue-600">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Read Drawings &amp; Run Sites</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Master architectural and structural drawings, rebar detailing, pre-pour checklists, and subcontractor bills with zero confusion.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-l-4 border-l-emerald-600">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Estimate &amp; Build BOQs</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Extract exact quantities for concrete, rebar cutting length (BBS), brickwork, and prepare commercial bills in professional Excel spreadsheets.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-l-4 border-l-indigo-600">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">Plan &amp; Track Projects</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Create WBS, CPM schedules in MS Project, mitigate monsoon delay risks, and organize snag-free developer handovers on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN COURSES SECTION */}
      <section id="courses" className="py-18 sm:py-26 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-5">
            <div className="space-y-2">
              <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">
                Select Your Specialization
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                Industry Focused Courses
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                Click any course to inspect class-by-class syllabus topics, schedule, and immediate enrollment.
              </p>
            </div>
            <div className="self-start md:self-auto text-xs sm:text-sm font-extrabold text-amber-900 bg-amber-50 border border-amber-300 px-4 py-2 rounded-xl shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
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
                  className="luxury-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between group"
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
                    <div className="grid grid-cols-2 gap-3 my-4 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-semibold">
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
                    <div className="space-y-2 mb-5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Included Topics:
                      </span>
                      {course.syllabus?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium">
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
                        className="py-3 px-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 shadow-xs hover:border-slate-300"
                      >
                        Curriculum
                      </button>
                      <button
                        onClick={() => setSelectedCourseForEnroll(course)}
                        className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black transition shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30 flex items-center justify-center gap-1.5 truncate"
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

      {/* DEDICATED INSTRUCTOR SECTION (#about / #instructor) */}
      <section id="about" className="py-18 sm:py-26 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
            {/* Instructor Photo with Tag */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[300px] xs:max-w-xs sm:max-w-sm">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-amber-500/15 to-indigo-500/20 opacity-80 blur-2xl"></div>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-white group">
                  <img
                    src={settings?.instructorImage || "/instructor.jpg?v=2"}
                    alt={`${settings?.instructorName || 'Engr. Md Abdul Mazid'}, civil engineer and founder of Blueprint Learning Academy`}
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-950 font-black text-sm sm:text-base py-3 px-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                      <span>{settings?.instructorName || 'Engr. Md Abdul Mazid'}</span>
                      <span className="block text-[11px] text-slate-500 font-semibold">Lead Instructor &amp; Mentor</span>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {settings?.statsMentorTag ? `${settings.statsMentorTag} Civil` : 'BUET Civil'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Bio & Mission */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2.5">
                <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">
                  Lead Instructor &amp; Mentor
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  Learn From a Working Senior Engineer
                </h2>
                <p className="text-sm sm:text-base font-extrabold text-blue-700">
                  {settings?.instructorDegree || 'B.Sc. in Civil Engineering (BUET)'} • {settings?.instructorExp || '10+ Years On Real Projects in Bangladesh'}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {settings?.instructorBio ||
                  'Engr. Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience leading residential, commercial, and high-rise developer construction projects in Dhaka. He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks and what Bangladeshi developer companies and site consultants actually demand.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="text-2xl text-amber-500">📐</div>
                  <h4 className="text-sm sm:text-base font-black text-slate-950">{settings?.feature1Title || 'Real Developer Drawings'}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {settings?.feature1Desc || 'Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-5 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="text-2xl text-emerald-600">🏗️</div>
                  <h4 className="text-sm sm:text-base font-black text-slate-950">{settings?.feature2Title || 'Live Site Situations'}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {settings?.feature2Desc || 'Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/25"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> Message Instructor on WhatsApp
                </a>
                <a
                  href="#courses"
                  className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-extrabold text-xs sm:text-sm text-center transition"
                >
                  Explore All 6 Courses
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENT INSTRUCTIONS & BKASH GUIDE */}
      <section id="payment" className="py-18 sm:py-26 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="luxury-card rounded-3xl p-6 sm:p-10 md:p-14 border border-slate-200/90 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">
                  Direct Verification &amp; Instant Access
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                  How Payment &amp; Enrollment Works
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  We use simple bKash and Nagad Send Money. Once you submit your Transaction ID, our admin team
                  verifies it, generates your student login credentials, and emails them directly to your inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-pink-50/70 border border-pink-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs text-pink-700 block font-bold uppercase tracking-wider">Official bKash Number:</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-pink-900 block mt-1">
                      {settings?.bkashNumber || '01313893838'}
                    </span>
                    <span className="text-xs text-pink-700 font-semibold block mt-1">
                      {settings?.bkashType || 'Personal (Send Money)'}
                    </span>
                  </div>
                  <div className="bg-orange-50/70 border border-orange-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="text-xs text-orange-700 block font-bold uppercase tracking-wider">Official Nagad Number:</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-orange-900 block mt-1">
                      {settings?.nagadNumber || '01313893838'}
                    </span>
                    <span className="text-xs text-orange-700 font-semibold block mt-1">
                      {settings?.nagadType || 'Personal (Send Money)'}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-blue-50/80 border-l-4 border-blue-600 rounded-r-2xl text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <p className="text-slate-950 font-black">Easy 4-Step Process:</p>
                  <p>1. Open your bKash or Nagad app and choose <strong>Send Money</strong>.</p>
                  <p>2. Send the exact course amount to our official number above, adding your name in the Reference.</p>
                  <p>3. Copy the TrxID from your SMS and paste it in the course enrollment form.</p>
                  <p>4. Check your email for your auto-generated student login password!</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
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

      {/* FAQ SECTION */}
      <section id="faq" className="py-18 sm:py-26 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 space-y-2">
            <span className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] block">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm sm:text-base text-slate-600">Answers to common queries from aspiring civil engineers.</p>
          </div>

          <div className="space-y-4">
            <details className="group bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-black text-sm sm:text-base text-slate-950 gap-2">
                <span>Who should join these courses?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                Fresh civil engineering graduates (B.Sc. and Diploma), junior site engineers, and working professionals looking to transition smoothly into real estate developers, structural consultancies, or project management firms in Bangladesh.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-black text-sm sm:text-base text-slate-950 gap-2">
                <span>How are classes held and do I get recordings?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                Live interactive classes are conducted via Google Meet in evening slots (8:00 PM / 8:30 PM BST) so working engineers can join easily. Full HD recordings of every class are uploaded to your Student Dashboard alongside downloadable Excel BOQ sheets and AutoCAD drawings.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-black text-sm sm:text-base text-slate-950 gap-2">
                <span>How will I receive my login credentials?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                After you submit your enrollment form with your bKash/Nagad Transaction ID, our admin confirms the transaction. The system immediately generates an auto-generated password and dispatches a confirmation email containing your login details and direct course WhatsApp group link.
              </p>
            </details>

            <details className="group bg-slate-50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition shadow-xs">
              <summary className="flex items-center justify-between font-black text-sm sm:text-base text-slate-950 gap-2">
                <span>Will I receive a course completion certificate?</span>
                <span className="transition group-open:rotate-180 text-blue-600 shrink-0">▼</span>
              </summary>
              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
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
        className="fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-600/40 flex items-center gap-2.5 font-black text-xs sm:text-sm transition duration-300 hover:scale-105 group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
        <MessageCircle className="w-5 h-5 text-white shrink-0" />
        <span className="hidden sm:inline">Talk on WhatsApp</span>
      </a>
    </div>
  );
}
