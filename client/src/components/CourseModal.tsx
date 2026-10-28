'use client';

import React from 'react';
import { Course } from '@/lib/types';
import { X, Clock, BookOpen, Award, ChevronRight } from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (course: Course) => void;
}

export default function CourseModal({ course, isOpen, onClose, onEnroll }: CourseModalProps) {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1222]/95 backdrop-blur-md border-b border-slate-800 p-6 flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 rounded-full mb-2.5">
              {course.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{course.title}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Duration: {course.durationDays} Days
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                Total Classes: {course.totalClasses} Classes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Verified Certificate Included
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-base font-bold text-white mb-2">About This Course</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{course.fullDescription}</p>
          </div>

          {/* Pricing Box */}
          <div className="bg-gradient-to-r from-[#131f38] to-[#0d1628] border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-amber-400">৳{course.price.toLocaleString()}</span>
                <span className="text-sm line-through text-slate-500">৳{course.regularPrice.toLocaleString()}</span>
                <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  50% DISCOUNT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Includes full class recordings, live doubt clearing, spreadsheets, and private batch access.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onEnroll(course);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
            >
              Enroll Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Instructor Box */}
          <div className="border border-slate-800 bg-slate-900/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-md shrink-0">
              <img
                src="/instructor.jpg"
                alt="Md Abdul Mazid"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                {course.instructor?.name || 'Md Abdul Mazid'} <span className="text-amber-400 text-xs">★</span>
              </h4>
              <p className="text-xs text-sky-400 font-semibold">{course.instructor?.designation || 'Senior Civil Engineer (BUET)'}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {course.instructor?.bio || 'Taught by practicing engineer with 10+ years on Bangladeshi construction and real estate projects.'}
              </p>
            </div>
          </div>

          {/* Detailed Syllabus */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3.5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Class-by-Class Comprehensive Syllabus
            </h3>
            <div className="space-y-3">
              {course.syllabus && course.syllabus.length > 0 ? (
                course.syllabus.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-800 bg-slate-900/90 rounded-2xl p-4.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
                        {item.classNumber || idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        {item.topics && item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {item.topics.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-0.5 rounded-full"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Class schedule will be announced in WhatsApp group.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#0b1222]/95 backdrop-blur-md border-t border-slate-800 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEnroll(course);
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            Enroll in This Course <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
