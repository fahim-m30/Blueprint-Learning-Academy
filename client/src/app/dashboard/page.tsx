'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, removeAuthToken } from '@/lib/api';
import { Course, TaskSubmission, ChatMessage } from '@/lib/types';
import {
  Clock,
  Video,
  Calendar,
  ClipboardList,
  MessageSquare,
  LogOut,
  Send,
  ExternalLink,
  CheckCircle,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [enrolledList, setEnrolledList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);

  // Active tab in course
  const [activeTab, setActiveTab] = useState<'videos' | 'live' | 'tasks' | 'chat'>('videos');

  // Task submission form state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskMsg, setTaskMsg] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await apiRequest('/student/dashboard');
    if (res.success && res.data) {
      setStudentInfo(res.data.student);
      const courses = res.data.enrolledCourses || [];
      setEnrolledList(courses);

      if (courses.length > 0) {
        const firstId = courses[0].course._id;
        setSelectedCourseId(firstId);
        await loadCourseData(firstId);
      }
    } else {
      removeAuthToken();
      router.push('/login');
    }
    setLoading(false);
  };

  const loadCourseData = async (courseId: string) => {
    const [cRes, chatRes] = await Promise.all([
      apiRequest(`/student/course/${courseId}`),
      apiRequest(`/student/course/${courseId}/chat`),
    ]);

    if (cRes.success && cRes.data?.course) {
      setCourseDetails(cRes.data.course);
      setMySubmissions(cRes.data.mySubmissions || []);
    }
    if (chatRes.success && chatRes.data?.messages) {
      setChatMessages(chatRes.data.messages);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    await loadCourseData(courseId);
  };

  const handleTaskSubmit = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!submissionText && !submissionLink) {
      setTaskMsg('Please write a note or provide your assignment link.');
      return;
    }

    setSubmittingTask(true);
    setTaskMsg('');

    const res = await apiRequest(`/student/course/${selectedCourseId}/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionText, submissionLink }),
    });

    setSubmittingTask(false);

    if (res.success) {
      setTaskMsg('Assignment submitted successfully!');
      setSubmissionText('');
      setSubmissionLink('');
      setSelectedTaskId(null);
      loadCourseData(selectedCourseId);
    } else {
      setTaskMsg(res.message || 'Error submitting assignment.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setSendingChat(true);
    const res = await apiRequest(`/student/course/${selectedCourseId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: chatInput.trim() }),
    });
    setSendingChat(false);

    if (res.success && res.data?.message) {
      setChatMessages((prev) => [...prev, res.data.message]);
      setChatInput('');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  const activeEnrolledItem = enrolledList.find((e) => e.course?._id === selectedCourseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs sm:text-sm text-slate-400">Loading your student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-xl border-b border-[#1c2b48] px-3 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full ring-2 ring-amber-400 bg-white p-0.5 shadow-md group-hover:scale-105 transition"
              />
              <span className="text-base sm:text-xl font-black text-white hidden md:inline truncate">
                Blueprint <span className="text-amber-400">Learning Academy</span>
              </span>
            </Link>
            <span className="text-[11px] sm:text-xs bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 sm:px-2.5 py-0.5 rounded-full font-bold shrink-0">
              Student Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white truncate max-w-[160px]">{studentInfo?.name}</span>
              <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">{studentInfo?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {enrolledList.length === 0 ? (
          <div className="bg-[#0f182c] border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              📚
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">No Active Enrolled Courses</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              You are not currently enrolled in any active courses, or your enrollment application is pending verification.
            </p>
            <Link
              href="/#courses"
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md"
            >
              Explore Available Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multi-Course Switcher Tabs (if enrolled in multiple) */}
            {enrolledList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">Enrolled Courses:</span>
                {enrolledList.map((e) => (
                  <button
                    key={e.course._id}
                    onClick={() => handleSelectCourse(e.course._id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      selectedCourseId === e.course._id
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-[#0f182c] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {e.course.title}
                  </button>
                ))}
              </div>
            )}

            {/* Course Summary Banner with Countdown Timer & WhatsApp Button */}
            {courseDetails && (
              <div className="bg-gradient-to-r from-[#111c34] via-[#0d162a] to-[#090e1c] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-semibold inline-block mb-2">
                      {courseDetails.category}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-white">{courseDetails.title}</h1>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl line-clamp-2">
                      {courseDetails.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Remaining Days Countdown */}
                    <div className="bg-[#080d1a] border border-slate-700/80 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Validity</span>
                      <span className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {activeEnrolledItem?.daysRemaining !== undefined
                          ? `${activeEnrolledItem.daysRemaining} Days Left`
                          : `${courseDetails.durationDays} Days`}
                      </span>
                    </div>

                    {/* Direct WhatsApp Group Button */}
                    {courseDetails.whatsappGroupLink && (
                      <a
                        href={courseDetails.whatsappGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        Join WhatsApp Batch
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                Videos ({courseDetails?.videos?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Live Classes ({courseDetails?.liveClasses?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                Tasks ({courseDetails?.tasks?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                Instructor Chat
              </button>
            </div>

            {/* TAB 1: VIDEOS & RECORDINGS */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                {courseDetails?.videos && courseDetails.videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {courseDetails.videos.map((vid, idx) => {
                      let embedUrl = vid.youtubeUrl;
                      if (vid.youtubeUrl.includes('watch?v=')) {
                        embedUrl = vid.youtubeUrl.replace('watch?v=', 'embed/');
                      } else if (vid.youtubeUrl.includes('youtu.be/')) {
                        embedUrl = vid.youtubeUrl.replace('youtu.be/', 'www.youtube.com/embed/');
                      }

                      return (
                        <div
                          key={vid._id || idx}
                          className="bg-[#0f182c] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                        >
                          <div className="relative aspect-video w-full bg-black">
                            <iframe
                              src={embedUrl}
                              title={vid.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full border-0"
                            ></iframe>
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-sky-400">
                              <span>Class Lecture #{idx + 1}</span>
                              {vid.duration && <span>{vid.duration}</span>}
                            </div>
                            <h3 className="text-sm font-bold text-white">{vid.title}</h3>
                            {vid.note && (
                              <p className="text-xs text-slate-300 bg-[#080d1a] p-2.5 rounded-xl border border-slate-700/80">
                                📌 <strong>Note:</strong> {vid.note}
                              </p>
                            )}
                            <div className="pt-2 flex justify-end">
                              <a
                                href={vid.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                Watch on YouTube <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#0f182c] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                    No video recordings published yet for this batch. New lectures are uploaded after each live class.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LIVE CLASSES & SCHEDULE */}
            {activeTab === 'live' && (
              <div className="space-y-4">
                {courseDetails?.liveClasses && courseDetails.liveClasses.length > 0 ? (
                  courseDetails.liveClasses.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="bg-[#0f182c] border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                            Live Class #{idx + 1}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            {new Date(item.classDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            {item.classTime}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{item.platform}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-sky-300 mt-1 italic">Note: {item.note}</p>
                        )}
                      </div>

                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shrink-0"
                      >
                        Join Live Class <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#0f182c] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                    No live classes scheduled at this moment. You will receive WhatsApp group notifications when new sessions are posted.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TASKS & ASSIGNMENTS */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {taskMsg && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs">
                    {taskMsg}
                  </div>
                )}

                {courseDetails?.tasks && courseDetails.tasks.length > 0 ? (
                  courseDetails.tasks.map((task) => {
                    const submission = mySubmissions.find((s) => s.taskId === task._id);

                    return (
                      <div
                        key={task._id}
                        className="bg-[#0f182c] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[11px] font-bold text-amber-400 uppercase">
                              Points: {task.points}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white">{task.title}</h3>
                          </div>
                          <div className="text-xs text-slate-400">
                            Deadline: <span className="text-red-400 font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-[#080d1a] p-3.5 rounded-xl border border-slate-700/80">
                          {task.description}
                        </p>

                        {submission ? (
                          <div className="bg-[#080d1a] border border-sky-500/40 rounded-xl p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 shrink-0" /> Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                              <span className="text-slate-400">Status: <strong className="text-white">{submission.status}</strong></span>
                            </div>
                            {submission.submissionLink && (
                              <p className="text-sky-300">
                                <strong>Your Link:</strong>{' '}
                                <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="underline break-all">
                                  {submission.submissionLink}
                                </a>
                              </p>
                            )}
                            {submission.submissionText && (
                              <p className="text-slate-300">
                                <strong>Your Note:</strong> {submission.submissionText}
                              </p>
                            )}
                            {submission.feedback && (
                              <div className="mt-2 p-2.5 bg-slate-900 border border-amber-400 rounded-lg">
                                <strong className="text-amber-400 block mb-0.5">Instructor Feedback:</strong>
                                <span className="text-white">{submission.feedback}</span>
                                {submission.grade && <span className="block mt-1 font-bold text-emerald-400">Grade: {submission.grade}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {selectedTaskId === task._id ? (
                              <form onSubmit={(e) => handleTaskSubmit(e, task._id)} className="space-y-3 bg-[#080d1a] p-4 rounded-xl border border-slate-700">
                                <h4 className="text-xs font-bold text-white">Submit Your Assignment</h4>
                                <div>
                                  <label className="block text-[11px] text-slate-300 mb-1">
                                    Google Drive / PDF / File URL (গুগল ড্রাইভ বা ফাইল লিংক)
                                  </label>
                                  <input
                                    type="url"
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-[#0f182c] border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-300 mb-1">
                                    Notes / Explanation (মন্তব্য বা হিসাবের বিবরণ)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Write any note regarding your solution..."
                                    className="w-full bg-[#0f182c] border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                  ></textarea>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTaskId(null)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingTask}
                                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
                                  >
                                    {submittingTask ? 'Submitting...' : 'Upload & Submit'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskId(task._id)}
                                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                              >
                                Submit Assignment Solution <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-[#0f182c] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                    No assignments posted for this course yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECT CHAT WITH INSTRUCTOR / ADMIN */}
            {activeTab === 'chat' && (
              <div className="bg-[#0f182c] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] sm:h-[600px] shadow-xl">
                {/* Chat Header */}
                <div className="bg-[#0b1222] border-b border-slate-800 p-3.5 sm:p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Course Instructor &amp; Support Discussion
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">Direct line with Md Abdul Mazid &amp; Course Admin</p>
                  </div>
                  <span className="text-[10px] text-sky-400 font-medium bg-slate-800 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-700">
                    Batch Active
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#080d1a]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No messages yet. Send a question to start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.senderRole === 'student';

                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                            {msg.senderName} ({msg.senderRole === 'admin' ? 'Instructor' : 'You'})
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs ${
                              isMe
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-semibold rounded-br-none'
                                : 'bg-[#0f182c] text-white border border-slate-700 rounded-bl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 bg-[#0b1222] border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question or message to the instructor..."
                    className="flex-1 bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
