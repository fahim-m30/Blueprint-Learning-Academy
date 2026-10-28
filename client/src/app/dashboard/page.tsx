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
      // reload submissions
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a11] text-[#f3f7fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ffb531] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#bccadb]">Loading your Student Portal...</p>
        </div>
      </div>
    );
  }

  const activeEnrolledItem = enrolledList.find((e) => e.course._id === selectedCourseId);

  return (
    <div className="min-h-screen bg-[#060a11] text-[#f3f7fc]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b1624] border-b border-[#2e4666] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <span className="text-lg font-extrabold text-white hidden sm:inline">
                Blueprint <span className="text-[#ffb531]">Learning Academy</span>
              </span>
            </Link>
            <span className="text-xs bg-[#101c2e] border border-[#3a7bb8] text-[#7fb8ea] px-2.5 py-0.5 rounded-full font-bold">
              Student Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white">{studentInfo?.name}</span>
              <span className="block text-[11px] text-[#bccadb]">{studentInfo?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-[#2e4666] text-[#bccadb] hover:text-white hover:bg-[#101c2e] transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {enrolledList.length === 0 ? (
          <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#ffb531]/10 text-[#ffb531] flex items-center justify-center mx-auto text-2xl">
              📚
            </div>
            <h2 className="text-xl font-bold text-white">No Active Enrolled Courses</h2>
            <p className="text-xs text-[#bccadb]">
              You are not currently enrolled in any active courses, or your enrollment application is pending verification.
            </p>
            <Link
              href="/#courses"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#ffb531] text-[#1a1100] font-bold text-xs"
            >
              Explore Available Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multi-Course Switcher Tabs (if enrolled in multiple) */}
            {enrolledList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-semibold text-[#bccadb] mr-2">Enrolled Courses:</span>
                {enrolledList.map((e) => (
                  <button
                    key={e.course._id}
                    onClick={() => handleSelectCourse(e.course._id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      selectedCourseId === e.course._id
                        ? 'bg-[#ffb531] text-[#1a1100] border-[#ffb531]'
                        : 'bg-[#101c2e] text-[#bccadb] border-[#2e4666] hover:border-[#3a7bb8]'
                    }`}
                  >
                    {e.course.title}
                  </button>
                ))}
              </div>
            )}

            {/* Course Summary Banner with Countdown Timer & WhatsApp Button */}
            {courseDetails && (
              <div className="bg-gradient-to-r from-[#101c2e] via-[#0b1624] to-[#101c2e] border-2 border-[#3a7bb8] rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#08111d] text-[#7fb8ea] border border-[#2e4666] text-xs font-semibold inline-block mb-2">
                      {courseDetails.category}
                    </span>
                    <h1 className="text-2xl font-extrabold text-white">{courseDetails.title}</h1>
                    <p className="text-xs text-[#bccadb] mt-1 max-w-2xl line-clamp-2">
                      {courseDetails.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    {/* Remaining Days Countdown */}
                    <div className="bg-[#08111d] border border-[#2e4666] px-4 py-2.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-[#bccadb] block">Course Validity</span>
                      <span className="text-xl font-extrabold text-[#ffb531] flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-[#ffb531]" />
                        {activeEnrolledItem?.daysRemaining !== undefined
                          ? `${activeEnrolledItem.daysRemaining} Days Left`
                          : `${courseDetails.durationDays} Days`}
                      </span>
                    </div>

                    {/* Direct WhatsApp Group Button as requested */}
                    {courseDetails.whatsappGroupLink && (
                      <a
                        href={courseDetails.whatsappGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl bg-[#25d366] hover:bg-[#25d366]/90 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#25d366]/20 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Join WhatsApp Batch
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-[#2e4666] gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'border-[#ffb531] text-[#ffb531]'
                    : 'border-transparent text-[#bccadb] hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                Class Videos &amp; Recordings ({courseDetails?.videos?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'border-[#ffb531] text-[#ffb531]'
                    : 'border-transparent text-[#bccadb] hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Live Classes Schedule ({courseDetails?.liveClasses?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-[#ffb531] text-[#ffb531]'
                    : 'border-transparent text-[#bccadb] hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Tasks &amp; Homework ({courseDetails?.tasks?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'border-[#ffb531] text-[#ffb531]'
                    : 'border-transparent text-[#bccadb] hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Instructor
              </button>
            </div>

            {/* TAB 1: VIDEOS & RECORDINGS */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                {courseDetails?.videos && courseDetails.videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courseDetails.videos.map((vid, idx) => {
                      // Extract YouTube Embed link if normal watch link
                      let embedUrl = vid.youtubeUrl;
                      if (vid.youtubeUrl.includes('watch?v=')) {
                        embedUrl = vid.youtubeUrl.replace('watch?v=', 'embed/');
                      } else if (vid.youtubeUrl.includes('youtu.be/')) {
                        embedUrl = vid.youtubeUrl.replace('youtu.be/', 'www.youtube.com/embed/');
                      }

                      return (
                        <div
                          key={vid._id || idx}
                          className="bg-[#101c2e] border border-[#2e4666] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                        >
                          {/* Embedded YouTube Player */}
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
                            <div className="flex items-center justify-between text-[11px] text-[#7fb8ea]">
                              <span>Class Lecture #{idx + 1}</span>
                              {vid.duration && <span>{vid.duration}</span>}
                            </div>
                            <h3 className="text-sm font-bold text-white">{vid.title}</h3>
                            {vid.note && (
                              <p className="text-xs text-[#bccadb] bg-[#08111d] p-2.5 rounded-lg border border-[#2e4666]">
                                📌 <strong>Note:</strong> {vid.note}
                              </p>
                            )}
                            <div className="pt-2 flex justify-end">
                              <a
                                href={vid.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#ffb531] hover:underline flex items-center gap-1 font-semibold"
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
                  <div className="bg-[#101c2e] border border-[#2e4666] rounded-xl p-8 text-center text-xs text-[#bccadb]">
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
                      className="bg-[#101c2e] border border-[#2e4666] hover:border-[#3a7bb8] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                            Live Class #{idx + 1}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#bccadb]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#ffb531]" />
                            {new Date(item.classDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#7fb8ea]" />
                            {item.classTime}
                          </span>
                          <span>•</span>
                          <span className="text-[#50c878] font-medium">{item.platform}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-[#7fb8ea] mt-1 italic">Note: {item.note}</p>
                        )}
                      </div>

                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 rounded-xl bg-[#3a7bb8] hover:bg-[#3a7bb8]/80 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                      >
                        Join Live Class <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#101c2e] border border-[#2e4666] rounded-xl p-8 text-center text-xs text-[#bccadb]">
                    No live classes scheduled at this moment. You will receive WhatsApp group notifications when new sessions are posted.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TASKS & ASSIGNMENTS */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {taskMsg && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500 rounded-lg text-emerald-200 text-xs">
                    {taskMsg}
                  </div>
                )}

                {courseDetails?.tasks && courseDetails.tasks.length > 0 ? (
                  courseDetails.tasks.map((task) => {
                    const submission = mySubmissions.find((s) => s.taskId === task._id);

                    return (
                      <div
                        key={task._id}
                        className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-6 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2c42] pb-3">
                          <div>
                            <span className="text-[11px] font-bold text-[#ffb531] uppercase">
                              Points: {task.points}
                            </span>
                            <h3 className="text-base font-bold text-white">{task.title}</h3>
                          </div>
                          <div className="text-xs text-[#bccadb]">
                            Deadline: <span className="text-red-400 font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#bccadb] leading-relaxed bg-[#08111d] p-3.5 rounded-xl border border-[#2e4666]">
                          {task.description}
                        </p>

                        {/* Submission status or form */}
                        {submission ? (
                          <div className="bg-[#0b1624] border border-[#3a7bb8] rounded-xl p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                              <span className="text-[#bccadb]">Status: <strong className="text-white">{submission.status}</strong></span>
                            </div>
                            {submission.submissionLink && (
                              <p className="text-[#7fb8ea]">
                                <strong>Your Link:</strong>{' '}
                                <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="underline">
                                  {submission.submissionLink}
                                </a>
                              </p>
                            )}
                            {submission.submissionText && (
                              <p className="text-[#bccadb]">
                                <strong>Your Note:</strong> {submission.submissionText}
                              </p>
                            )}
                            {submission.feedback && (
                              <div className="mt-2 p-2.5 bg-[#101c2e] border border-[#ffb531] rounded-lg">
                                <strong className="text-[#ffb531] block mb-0.5">Instructor Feedback:</strong>
                                <span className="text-white">{submission.feedback}</span>
                                {submission.grade && <span className="block mt-1 font-bold text-emerald-400">Grade: {submission.grade}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {selectedTaskId === task._id ? (
                              <form onSubmit={(e) => handleTaskSubmit(e, task._id)} className="space-y-3 bg-[#08111d] p-4 rounded-xl border border-[#2e4666]">
                                <h4 className="text-xs font-bold text-white">Submit Your Assignment</h4>
                                <div>
                                  <label className="block text-[11px] text-[#bccadb] mb-1">
                                    Google Drive / PDF / File URL (গুগল ড্রাইভ বা ফাইল লিংক)
                                  </label>
                                  <input
                                    type="url"
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-xs text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-[#bccadb] mb-1">
                                    Notes / Explanation (মন্তব্য বা হিসাবের বিবরণ)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Write any note regarding your solution..."
                                    className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-xs text-white outline-none"
                                  ></textarea>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTaskId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-[#2e4666] text-xs text-[#bccadb]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingTask}
                                    className="px-4 py-1.5 rounded-lg bg-[#ffb531] text-[#1a1100] font-bold text-xs shadow-md disabled:opacity-50"
                                  >
                                    {submittingTask ? 'Submitting...' : 'Upload & Submit'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskId(task._id)}
                                className="px-5 py-2 rounded-xl bg-[#3a7bb8] hover:bg-[#3a7bb8]/80 text-white font-bold text-xs flex items-center gap-1.5 transition"
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
                  <div className="bg-[#101c2e] border border-[#2e4666] rounded-xl p-8 text-center text-xs text-[#bccadb]">
                    No assignments posted for this course yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECT CHAT WITH INSTRUCTOR / ADMIN */}
            {activeTab === 'chat' && (
              <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-xl">
                {/* Chat Header */}
                <div className="bg-[#0b1624] border-b border-[#2e4666] p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      Course Instructor &amp; Support Discussion
                    </h3>
                    <p className="text-[11px] text-[#bccadb]">Direct line with Md Abdul Mazid &amp; Course Admin</p>
                  </div>
                  <span className="text-[10px] text-[#7fb8ea] font-medium bg-[#101c2e] px-2.5 py-1 rounded-full border border-[#2e4666]">
                    Batch Active
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#08111d]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#bccadb]">
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
                          <span className="text-[10px] text-[#bccadb] mb-0.5 px-1">
                            {msg.senderName} ({msg.senderRole === 'admin' ? 'Instructor' : 'You'})
                          </span>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                              isMe
                                ? 'bg-[#ffb531] text-[#1a1100] font-medium rounded-br-none'
                                : 'bg-[#101c2e] text-white border border-[#3a7bb8] rounded-bl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-[#728296] mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-3 bg-[#0b1624] border-t border-[#2e4666] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question or message to the instructor..."
                    className="flex-1 bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#ffb531] text-[#1a1100] font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
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
