'use client';

import React from 'react';
import { Course } from '@/lib/types';
import { X, Clock, BookOpen, CheckCircle, Award, Users, ChevronRight } from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (course: Course) => void;
}

export default function CourseModal({ course, isOpen, onClose, onEnroll }: CourseModalProps) {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#101c2e] border-2 border-[#2e4666] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1624] border-b border-[#2e4666] p-6 flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-bold text-[#ffb531] bg-[#ffb531]/10 border border-[#ffb531]/20 rounded-full mb-2">
              {course.category}
            </span>
            <h2 className="text-2xl font-extrabold text-white">{course.title}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#bccadb]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7fb8ea]" />
                Duration: {course.durationDays} Days
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#7fb8ea]" />
                Total Classes: {course.totalClasses} Classes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#50c878]" />
                Verified Certificate
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#bccadb] hover:text-white rounded-lg bg-[#1a2c42]/50 hover:bg-[#1a2c42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-base font-bold text-white mb-2">About This Course</h3>
            <p className="text-sm text-[#bccadb] leading-relaxed">{course.fullDescription}</p>
          </div>

          {/* Pricing Box */}
          <div className="bg-[#08111d] border border-[#2e4666] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#ffb531]">৳{course.price.toLocaleString()}</span>
                <span className="text-sm line-through text-[#bccadb]/60">৳{course.regularPrice.toLocaleString()}</span>
                <span className="text-xs font-bold bg-[#ffb531]/20 text-[#ffb531] px-2 py-0.5 rounded">
                  50% DISCOUNT
                </span>
              </div>
              <p className="text-xs text-[#bccadb] mt-1">
                Includes full class recordings, live doubt clearing, spreadsheets, and private batch access.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onEnroll(course);
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-base shadow-lg shadow-[#ffb531]/20 flex items-center justify-center gap-2 transition"
            >
              Enroll Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Instructor Box */}
          <div className="border border-[#2e4666] bg-[#0b1624] rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#101c2e] border border-[#3a7bb8] flex items-center justify-center text-xl shrink-0">
              👷‍♂️
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{course.instructor?.name || 'Md Abdul Mazid'}</h4>
              <p className="text-xs text-[#7fb8ea] font-medium">{course.instructor?.designation || 'Senior Civil Engineer (BUET)'}</p>
              <p className="text-xs text-[#bccadb] mt-1 line-clamp-2">
                {course.instructor?.bio || 'Taught by practicing engineer with 10+ years on Bangladeshi construction and real estate projects.'}
              </p>
            </div>
          </div>

          {/* Detailed Syllabus */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ffb531]" />
              Class-by-Class Comprehensive Syllabus
            </h3>
            <div className="space-y-3">
              {course.syllabus && course.syllabus.length > 0 ? (
                course.syllabus.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-[#2e4666] bg-[#08111d] rounded-xl p-4 hover:border-[#3a7bb8] transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#3a7bb8]/30 border border-[#3a7bb8] text-[#7fb8ea] font-bold text-xs flex items-center justify-center shrink-0">
                        {item.classNumber || idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        {item.topics && item.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.topics.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="text-[11px] bg-[#101c2e] text-[#bccadb] border border-[#2e4666] px-2.5 py-0.5 rounded-full"
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
                <p className="text-sm text-[#bccadb] italic">Syllabus details available upon course start.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0b1624] border-t border-[#2e4666] p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[#2e4666] text-[#bccadb] hover:text-white text-sm font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEnroll(course);
            }}
            className="px-6 py-2.5 rounded-lg bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] text-sm font-bold shadow-md transition"
          >
            Enroll in This Course
          </button>
        </div>
      </div>
    </div>
  );
}
