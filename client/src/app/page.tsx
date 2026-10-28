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
    <div className="min-h-screen bg-[#060a11] text-[#f3f7fc] selection:bg-[#ffb531] selection:text-[#1a1100]">
      {/* Navigation */}
      <Navbar settings={settings} />

      {loading && (
        <div className="bg-[#3a7bb8]/20 border-b border-[#3a7bb8] py-1 text-center text-xs text-[#7fb8ea]">
          Refreshing latest batch schedules &amp; pricing...
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-[#2e4666]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101c2e] border border-[#3a7bb8] text-xs font-semibold text-[#7fb8ea]">
                <Sparkles className="w-3.5 h-3.5 text-[#ffb531]" />
                Bangladesh’s #1 Practical Civil Engineering Academy
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {settings?.heroTitle || 'Build a real estate career as a civil engineer in Bangladesh.'}
              </h1>

              <p className="text-base sm:text-lg text-[#bccadb] leading-relaxed max-w-2xl">
                {settings?.heroSubtitle ||
                  'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.'}
              </p>

              <p className="text-sm font-medium text-[#7fb8ea] bg-[#0b1624] border-l-4 border-[#ffb531] px-4 py-2 rounded-r-lg max-w-xl">
                {settings?.heroBengaliNote || 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#courses"
                  className="px-7 py-3.5 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-sm sm:text-base shadow-xl shadow-[#ffb531]/20 flex items-center gap-2 transition"
                >
                  Explore All Courses <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-[#101c2e] hover:bg-[#1a2c42] border border-[#3a7bb8] text-white font-bold text-sm sm:text-base flex items-center gap-2 transition"
                >
                  <PhoneCall className="w-4 h-4 text-[#25d366]" /> Talk to Instructor
                </a>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1a2c42] max-w-lg">
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#ffb531]">6+</span>
                  <span className="text-xs text-[#bccadb]">Industry Courses</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-white">10+ Yrs</span>
                  <span className="text-xs text-[#bccadb]">Field Experience</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#7fb8ea]">BUET</span>
                  <span className="text-xs text-[#bccadb]">Trained Instructor</span>
                </div>
              </div>
            </div>

            {/* Right Column: Instructor Badge Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#3a7bb8] via-[#ffb531] to-[#7fb8ea] opacity-30 blur-xl"></div>
                <div className="relative bg-[#101c2e] border-2 border-[#3a7bb8] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#08111d] border-2 border-[#ffb531] flex items-center justify-center text-3xl shadow-inner">
                      👨‍💼
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Md Abdul Mazid</h3>
                      <p className="text-xs font-semibold text-[#ffb531]">Lead Instructor & Civil Engineer</p>
                      <p className="text-xs text-[#7fb8ea]">B.Sc. in Civil Engineering (BUET)</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#bccadb] leading-relaxed">
                    &quot;Our classes are designed around real Bangladeshi developer drawings, structural blueprints, RAJUK bylaws,
                    and on-site execution situations, not generic foreign textbooks.&quot;
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-[#2e4666] text-xs text-[#bccadb]">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#50c878]" />
                      <span>Live interactive classes via Google Meet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#50c878]" />
                      <span>Practical BOQ spreadsheets and BBS templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#50c878]" />
                      <span>Dedicated WhatsApp Batch Group for Q&amp;A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#50c878]" />
                      <span>Personalized technical mock interviews</span>
                    </div>
                  </div>

                  <a
                    href="#courses"
                    className="block text-center w-full py-2.5 rounded-xl bg-[#3a7bb8]/20 hover:bg-[#3a7bb8]/40 border border-[#3a7bb8] text-white text-xs font-bold transition"
                  >
                    View Class Schedules &amp; Enroll
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTINUOUS SCROLLING COURSES TICKER (Requirement 2: ekter por ekta scroll hoyte thakbe) */}
      <section className="py-6 bg-[#09111c] border-b border-[#2e4666] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between text-xs text-[#bccadb]">
          <span className="font-semibold uppercase tracking-wider text-[#ffb531] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffb531] animate-ping"></span>
            Featured Career Programs (Hover to Pause)
          </span>
          <span className="hidden sm:inline">Click any course to inspect complete class breakdown</span>
        </div>

        <div className="relative overflow-hidden w-full">
          <div className="animate-infinite-scroll flex gap-4">
            {courses.concat(courses).map((course, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCourseForDetails(course)}
                className="w-72 sm:w-80 shrink-0 bg-[#101c2e] hover:bg-[#16253c] border border-[#2e4666] hover:border-[#ffb531] rounded-xl p-4 cursor-pointer transition shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-[#7fb8ea] mb-1">
                  <span>{course.category}</span>
                  <span className="font-bold text-[#ffb531]">৳{course.price.toLocaleString()}</span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{course.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#bccadb]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#ffb531]" /> {course.durationDays} Days
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#7fb8ea]" /> {course.totalClasses} Classes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES SECTION */}
      <section className="py-16 bg-[#060a11] border-b border-[#2e4666]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What You Will Be Able To Do</h2>
            <p className="text-sm text-[#bccadb] mt-2">
              Every course ends with tangible skills you can immediately put on your CV or use on your next site inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#101c2e] border-l-4 border-[#ffb531] border-y border-r border-[#2e4666] rounded-xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#08111d] flex items-center justify-center text-xl text-[#ffb531]">
                💼
              </div>
              <h3 className="text-base font-bold text-white">Get Shortlisted &amp; Hired</h3>
              <p className="text-xs text-[#bccadb] leading-relaxed">
                Build an engineering CV that passes developer HR screening and master technical interview questions.
              </p>
            </div>

            <div className="bg-[#101c2e] border-l-4 border-[#3a7bb8] border-y border-r border-[#2e4666] rounded-xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#08111d] flex items-center justify-center text-xl text-[#3a7bb8]">
                📐
              </div>
              <h3 className="text-base font-bold text-white">Read Drawings &amp; Run Sites</h3>
              <p className="text-xs text-[#bccadb] leading-relaxed">
                Master architectural and structural drawings, rebar detailing, pre-pour checklists, and subcontractor bills.
              </p>
            </div>

            <div className="bg-[#101c2e] border-l-4 border-[#50c878] border-y border-r border-[#2e4666] rounded-xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#08111d] flex items-center justify-center text-xl text-[#50c878]">
                📊
              </div>
              <h3 className="text-base font-bold text-white">Estimate &amp; Build BOQs</h3>
              <p className="text-xs text-[#bccadb] leading-relaxed">
                Extract exact quantities for concrete, rebar cutting length (BBS), brickwork, and prepare commercial bills in Excel.
              </p>
            </div>

            <div className="bg-[#101c2e] border-l-4 border-[#e2136e] border-y border-r border-[#2e4666] rounded-xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#08111d] flex items-center justify-center text-xl text-[#e2136e]">
                📅
              </div>
              <h3 className="text-base font-bold text-white">Plan &amp; Track Projects</h3>
              <p className="text-xs text-[#bccadb] leading-relaxed">
                Create WBS, CPM schedules in MS Project, mitigate monsoon delay risks, and organize snag-free handovers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN COURSES SECTION */}
      <section id="courses" className="py-20 bg-[#08111d] border-b border-[#2e4666]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-[#ffb531] uppercase tracking-wider block mb-1">
                Select Your Specialization
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Industry Focused Courses</h2>
              <p className="text-sm text-[#bccadb] mt-2 max-w-xl">
                Click any course card to inspect class-by-class syllabus topics, schedule, and immediate enrollment.
              </p>
            </div>
            <div className="text-xs text-[#7fb8ea] bg-[#101c2e] border border-[#2e4666] px-4 py-2 rounded-lg">
              ✨ 50% Off Limited Batch Offer Active
            </div>
          </div>

          {/* Grid of Courses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-[#101c2e] border border-[#2e4666] hover:border-[#ffb531] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group hover:shadow-xl hover:shadow-[#ffb531]/5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#08111d] text-[#7fb8ea] border border-[#2e4666]">
                      {course.category}
                    </span>
                    <span className="font-bold text-emerald-400">Online Batch</span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-[#ffb531] transition">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[#bccadb] mt-2 line-clamp-3 leading-relaxed">
                    {course.shortDescription}
                  </p>

                  {/* Highlights meta */}
                  <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-[#1a2c42] text-xs text-[#bccadb]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#ffb531]" />
                      <span>{course.durationDays} Days Duration</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#7fb8ea]" />
                      <span>{course.totalClasses} Master Classes</span>
                    </div>
                  </div>

                  {/* Sample syllabus topics preview */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[11px] font-semibold text-[#7fb8ea] uppercase tracking-wider block">
                      Core Topics Include:
                    </span>
                    <ul className="text-xs text-[#bccadb] space-y-1">
                      {course.syllabus.slice(0, 3).map((item, sidx) => (
                        <li key={sidx} className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb531]"></span>
                          <span className="truncate">{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action & Price Footer */}
                <div className="pt-4 border-t border-[#2e4666] space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-[#ffb531]">
                        ৳{course.price.toLocaleString()}
                      </span>
                      <span className="text-xs line-through text-[#728296] ml-2">
                        ৳{course.regularPrice.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      50% OFF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedCourseForDetails(course)}
                      className="py-2.5 px-3 rounded-xl border border-[#3a7bb8] text-white hover:bg-[#3a7bb8]/20 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      Full Details
                    </button>
                    <button
                      onClick={() => setSelectedCourseForEnroll(course)}
                      className="py-2.5 px-3 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1"
                    >
                      Enroll Now <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT INSTRUCTIONS & BKASH GUIDE */}
      <section id="payment" className="py-20 bg-[#060a11] border-b border-[#2e4666]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#101c2e] border-2 border-[#3a7bb8] rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold text-[#ffb531] uppercase tracking-wider">
                  Direct Verification &amp; Instant Access
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Payment &amp; Enrollment Works
                </h2>
                <p className="text-sm text-[#bccadb] leading-relaxed">
                  We use simple bKash and Nagad Send Money. Once you submit your Transaction ID, our admin team
                  verifies it, generates your student login credentials, and emails them directly to your inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl">
                    <span className="text-xs text-[#bccadb] block">Official bKash Number:</span>
                    <span className="text-lg font-mono font-bold text-[#ffb531]">
                      {settings?.bkashNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-[#7fb8ea] block mt-0.5">
                      {settings?.bkashType || 'Personal (Send Money)'}
                    </span>
                  </div>
                  <div className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl">
                    <span className="text-xs text-[#bccadb] block">Official Nagad Number:</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {settings?.nagadNumber || '01313893838'}
                    </span>
                    <span className="text-[11px] text-[#7fb8ea] block mt-0.5">
                      {settings?.nagadType || 'Personal (Send Money)'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#08111d] border-l-4 border-emerald-400 rounded-r-xl text-xs text-[#bccadb] space-y-1">
                  <p className="text-white font-semibold">Easy 4-Step Process:</p>
                  <p>1. Open your bKash or Nagad app and choose <strong>Send Money</strong>.</p>
                  <p>2. Send the exact course amount to our official number above, adding your name in the Reference.</p>
                  <p>3. Copy the TrxID from your SMS and paste it in the course enrollment form.</p>
                  <p>4. Check your email for your auto-generated student login password!</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#08111d] border border-[#2e4666] rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#ffb531]/20 border-2 border-[#ffb531] text-[#ffb531] flex items-center justify-center mx-auto text-2xl">
                  💬
                </div>
                <h3 className="text-lg font-bold text-white">Have Pre-Enrollment Questions?</h3>
                <p className="text-xs text-[#bccadb]">
                  Need syllabus clarification or help choosing the right course for your career goals? Talk directly with our team.
                </p>
                <div className="space-y-2 pt-2">
                  <a
                    href={`https://wa.me/${whatsapp}?text=Hello,%20I%20have%20a%20question%20about%20Concrete%20Path%20Academy%20courses.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    Direct WhatsApp Support
                  </a>
                  <a
                    href={`tel:${phone}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#101c2e] hover:bg-[#1a2c42] border border-[#3a7bb8] text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    Call: {phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-[#08111d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-[#bccadb] mt-2">Answers to common queries from aspiring civil engineers.</p>
          </div>

          <div className="space-y-4">
            <details className="group bg-[#101c2e] border border-[#2e4666] rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-white">
                <span>Who should join these courses?</span>
                <span className="transition group-open:rotate-180 text-[#ffb531]">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-[#bccadb]">
                Fresh civil engineering graduates (B.Sc. and Diploma), junior site engineers, and working professionals looking to transition smoothly into real estate developers, structural consultancies, or project management firms in Bangladesh.
              </p>
            </details>

            <details className="group bg-[#101c2e] border border-[#2e4666] rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-white">
                <span>How are classes held and do I get recordings?</span>
                <span className="transition group-open:rotate-180 text-[#ffb531]">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-[#bccadb]">
                Live interactive classes are conducted via Google Meet in evening slots (8:00 PM / 8:30 PM BST) so working engineers can join easily. Full HD recordings of every class are uploaded to your Student Dashboard alongside downloadable Excel BOQ sheets and AutoCAD drawings.
              </p>
            </details>

            <details className="group bg-[#101c2e] border border-[#2e4666] rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-white">
                <span>How will I receive my login credentials?</span>
                <span className="transition group-open:rotate-180 text-[#ffb531]">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-[#bccadb]">
                After you submit your enrollment form with your bKash/Nagad Transaction ID, our admin confirms the transaction. The system immediately generates an auto-generated password and dispatches a confirmation email containing your login details and direct course WhatsApp group link.
              </p>
            </details>

            <details className="group bg-[#101c2e] border border-[#2e4666] rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-white">
                <span>Will I receive a course completion certificate?</span>
                <span className="transition group-open:rotate-180 text-[#ffb531]">▼</span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-[#bccadb]">
                Yes! Upon completing the course lectures and submitting the designated assignments, students receive an official verifiable digital certificate from Concrete Path Academy.
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
    </div>
  );
}
