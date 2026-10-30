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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6">
      <div className="relative bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 p-4 sm:p-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-2">
              {course.category}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">{course.title}</h2>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mt-2 sm:mt-2.5 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Duration: {course.durationDays} Days
              </span>
              <span className="hidden xs:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Total Classes: {course.totalClasses} Classes
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1.5 font-medium">
                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Verified Certificate
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 transition shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">About This Course</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{course.fullDescription}</p>
          </div>

          {/* Pricing Box */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-baseline gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">৳{course.price.toLocaleString()}</span>
                <span className="text-xs sm:text-sm line-through text-slate-400">৳{course.regularPrice.toLocaleString()}</span>
                <span className="text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 rounded-full">
                  50% DISCOUNT
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                Includes full class recordings, live doubt clearing, spreadsheets, and private batch access.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onEnroll(course);
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
            >
              Enroll Now <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Instructor Box */}
          <div className="border border-slate-200 bg-slate-50 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-md shrink-0">
              <img
                src="/instructor.jpg?v=2"
                alt="Engr. Md Abdul Mazid"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                {course.instructor?.name
                  ? (course.instructor.name.startsWith('Engr.') ? course.instructor.name : `Engr. ${course.instructor.name}`)
                  : 'Engr. Md Abdul Mazid'}{' '}
                <span className="text-amber-500 text-xs">★</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-blue-700 font-semibold truncate">{course.instructor?.designation || 'Senior Civil Engineer (BUET)'}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                {course.instructor?.bio || 'Taught by practicing engineer with 10+ years on Bangladeshi construction and real estate projects.'}
              </p>
            </div>
          </div>

          {/* Detailed Syllabus */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 shrink-0" />
              Class-by-Class Comprehensive Syllabus
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {course.syllabus && course.syllabus.length > 0 ? (
                course.syllabus.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 bg-slate-50 hover:bg-white rounded-2xl p-3.5 sm:p-4 transition shadow-xs"
                  >
                    <div className="flex items-start gap-3 sm:gap-3.5">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                        {item.classNumber || idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                        {item.topics && item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.topics.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="text-[10px] sm:text-[11px] bg-white text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full"
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
                <p className="text-xs text-slate-500">Class schedule will be announced in WhatsApp group.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md border-t border-slate-100 p-3.5 sm:p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEnroll(course);
            }}
            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black transition shadow-md shadow-amber-500/20"
          >
            Enroll in This Course
          </button>
        </div>
      </div>
    </div>
  );
}
