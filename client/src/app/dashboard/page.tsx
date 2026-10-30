'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, removeAuthToken } from '@/lib/api';
import { Course, TaskSubmission, ChatMessage, StudentCV } from '@/lib/types';
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
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Briefcase,
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
  const [activeTab, setActiveTab] = useState<'videos' | 'live' | 'tasks' | 'chat' | 'cv'>('videos');

  // Task submission form state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskMsg, setTaskMsg] = useState('');

  // CV submission state
  const [studentCv, setStudentCv] = useState<StudentCV | null>(null);
  const [cvFileUrl, setCvFileUrl] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvFileData, setCvFileData] = useState('');
  const [cvTargetJobTitle, setCvTargetJobTitle] = useState('');
  const [cvNote, setCvNote] = useState('');
  const [submittingCv, setSubmittingCv] = useState(false);
  const [cvMsg, setCvMsg] = useState<{ text: string; isError: boolean } | null>(null);

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

  // Trap back navigation so user stays firmly in the dashboard
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await apiRequest('/student/dashboard');
    if (res.success && res.data) {
      setStudentInfo(res.data.student);
      if (res.data.student?.cv) {
        setStudentCv(res.data.student.cv);
        setCvFileUrl(res.data.student.cv.fileUrl || '');
        setCvFileName(res.data.student.cv.fileName || '');
        setCvFileData(res.data.student.cv.fileData || '');
        setCvTargetJobTitle(res.data.student.cv.targetJobTitle || '');
        setCvNote(res.data.student.cv.note || '');
      }

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

  const handleCvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setCvMsg({ text: 'File size must be under 8MB.', isError: true });
      return;
    }

    setCvFileName(file.name);
    setCvMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCvFileData(event.target.result as string);
        setCvMsg({ text: `File "${file.name}" ready to submit. Click the submit button to save.`, isError: false });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFileData && !cvFileUrl.trim()) {
      setCvMsg({ text: 'Please upload a PDF/document or provide a Google Drive URL.', isError: true });
      return;
    }

    setSubmittingCv(true);
    setCvMsg(null);

    const res = await apiRequest('/student/cv', {
      method: 'POST',
      body: JSON.stringify({
        fileUrl: cvFileUrl.trim(),
        fileName: cvFileName.trim() || 'Resume.pdf',
        fileData: cvFileData,
        targetJobTitle: cvTargetJobTitle.trim(),
        note: cvNote.trim(),
      }),
    });

    setSubmittingCv(false);

    if (res.success && res.data?.cv) {
      setStudentCv(res.data.cv);
      setCvMsg({ text: 'CV successfully submitted for instructor and recruiter review!', isError: false });
    } else {
      setCvMsg({ text: res.message || 'Error submitting CV. Please try again.', isError: true });
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.replace('/login');
  };

  const activeEnrolledItem = enrolledList.find((e) => e.course?._id === selectedCourseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs sm:text-sm text-slate-500">Loading your student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full ring-2 ring-blue-600/20 bg-white p-0.5 shadow-xs group-hover:scale-105 transition"
              />
              <span className="text-base sm:text-xl font-black text-slate-900 hidden md:inline truncate">
                Blueprint <span className="text-blue-700">Learning Academy</span>
              </span>
            </Link>
            <span className="text-[11px] sm:text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 sm:px-2.5 py-0.5 rounded-full font-bold shrink-0">
              Student Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-900 truncate max-w-[160px]">{studentInfo?.name}</span>
              <span className="block text-[10px] text-slate-500 truncate max-w-[160px]">{studentInfo?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto text-2xl">
              📚
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">No Active Enrolled Courses</h2>
            <p className="text-xs sm:text-sm text-slate-500">
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
                <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">Enrolled Courses:</span>
                {enrolledList.map((e) => (
                  <button
                    key={e.course._id}
                    onClick={() => handleSelectCourse(e.course._id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      selectedCourseId === e.course._id
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {e.course.title}
                  </button>
                ))}
              </div>
            )}

            {/* Course Summary Banner with Countdown Timer & WhatsApp Button */}
            {courseDetails && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold inline-block mb-2">
                      {courseDetails.category}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">{courseDetails.title}</h1>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl line-clamp-2">
                      {courseDetails.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Remaining Days Countdown */}
                    <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Course Validity</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
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
                        className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
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
            <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                Videos ({courseDetails?.videos?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Live Classes ({courseDetails?.liveClasses?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                Tasks ({courseDetails?.tasks?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                Instructor Chat
              </button>

              <button
                onClick={() => setActiveTab('cv')}
                className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'cv'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                My CV &amp; Career Placement
                {studentCv?.updatedAt && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
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
                          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
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
                            <div className="flex items-center justify-between text-[11px] text-blue-700 font-semibold">
                              <span>Class Lecture #{idx + 1}</span>
                              {vid.duration && <span>{vid.duration}</span>}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">{vid.title}</h3>
                            {vid.note && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                📌 <strong>Note:</strong> {vid.note}
                              </p>
                            )}
                            <div className="pt-2 flex justify-end">
                              <a
                                href={vid.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
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
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
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
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                            Live Class #{idx + 1}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            {new Date(item.classDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {item.classTime}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{item.platform}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-blue-700 mt-1 italic">Note: {item.note}</p>
                        )}
                      </div>

                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm shrink-0"
                      >
                        Join Live Class <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
                    No live classes scheduled at this moment. You will receive WhatsApp group notifications when new sessions are posted.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TASKS & ASSIGNMENTS */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {taskMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                    {taskMsg}
                  </div>
                )}

                {courseDetails?.tasks && courseDetails.tasks.length > 0 ? (
                  courseDetails.tasks.map((task) => {
                    const submission = mySubmissions.find((s) => s.taskId === task._id);

                    return (
                      <div
                        key={task._id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[11px] font-bold text-amber-600 uppercase">
                              Points: {task.points}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">{task.title}</h3>
                          </div>
                          <div className="text-xs text-slate-500">
                            Deadline: <span className="text-red-600 font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          {task.description}
                        </p>

                        {submission ? (
                          <div className="bg-slate-50 border border-blue-200 rounded-xl p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                              <span className="text-slate-500">Status: <strong className="text-slate-900">{submission.status}</strong></span>
                            </div>
                            {submission.submissionLink && (
                              <p className="text-blue-700">
                                <strong>Your Link:</strong>{' '}
                                <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="underline break-all">
                                  {submission.submissionLink}
                                </a>
                              </p>
                            )}
                            {submission.submissionText && (
                              <p className="text-slate-600">
                                <strong>Your Note:</strong> {submission.submissionText}
                              </p>
                            )}
                            {submission.feedback && (
                              <div className="mt-2 p-2.5 bg-white border border-amber-300 rounded-lg shadow-xs">
                                <strong className="text-amber-700 block mb-0.5">Instructor Feedback:</strong>
                                <span className="text-slate-900">{submission.feedback}</span>
                                {submission.grade && <span className="block mt-1 font-bold text-emerald-700">Grade: {submission.grade}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {selectedTaskId === task._id ? (
                              <form onSubmit={(e) => handleTaskSubmit(e, task._id)} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-900">Submit Your Assignment</h4>
                                <div>
                                  <label className="block text-[11px] text-slate-700 mb-1">
                                    Google Drive / PDF / File URL
                                  </label>
                                  <input
                                    type="url"
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-700 mb-1">
                                    Notes / Explanation
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Write any note regarding your solution..."
                                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                                  ></textarea>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTaskId(null)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingTask}
                                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-xs disabled:opacity-50"
                                  >
                                    {submittingTask ? 'Submitting...' : 'Upload & Submit'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskId(task._id)}
                                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
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
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
                    No assignments posted for this course yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECT CHAT WITH INSTRUCTOR / ADMIN */}
            {activeTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[520px] sm:h-[600px] shadow-sm">
                {/* Chat Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-3.5 sm:p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Course Instructor &amp; Support Discussion
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Direct line with Engr. Md Abdul Mazid &amp; Course Admin</p>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200">
                    Batch Active
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
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
                          <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium">
                            {msg.senderName} ({msg.senderRole === 'admin' ? 'Instructor' : 'You'})
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs ${
                              isMe
                                ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question or message to the instructor..."
                    className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: CV & RESUME PLACEMENT */}
            {activeTab === 'cv' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="relative z-10 max-w-2xl space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30 inline-block mb-1">
                      Direct Developer &amp; Consultant Placement
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      Submit Your CV / Resume for Instructor &amp; Recruiter Review
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Engr. Md Abdul Mazid and our developer company network review student resumes to directly assist with site engineering, estimation, and project management job interview selections.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Current Submitted Status */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <FileText className="w-4 h-4 text-blue-700" /> Current CV Status
                      </h3>

                      {studentCv?.updatedAt ? (
                        <div className="space-y-3.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Review Status:</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              studentCv.status === 'reviewed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : studentCv.status === 'needs_revision'
                                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                : 'bg-blue-50 text-blue-700 border border-blue-300'
                            }`}>
                              {studentCv.status || 'Submitted'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5">Target Job Role:</span>
                            <span className="font-bold text-slate-900">
                              {studentCv.targetJobTitle || 'Civil / Site / Project Engineer'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5">File Submitted:</span>
                            <span className="font-semibold text-slate-800 block truncate">
                              {studentCv.fileName || 'Resume.pdf'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5">Last Updated:</span>
                            <span className="font-medium text-slate-600">
                              {new Date(studentCv.updatedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Direct View / Download Button */}
                          <div className="pt-2">
                            {studentCv.fileData ? (
                              <a
                                href={studentCv.fileData}
                                download={studentCv.fileName || 'My_CV.pdf'}
                                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                              >
                                <Download className="w-4 h-4" /> Download / View My CV
                              </a>
                            ) : studentCv.fileUrl ? (
                              <a
                                href={studentCv.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                              >
                                <ExternalLink className="w-4 h-4" /> Open Submitted Link
                              </a>
                            ) : null}
                          </div>

                          {/* Instructor Feedback If Any */}
                          {studentCv.adminFeedback && (
                            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                💬 Instructor Review Feedback
                              </span>
                              <p className="text-amber-800 leading-relaxed">
                                {studentCv.adminFeedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-2 text-xs text-slate-500">
                          <p>You have not submitted a CV yet.</p>
                          <p className="text-[11px] text-slate-400">
                            Upload your resume using the form to get recruiter recommendations and instructor feedback.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Upload / Update Form */}
                  <div className="lg:col-span-2">
                    <form onSubmit={handleCvSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {studentCv?.updatedAt ? 'Update Your Submitted CV' : 'Upload & Submit Your CV'}
                        </h3>
                        <span className="text-[11px] text-blue-700 font-semibold">PDF / DOC / DOCX</span>
                      </div>

                      {cvMsg && (
                        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                          cvMsg.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {cvMsg.text}
                        </div>
                      )}

                      <div className="space-y-4 text-xs">
                        {/* Target Job Title */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Target Job Role / Career Track *
                          </label>
                          <input
                            type="text"
                            required
                            value={cvTargetJobTitle}
                            onChange={(e) => setCvTargetJobTitle(e.target.value)}
                            placeholder="e.g. Site Engineer, Project Engineer, BOQ Specialist, QA/QC Inspector"
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                          />
                        </div>

                        {/* File Upload (Option A) */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Upload CV Document (PDF / DOC / DOCX - Max 8MB)
                          </label>
                          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50/60 transition group cursor-pointer relative">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleCvFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">
                                  {cvFileName ? `Selected: ${cvFileName}` : 'Click or Drag & Drop CV file here'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Supported formats: PDF, DOCX (Maximum file size 8MB)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cloud URL (Option B) */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Or Provide Google Drive / Cloud Link
                          </label>
                          <input
                            type="url"
                            value={cvFileUrl}
                            onChange={(e) => setCvFileUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Ensure link sharing is set to "Anyone with the link can view".
                          </span>
                        </div>

                        {/* Note to Instructor */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Career Summary / Note for the Placement Team
                          </label>
                          <textarea
                            rows={3}
                            value={cvNote}
                            onChange={(e) => setCvNote(e.target.value)}
                            placeholder="Briefly state your graduation year, university, site experience (if any), and preferred company types (developer, contractor, consultancy)..."
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                          ></textarea>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingCv}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {submittingCv ? 'Submitting CV...' : studentCv?.updatedAt ? 'Update My CV' : 'Submit CV for Review'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
