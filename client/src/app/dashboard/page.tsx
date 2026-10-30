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

    // Fast hydrate from local cache if previously visited
    try {
      const cached = localStorage.getItem('bpa_student_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.student) setStudentInfo(data.student);
        if (data.enrolledCourses) setEnrolledList(data.enrolledCourses);
        if (data.courseDetails) setCourseDetails(data.courseDetails);
        if (data.selectedCourseId) setSelectedCourseId(data.selectedCourseId);
        if (data.student?.cv) setStudentCv(data.student.cv);
        setLoading(false);
      }
    } catch {}

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

      let currentCourse = null;
      if (courses.length > 0) {
        const firstId = selectedCourseId || courses[0].course._id;
        setSelectedCourseId(firstId);
        currentCourse = await loadCourseData(firstId);
      }

      try {
        localStorage.setItem(
          'bpa_student_cache',
          JSON.stringify({
            student: res.data.student,
            enrolledCourses: courses,
            selectedCourseId: selectedCourseId || courses[0]?.course?._id,
            courseDetails: currentCourse || courseDetails,
          })
        );
      } catch {}
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

    let loadedCourse = null;
    if (cRes.success && cRes.data?.course) {
      setCourseDetails(cRes.data.course);
      loadedCourse = cRes.data.course;
      setMySubmissions(cRes.data.mySubmissions || []);
    }
    if (chatRes.success && chatRes.data?.messages) {
      setChatMessages(chatRes.data.messages);
    }
    return loadedCourse;
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="w-11 h-11 sm:w-13 sm:h-13 object-contain rounded-full ring-2 ring-blue-600/20 bg-white p-0.5 shadow-xs group-hover:scale-105 transition"
              />
              <span className="text-lg sm:text-2xl font-black text-slate-950 hidden md:inline truncate tracking-tight">
                Blueprint <span className="text-blue-700">Learning Academy</span>
              </span>
            </Link>
            <span className="text-xs sm:text-sm bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full font-extrabold shrink-0">
              Student Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-black text-slate-900 truncate max-w-[200px]">{studentInfo?.name}</span>
              <span className="block text-xs font-semibold text-slate-500 truncate max-w-[200px]">{studentInfo?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition shadow-xs"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto text-3xl">
              📚
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">No Active Enrolled Courses</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You are not currently enrolled in any active courses, or your enrollment application is pending verification.
            </p>
            <Link
              href="/#courses"
              className="inline-block px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-md"
            >
              Explore Available Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multi-Course Switcher Tabs (if enrolled in multiple) */}
            {enrolledList.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-600 shrink-0 mr-1">Enrolled Courses:</span>
                {enrolledList.map((e) => (
                  <button
                    key={e.course._id}
                    onClick={() => handleSelectCourse(e.course._id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border ${
                      selectedCourseId === e.course._id
                        ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {e.course.title}
                  </button>
                ))}
              </div>
            )}

            {/* Course Summary Banner with Countdown Timer & WhatsApp Button */}
            {courseDetails && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                  <div className="min-w-0">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-block mb-2">
                      {courseDetails.category}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{courseDetails.title}</h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl line-clamp-2 leading-relaxed">
                      {courseDetails.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                    {/* Remaining Days Countdown */}
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-center">
                      <span className="text-[11px] sm:text-xs uppercase font-extrabold text-slate-500 block tracking-wider">Course Validity</span>
                      <span className="text-lg sm:text-xl font-black text-slate-950 flex items-center justify-center gap-1.5 mt-0.5">
                        <Clock className="w-4 h-4 text-amber-500" />
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
                        className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition hover:scale-105"
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
            <div className="flex border-b border-slate-200 gap-2 sm:gap-3 overflow-x-auto pb-1 text-sm sm:text-base">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-3 sm:py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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
                className={`py-3 sm:py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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
                className={`py-3 sm:py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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
                className={`py-3 sm:py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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
                className={`py-3 sm:py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm ${
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

                          <div className="p-4 sm:p-5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-blue-700 font-bold uppercase tracking-wider">
                              <span>Class Lecture #{idx + 1}</span>
                              {vid.duration && <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono">{vid.duration}</span>}
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-950 leading-snug">{vid.title}</h3>
                            {vid.note && (
                              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                                📌 <strong>Instructor Note:</strong> {vid.note}
                              </p>
                            )}
                            <div className="pt-2 flex justify-end">
                              <a
                                href={vid.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-blue-700 hover:text-blue-800 flex items-center gap-1.5 font-bold hover:underline"
                              >
                                Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-xs">
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
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-xs sm:text-sm font-extrabold text-red-600 uppercase tracking-wider">
                            Live Class #{idx + 1}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-950">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            {new Date(item.classDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-bold text-blue-700">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {item.classTime}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{item.platform}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs sm:text-sm text-blue-700 mt-1 italic font-medium">📌 Note: {item.note}</p>
                        )}
                      </div>

                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-blue-700/20 shrink-0 hover:scale-105"
                      >
                        Join Live Class <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-xs">
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
                        className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg uppercase tracking-wider">
                              Points: {task.points}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-950">{task.title}</h3>
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-slate-500">
                            Deadline: <span className="text-red-600 font-black">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                          {task.description}
                        </p>

                        {submission ? (
                          <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-700 font-black flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                              <span className="text-slate-500 font-medium">Status: <strong className="text-slate-950 font-black uppercase text-xs bg-slate-200 px-2 py-0.5 rounded">{submission.status}</strong></span>
                            </div>
                            {submission.submissionLink && (
                              <p className="text-blue-700 font-medium">
                                <strong>Your Link:</strong>{' '}
                                <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="underline break-all font-semibold">
                                  {submission.submissionLink}
                                </a>
                              </p>
                            )}
                            {submission.submissionText && (
                              <p className="text-slate-700 font-medium">
                                <strong>Your Note:</strong> {submission.submissionText}
                              </p>
                            )}
                            {submission.feedback && (
                              <div className="mt-3 p-3 bg-white border border-amber-300 rounded-xl shadow-xs space-y-1">
                                <strong className="text-amber-800 block font-black text-xs uppercase tracking-wide">Instructor Feedback:</strong>
                                <span className="text-slate-900 leading-relaxed">{submission.feedback}</span>
                                {submission.grade && <span className="block mt-1.5 font-black text-emerald-700">Grade: {submission.grade}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {selectedTaskId === task._id ? (
                              <form onSubmit={(e) => handleTaskSubmit(e, task._id)} className="space-y-3.5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <h4 className="text-sm font-black text-slate-950">Submit Your Assignment Solution</h4>
                                <div>
                                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                                    Google Drive / PDF / File URL
                                  </label>
                                  <input
                                    type="url"
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                                    Notes / Explanation
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Write any note regarding your solution..."
                                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium"
                                  ></textarea>
                                </div>
                                <div className="flex justify-end gap-2.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTaskId(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingTask}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 disabled:opacity-50"
                                  >
                                    {submittingTask ? 'Submitting...' : 'Upload & Submit'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskId(task._id)}
                                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm hover:scale-105"
                              >
                                Submit Assignment Solution <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-xs">
                    No assignments posted for this course yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECT CHAT WITH INSTRUCTOR / ADMIN */}
            {activeTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[540px] sm:h-[620px] shadow-sm">
                {/* Chat Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Course Instructor &amp; Support Discussion
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Direct line with Engr. Md Abdul Mazid &amp; Course Admin</p>
                  </div>
                  <span className="text-xs text-blue-700 font-extrabold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Batch Active
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-[#f8fafc]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-16 text-sm text-slate-400 font-medium">
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
                          <span className="text-xs text-slate-500 mb-1 px-1 font-bold">
                            {msg.senderName} ({msg.senderRole === 'admin' ? 'Instructor' : 'You'})
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                                : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-none shadow-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 px-1 font-medium">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex gap-2.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question or message to the instructor..."
                    className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-5 sm:px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-4 h-4" /> <span className="hidden xs:inline">Send</span>
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
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                      <h3 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3.5">
                        <FileText className="w-4 h-4 text-blue-700" /> Current CV Status
                      </h3>

                      {studentCv?.updatedAt ? (
                        <div className="space-y-4 text-xs sm:text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Review Status:</span>
                            <span className={`px-3 py-1 rounded-full font-black uppercase text-xs ${
                              studentCv.status === 'reviewed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : studentCv.status === 'needs_revision'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-blue-50 text-blue-800 border border-blue-300'
                            }`}>
                              {studentCv.status || 'Submitted'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5 font-medium">Target Job Role:</span>
                            <span className="font-extrabold text-slate-950 text-sm sm:text-base">
                              {studentCv.targetJobTitle || 'Civil / Site / Project Engineer'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5 font-medium">File Submitted:</span>
                            <span className="font-bold text-slate-900 block truncate">
                              {studentCv.fileName || 'Resume.pdf'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block mb-0.5 font-medium">Last Updated:</span>
                            <span className="font-semibold text-slate-700">
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
                                className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                              >
                                <Download className="w-4 h-4" /> Download / View My CV
                              </a>
                            ) : studentCv.fileUrl ? (
                              <a
                                href={studentCv.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                              >
                                <ExternalLink className="w-4 h-4" /> Open Submitted Link
                              </a>
                            ) : null}
                          </div>

                          {/* Instructor Feedback If Any */}
                          {studentCv.adminFeedback && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                              <span className="font-black text-amber-900 flex items-center gap-1.5 uppercase text-xs tracking-wider">
                                💬 Instructor Review Feedback
                              </span>
                              <p className="text-amber-900 leading-relaxed font-medium">
                                {studentCv.adminFeedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 space-y-2 text-xs sm:text-sm text-slate-500 font-medium">
                          <p className="font-bold text-slate-800">You have not submitted a CV yet.</p>
                          <p className="text-xs text-slate-400">
                            Upload your resume using the form to get recruiter recommendations and instructor feedback.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Upload / Update Form */}
                  <div className="lg:col-span-2">
                    <form onSubmit={handleCvSubmit} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                        <h3 className="text-base sm:text-lg font-black text-slate-950">
                          {studentCv?.updatedAt ? 'Update Your Submitted CV' : 'Upload & Submit Your CV'}
                        </h3>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">PDF / DOC / DOCX</span>
                      </div>

                      {cvMsg && (
                        <div className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                          cvMsg.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {cvMsg.text}
                        </div>
                      )}

                      <div className="space-y-4 text-xs sm:text-sm">
                        {/* Target Job Title */}
                        <div>
                          <label className="block text-slate-800 font-bold mb-1.5">
                            Target Job Role / Career Track *
                          </label>
                          <input
                            type="text"
                            required
                            value={cvTargetJobTitle}
                            onChange={(e) => setCvTargetJobTitle(e.target.value)}
                            placeholder="e.g. Site Engineer, Project Engineer, BOQ Specialist, QA/QC Inspector"
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-3 text-slate-900 outline-none font-medium text-xs sm:text-sm"
                          />
                        </div>

                        {/* File Upload (Option A) */}
                        <div>
                          <label className="block text-slate-800 font-bold mb-1.5">
                            Upload CV Document (PDF / DOC / DOCX - Max 8MB)
                          </label>
                          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/60 transition group cursor-pointer relative">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleCvFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center gap-2.5">
                              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition shadow-xs">
                                <Upload className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">
                                  {cvFileName ? `Selected: ${cvFileName}` : 'Click or Drag & Drop CV file here'}
                                </span>
                                <span className="text-xs text-slate-500 block mt-1">
                                  Supported formats: PDF, DOCX (Maximum file size 8MB)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cloud URL (Option B) */}
                        <div>
                          <label className="block text-slate-800 font-bold mb-1.5">
                            Or Provide Google Drive / Cloud Link
                          </label>
                          <input
                            type="url"
                            value={cvFileUrl}
                            onChange={(e) => setCvFileUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-3 text-slate-900 outline-none font-medium text-xs sm:text-sm"
                          />
                          <span className="text-xs text-slate-500 mt-1 block">
                            Ensure link sharing is set to "Anyone with the link can view".
                          </span>
                        </div>

                        {/* Note to Instructor */}
                        <div>
                          <label className="block text-slate-800 font-bold mb-1.5">
                            Career Summary / Note for the Placement Team
                          </label>
                          <textarea
                            rows={3}
                            value={cvNote}
                            onChange={(e) => setCvNote(e.target.value)}
                            placeholder="Briefly state your graduation year, university, site experience (if any), and preferred company types (developer, contractor, consultancy)..."
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-3 text-slate-900 outline-none font-medium text-xs sm:text-sm leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingCv}
                            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-2 hover:scale-105"
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
