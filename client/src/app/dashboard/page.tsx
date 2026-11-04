'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Bell,
  Pin,
  TrendingUp,
  BarChart3,
  Sparkles,
  Award,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [enrolledList, setEnrolledList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);

  // Active tab in course
  const [activeTab, setActiveTab] = useState<'videos' | 'live' | 'tasks' | 'chat' | 'cv' | 'notices'>('videos');

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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-poll for live chat messages in real-time
  // Live Ultra-Fast Real-Time Auto-Polling for Student Dashboard & Course Hub (every 1.0s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(async () => {
      try {
        // 1. Sync student profile, enrollment approvals, and CV review feedback
        const res = await apiRequest('/student/dashboard');
        if (res.success && res.data) {
          if (res.data.student) setStudentInfo(res.data.student);
          if (res.data.enrolledCourses) setEnrolledList(res.data.enrolledCourses);
          if (res.data.student?.cv) setStudentCv(res.data.student.cv);
        }

        // 2. If a course is selected, sync live classes, notices, task grades/submissions, and chat
        if (selectedCourseId) {
          const [cRes, chatRes] = await Promise.all([
            apiRequest(`/student/course/${selectedCourseId}`),
            apiRequest(`/student/course/${selectedCourseId}/chat`),
          ]);
          if (cRes.success && cRes.data?.course) {
            setCourseDetails(cRes.data.course);
            if (cRes.data.mySubmissions) setMySubmissions(cRes.data.mySubmissions);
            if (cRes.data.completedVideos) setCompletedVideos(cRes.data.completedVideos);
          }
          const msgs = (chatRes.data as any)?.messages || (chatRes as any)?.messages;
          if (chatRes.success && msgs) {
            setChatMessages(msgs);
          }
        }
      } catch {}
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCourseId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

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
      setCompletedVideos(cRes.data.completedVideos || []);
    }
    if (chatRes.success && chatRes.data?.messages) {
      setChatMessages(chatRes.data.messages);
    }
    return loadedCourse;
  };

  const handleToggleCompleteVideo = async (videoId: string) => {
    const isCurrently = completedVideos.includes(videoId);
    const updated = isCurrently
      ? completedVideos.filter((id) => id !== videoId)
      : [...completedVideos, videoId];
    setCompletedVideos(updated);

    try {
      const res = await apiRequest(`/student/course/${selectedCourseId}/videos/${videoId}/toggle-complete`, {
        method: 'POST',
      });
      if (res.success && res.data?.completedVideos) {
        setCompletedVideos(res.data.completedVideos);
        if (res.data.overallProgress !== undefined) {
          setEnrolledList((prev) =>
            prev.map((item) =>
              item.course._id === selectedCourseId
                ? { ...item, progress: res.data.overallProgress, completedVideos: res.data.completedVideos }
                : item
            )
          );
        }
      }
    } catch (err) {
      console.warn('Error toggling video completion:', err);
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
    let formattedUrl = cvFileUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!cvFileData && !formattedUrl) {
      setCvMsg({ text: 'Please upload a PDF/document or provide a Portfolio / Google Drive URL.', isError: true });
      return;
    }

    setSubmittingCv(true);
    setCvMsg(null);

    const res = await apiRequest('/student/cv', {
      method: 'POST',
      body: JSON.stringify({
        fileUrl: formattedUrl,
        fileName: cvFileName.trim() || 'Resume.pdf',
        fileData: cvFileData,
        targetJobTitle: cvTargetJobTitle.trim() || 'Site Engineer / Career Candidate',
        note: cvNote.trim(),
      }),
    });

    setSubmittingCv(false);

    if (res.success && res.data?.cv) {
      setStudentCv(res.data.cv);
      setCvMsg({ text: 'CV / Portfolio successfully submitted! Admin & instructor will review it and provide real-time feedback.', isError: false });
    } else {
      const errMsg = res.message?.includes('not found')
        ? 'Backend service is deploying the latest update. Please retry in 30-60 seconds.'
        : (res.message || 'Error submitting CV. Please try again.');
      setCvMsg({ text: errMsg, isError: true });
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.replace('/login');
  };

  const activeEnrolledItem = enrolledList.find((e) => e.course?._id === selectedCourseId);

  // Auto-calculated course & task progress metrics
  const totalVideos = courseDetails?.videos?.length || 0;
  const completedVideosCount = courseDetails?.videos?.filter((v) => completedVideos.includes(v._id)).length || 0;
  const videoProgress = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;

  const totalTasks = courseDetails?.tasks?.length || 0;
  const submittedTasks = courseDetails?.tasks?.filter((t) => mySubmissions.some((s) => s.taskId === t._id)).length || 0;
  const reviewedTasks = mySubmissions.filter((s) => s.status === 'reviewed').length;
  const pendingTasks = Math.max(0, totalTasks - submittedTasks);
  const taskProgress = totalTasks > 0 ? Math.round((submittedTasks / totalTasks) * 100) : 0;

  let overallProgress = 0;
  if (totalVideos + totalTasks > 0) {
    overallProgress = Math.min(100, Math.round(((completedVideosCount + submittedTasks) / (totalVideos + totalTasks)) * 100));
  } else if (activeEnrolledItem?.progress) {
    overallProgress = activeEnrolledItem.progress;
  }

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
                src="/logo.png?v=6"
                alt="Blueprint Learning Academy"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-full shadow-xs group-hover:scale-105 transition"
              />
              <span className="text-lg sm:text-xl font-black text-slate-950 hidden md:inline truncate tracking-tight">
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
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {studentInfo?.studentId && (
                  <span className="inline-block px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-mono font-extrabold text-[11px] rounded-md shadow-xs">
                    ID: {studentInfo.studentId}
                  </span>
                )}
                <span className="block text-xs font-semibold text-slate-500 truncate max-w-[160px]">{studentInfo?.email}</span>
              </div>
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
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border flex items-center gap-2 ${
                      selectedCourseId === e.course._id
                        ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{e.course.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      selectedCourseId === e.course._id
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {e.progress || 0}%
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Course Summary Banner with Progress Bar & Countdown Timer */}
            {courseDetails && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-block">
                        {courseDetails.category}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black inline-flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        {overallProgress}% Course Completed
                      </span>
                    </div>
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

                {/* Overall Course Progress Bar & Metrics */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-black text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      কোর্স সমাপ্তি প্রগ্রেস (Course Overall Progress)
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                      <span>📹 ভিডিও দেখা: <strong className="text-slate-950 font-black">{completedVideosCount}/{totalVideos}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>📝 টাস্ক জমা: <strong className="text-slate-950 font-black">{submittedTasks}/{totalTasks}</strong></span>
                      <span className="text-blue-700 font-black bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {overallProgress}% সম্পন্ন
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.max(overallProgress, 2)}%` }}
                    />
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
                <span>Videos ({completedVideosCount}/{totalVideos})</span>
                {totalVideos > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    videoProgress === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {videoProgress}%
                  </span>
                )}
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
                <span>Tasks ({submittedTasks}/{totalTasks})</span>
                {totalTasks > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    taskProgress === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {taskProgress}%
                  </span>
                )}
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
                {/* Videos Progress Bar */}
                {totalVideos > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-600" />
                        ক্লাস ভিডিও ও রেকর্ডিং ({completedVideosCount}/{totalVideos} সম্পন্ন)
                      </h3>
                      <p className="text-xs text-slate-500">
                        লেকচার ভিডিও দেখা শেষ হলে নিচের "Mark Watched" বাটনে ক্লিক করুন।
                      </p>
                    </div>
                    <div className="w-full sm:w-56 space-y-1.5 shrink-0">
                      <div className="flex justify-between text-xs font-extrabold text-slate-700">
                        <span>ভিডিও দেখা অগ্রগতি</span>
                        <span className="text-blue-700 font-black">{videoProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(videoProgress, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCompleteVideo(vid._id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                                  completedVideos.includes(vid._id)
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {completedVideos.includes(vid._id) ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Watched ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-slate-400" />
                                    <span>Mark as Watched</span>
                                  </>
                                )}
                              </button>

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
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                    {taskMsg}
                  </div>
                )}

                {/* Auto Task Submission Progress & Analytics Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black tracking-wide mb-2">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                        টাস্ক জমা দেওয়ার প্রগ্রেস সিস্টেম
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        Student Assignment &amp; Task Progress
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        আপনার নির্ধারিত সব অ্যাসাইনমেন্ট সময়মতো জমা দিয়ে কোর্স সার্টিফিকেট আনলক করুন।
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">টাস্ক কমপ্লিশন রেট</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {taskProgress}%
                      </span>
                    </div>
                  </div>

                  {/* 4 Metric Counter Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                      <span className="text-xs text-slate-400 block font-bold">মোট টাস্ক</span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{totalTasks}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-600/40">
                      <span className="text-xs text-emerald-300 block font-bold">জমা দেওয়া হয়েছে</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        {submittedTasks}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-600/40">
                      <span className="text-xs text-amber-300 block font-bold">বাকি টাস্ক</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-amber-400" />
                        {pendingTasks}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-600/40">
                      <span className="text-xs text-blue-300 block font-bold">মূল্যায়িত (Reviewed)</span>
                      <span className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5 block flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-blue-400" />
                        {reviewedTasks}
                      </span>
                    </div>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>টাস্ক সাবমিশন অগ্রগতি</span>
                      <span className="text-amber-400 font-extrabold">{submittedTasks} of {totalTasks} Tasks Submitted ({taskProgress}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(taskProgress, 2)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Motivational Status Message */}
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs sm:text-sm text-slate-300 flex items-center gap-2.5">
                    {taskProgress === 100 ? (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                        <span className="text-emerald-300 font-bold">
                          🎉 অভিনন্দন! আপনি এই কোর্সের সবগুলো অ্যাসাইনমেন্ট সফলভাবে জমা দিয়েছেন।
                        </span>
                      </>
                    ) : taskProgress > 0 ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-blue-400 shrink-0" />
                        <span>
                          ভালো কাজ করছেন! বাকি <strong className="text-amber-400">{pendingTasks}টি</strong> অ্যাসাইনমেন্ট দ্রুত জমা দিয়ে আপনার কোর্স শেষ করুন।
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>
                          এখনও কোনো টাস্ক জমা দেওয়া হয়নি। নিচে প্রতিটি টাস্কের বিস্তারিত বিবরণ দেখে আপনার সমাধান বা Google Drive লিংক জমা দিন।
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {courseDetails?.tasks && courseDetails.tasks.length > 0 ? (
                  courseDetails.tasks.map((task) => {
                    const submission = mySubmissions.find((s) => s.taskId === task._id);

                    return (
                      <div
                        key={task._id}
                        className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg uppercase tracking-wider">
                              Points: {task.points}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-950">{task.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium">
                            <span className="text-slate-500">
                              Deadline: <span className="text-red-600 font-black">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </span>
                            {submission ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Submitted
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-black flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Pending
                              </span>
                            )}
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
                <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Course Instructor &amp; Support Discussion
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Active Room: <strong className="text-blue-800">{courseDetails?.title || 'Course Room'}</strong>
                      </p>
                    </div>
                    <span className="text-xs text-blue-700 font-extrabold bg-blue-50 px-3 py-1 rounded-full border border-blue-200 w-fit">
                      🟢 Live Chat (3.5s Sync)
                    </span>
                  </div>

                  {/* Course switcher if student has multiple enrolled courses */}
                  {enrolledList.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 shrink-0">Switch Course Room:</span>
                      {enrolledList.map((item: any) => {
                        const c = item.course;
                        if (!c) return null;
                        const isCurrent = c._id === selectedCourseId;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(c._id);
                              loadCourseData(c._id);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 text-xs shadow-xs ${
                              isCurrent
                                ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span>{c.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
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
                  <div ref={chatBottomRef} />
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

                          {/* Direct View / Download Buttons */}
                          <div className="pt-2 space-y-2">
                            {studentCv.fileData && (
                              <a
                                href={studentCv.fileData}
                                download={studentCv.fileName || 'My_CV.pdf'}
                                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                              >
                                <Download className="w-4 h-4" /> Download / View CV ({studentCv.fileName || 'File'})
                              </a>
                            )}
                            {studentCv.fileUrl && (
                              <a
                                href={studentCv.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                              >
                                <ExternalLink className="w-4 h-4" /> Open Portfolio / Cloud Link
                              </a>
                            )}
                          </div>

                          {/* Instructor Feedback If Any */}
                          {studentCv.adminFeedback ? (
                            <div className="mt-4 p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2 text-xs sm:text-sm shadow-xs animate-in fade-in duration-300">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-amber-950 flex items-center gap-1.5 uppercase text-xs tracking-wider">
                                  💬 Instructor Review &amp; Corrections
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 font-bold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-Time
                                </span>
                              </div>
                              <p className="text-slate-900 leading-relaxed font-semibold bg-white/80 p-3 rounded-xl border border-amber-200 whitespace-pre-wrap">
                                {studentCv.adminFeedback}
                              </p>
                              <span className="text-[11px] text-amber-800 font-medium block">
                                Tip: Make the requested changes and submit your updated CV or portfolio link below.
                              </span>
                            </div>
                          ) : (
                            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>Instructor review pending. Real-time feedback will appear here as soon as reviewed.</span>
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
                            Target Job Role / Career Track (Optional)
                          </label>
                          <input
                            type="text"
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
                            Or Provide Portfolio Website / Google Drive Link (Optional)
                          </label>
                          <input
                            type="text"
                            value={cvFileUrl}
                            onChange={(e) => setCvFileUrl(e.target.value)}
                            placeholder="https://yourportfolio.com or https://drive.google.com/..."
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl px-4 py-3 text-slate-900 outline-none font-medium text-xs sm:text-sm"
                          />
                          <span className="text-xs text-slate-500 mt-1 block">
                            Ensure link sharing is public or set to "Anyone with the link can view".
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
