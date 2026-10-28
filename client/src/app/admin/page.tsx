'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, removeAuthToken } from '@/lib/api';
import { Course, Enrollment, SiteSettings } from '@/lib/types';
import {
  ShieldCheck,
  Users,
  BookOpen,
  PlusCircle,
  Video,
  Calendar,
  ClipboardList,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Send,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // High level data
  const [stats, setStats] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Active view
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'enrollments' | 'settings' | 'security'>('overview');

  // Admin Team & Password Verification States
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Password Reset with Email OTP States
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Selected course in hub
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseData, setSelectedCourseData] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseSubmissions, setCourseSubmissions] = useState<any[]>([]);
  const [courseChat, setCourseChat] = useState<any[]>([]);
  const [courseSubTab, setCourseSubTab] = useState<'students' | 'videos' | 'live' | 'tasks' | 'chat'>('students');

  // Form states for Course additions
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('');
  const [newVideoNote, setNewVideoNote] = useState('');

  const [newLiveTitle, setNewLiveTitle] = useState('');
  const [newLiveDate, setNewLiveDate] = useState('');
  const [newLiveTime, setNewLiveTime] = useState('08:30 PM');
  const [newLiveLink, setNewLiveLink] = useState('');
  const [newLiveNote, setNewLiveNote] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const newTaskPoints = 100;

  const [adminChatMsg, setAdminChatMsg] = useState('');

  // Course creation modal state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const createCategory = 'Civil Engineering & Real Estate';
  const [createShortDesc, setCreateShortDesc] = useState('');
  const [createFullDesc, setCreateFullDesc] = useState('');
  const [createDurationDays, setCreateDurationDays] = useState(30);
  const [createTotalClasses, setCreateTotalClasses] = useState(8);
  const [createPrice, setCreatePrice] = useState(999);
  const [createRegularPrice, setCreateRegularPrice] = useState(1999);
  const [createWhatsappLink, setCreateWhatsappLink] = useState('https://chat.whatsapp.com/sample');

  // Block modal state
  const [blockingUser, setBlockingUser] = useState<any | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // Feedback notifications
  const [alertBanner, setAlertBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    setLoading(true);
    const [overviewRes, enrollRes, settingsRes, adminsRes] = await Promise.all([
      apiRequest('/admin/overview'),
      apiRequest('/admin/enrollments'),
      apiRequest('/admin/settings'),
      apiRequest('/admin/admins'),
    ]);

    if (overviewRes.success && overviewRes.data) {
      setStats(overviewRes.data.stats);
      setCoursesList(overviewRes.data.courses || []);
    } else {
      removeAuthToken();
      router.push('/login');
      return;
    }

    if (enrollRes.success && enrollRes.data) {
      setEnrollments(enrollRes.data.enrollments || []);
    }

    if (settingsRes.success && settingsRes.data?.settings) {
      setSiteSettings(settingsRes.data.settings);
    }

    if (adminsRes.success && adminsRes.data?.admins) {
      setAdminsList(adminsRes.data.admins);
    }

    setLoading(false);
  };

  const loadCourseHub = async (courseId: string) => {
    setSelectedCourseId(courseId);
    const [cRes, chatRes] = await Promise.all([
      apiRequest(`/admin/courses/${courseId}`),
      apiRequest(`/admin/courses/${courseId}/chat`),
    ]);

    if (cRes.success && cRes.data) {
      setSelectedCourseData(cRes.data.course);
      setCourseStudents(cRes.data.students || []);
      setCourseSubmissions(cRes.data.taskSubmissions || []);
    }
    if (chatRes.success && chatRes.data) {
      setCourseChat(chatRes.data.messages || []);
    }
  };

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertBanner({ text, type });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  // 1. Enrollment Approval
  const handleApproveEnrollment = async (enrollmentId: string) => {
    const res = await apiRequest(`/admin/enrollments/${enrollmentId}/approve`, {
      method: 'POST',
    });
    if (res.success) {
      showAlert(res.message || 'Enrollment approved and email sent successfully!');
      loadAdminData();
    } else {
      showAlert(res.message || 'Error approving enrollment.', 'error');
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string) => {
    const res = await apiRequest(`/admin/enrollments/${enrollmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Invalid payment or TrxID' }),
    });
    if (res.success) {
      showAlert('Enrollment rejected.');
      loadAdminData();
    }
  };

  // 2. Block/Pause user
  const handleBlockUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingUser) return;

    const res = await apiRequest(`/admin/users/${blockingUser._id}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'blocked',
        blockReason: blockReasonInput.trim(),
      }),
    });

    if (res.success) {
      showAlert(`User has been blocked. Notification email sent to ${blockingUser.email}`);
      setBlockingUser(null);
      setBlockReasonInput('');
      if (selectedCourseId) loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Error blocking user.', 'error');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const res = await apiRequest(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'active' }),
    });
    if (res.success) {
      showAlert('User account reinstated to Active.');
      if (selectedCourseId) loadCourseHub(selectedCourseId);
    }
  };

  // 3. Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newVideoTitle || !newVideoUrl) return;

    const res = await apiRequest(`/admin/courses/${selectedCourseId}/videos`, {
      method: 'POST',
      body: JSON.stringify({
        title: newVideoTitle,
        youtubeUrl: newVideoUrl,
        duration: newVideoDuration,
        note: newVideoNote,
      }),
    });

    if (res.success) {
      showAlert('Class video added successfully.');
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoDuration('');
      setNewVideoNote('');
      loadCourseHub(selectedCourseId);
    }
  };

  // 4. Add Live Class
  const handleAddLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newLiveTitle || !newLiveDate || !newLiveLink) return;

    const res = await apiRequest(`/admin/courses/${selectedCourseId}/live-classes`, {
      method: 'POST',
      body: JSON.stringify({
        title: newLiveTitle,
        classDate: newLiveDate,
        classTime: newLiveTime,
        meetingLink: newLiveLink,
        note: newLiveNote,
      }),
    });

    if (res.success) {
      showAlert('Live class scheduled.');
      setNewLiveTitle('');
      setNewLiveDate('');
      setNewLiveLink('');
      setNewLiveNote('');
      loadCourseHub(selectedCourseId);
    }
  };

  // 5. Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newTaskTitle || !newTaskDesc || !newTaskDeadline) return;

    const res = await apiRequest(`/admin/courses/${selectedCourseId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: newTaskTitle,
        description: newTaskDesc,
        deadline: newTaskDeadline,
        points: newTaskPoints,
      }),
    });

    if (res.success) {
      showAlert('Task created successfully.');
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDeadline('');
      loadCourseHub(selectedCourseId);
    }
  };

  // 6. Admin Chat
  const handleSendAdminChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !adminChatMsg.trim()) return;

    const res = await apiRequest(`/admin/courses/${selectedCourseId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: adminChatMsg.trim() }),
    });

    if (res.success && res.data?.message) {
      setCourseChat((prev) => [...prev, res.data.message]);
      setAdminChatMsg('');
    }
  };

  // 7. Create Course
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/admin/courses', {
      method: 'POST',
      body: JSON.stringify({
        title: createTitle,
        category: createCategory,
        shortDescription: createShortDesc,
        fullDescription: createFullDesc,
        durationDays: createDurationDays,
        totalClasses: createTotalClasses,
        price: createPrice,
        regularPrice: createRegularPrice,
        whatsappGroupLink: createWhatsappLink,
      }),
    });

    if (res.success) {
      showAlert('New Course created successfully!');
      setShowCreateCourseModal(false);
      setCreateTitle('');
      setCreateShortDesc('');
      setCreateFullDesc('');
      loadAdminData();
    } else {
      showAlert(res.message || 'Error creating course.', 'error');
    }
  };

  // 8. Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to permanently delete this course and all associated enrollments and tasks?')) return;

    const res = await apiRequest(`/admin/courses/${courseId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      showAlert('Course deleted permanently.');
      setSelectedCourseId(null);
      loadAdminData();
    }
  };

  // 9. Update Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;

    const res = await apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(siteSettings),
    });

    if (res.success) {
      showAlert('Site settings and payment numbers updated successfully!');
    } else {
      showAlert('Error updating settings.', 'error');
    }
  };

  // 10. Manual Expired Cleanup Trigger
  const handleTriggerCleanup = async () => {
    const res = await apiRequest('/admin/trigger-cleanup', { method: 'POST' });
    if (res.success) {
      showAlert(`Cleanup completed: ${res.data?.result?.cleanedCount || 0} expired course(s) removed.`);
      loadAdminData();
    }
  };

  // 11. Request Email OTP for Password Reset
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) {
      showAlert('Please enter your administrator email address.', 'error');
      return;
    }

    setOtpSending(true);
    const res = await apiRequest('/auth/request-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email: otpEmail.trim() }),
    });
    setOtpSending(false);

    if (res.success) {
      setOtpSent(true);
      showAlert(res.message || 'Verification code sent to your email.');
    } else {
      showAlert(res.message || 'Error requesting verification code.', 'error');
    }
  };

  // 12. Verify OTP and Change Password
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !otpNewPassword) {
      showAlert('Please provide both the 6-digit verification code and your new password.', 'error');
      return;
    }

    setOtpVerifying(true);
    const res = await apiRequest('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: otpEmail.trim(),
        otp: otpCode.trim(),
        newPassword: otpNewPassword,
      }),
    });
    setOtpVerifying(false);

    if (res.success) {
      showAlert('Password updated successfully! Please keep your new password safe.');
      setOtpCode('');
      setOtpNewPassword('');
      setOtpSent(false);
      loadAdminData();
    } else {
      showAlert(res.message || 'Invalid or expired code.', 'error');
    }
  };

  // 13. Add New Administrator
  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPhone || !newAdminPassword) {
      showAlert('Please fill in all administrator details.', 'error');
      return;
    }

    setCreatingAdmin(true);
    const res = await apiRequest('/admin/admins', {
      method: 'POST',
      body: JSON.stringify({
        name: newAdminName,
        email: newAdminEmail,
        phone: newAdminPhone,
        password: newAdminPassword,
      }),
    });
    setCreatingAdmin(false);

    if (res.success) {
      showAlert(res.message || 'New administrator created successfully!');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminPassword('');
      loadAdminData();
    } else {
      showAlert(res.message || 'Error adding administrator.', 'error');
    }
  };

  // 14. Delete Administrator
  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove administrator "${adminName}"?`)) return;

    const res = await apiRequest(`/admin/admins/${adminId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showAlert('Administrator removed.');
      loadAdminData();
    } else {
      showAlert(res.message || 'Error removing administrator.', 'error');
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
          <div className="w-10 h-10 border-4 border-[#3a7bb8] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#bccadb]">Loading Administrator Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a11] text-[#f3f7fc]">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#0b1624] border-b border-[#2e4666] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <span className="text-lg font-extrabold text-white hidden sm:inline">
                Blueprint <span className="text-[#ffb531]">Learning Academy</span>
              </span>
            </Link>
            <span className="text-xs bg-red-950/80 border border-red-500 text-red-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerCleanup}
              className="px-3 py-1.5 rounded-lg bg-[#101c2e] hover:bg-[#1a2c42] border border-[#2e4666] text-xs text-[#bccadb] hover:text-white flex items-center gap-1.5 transition"
              title="Permanently remove expired courses from database"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#ffb531]" />
              Run Auto-Cleanup
            </button>
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

      {/* Floating Alert Banner */}
      {alertBanner && (
        <div
          className={`max-w-7xl mx-auto px-4 mt-4`}
        >
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              alertBanner.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-red-950/80 border-red-500 text-red-200'
            }`}
          >
            <span>{alertBanner.text}</span>
            <button onClick={() => setAlertBanner(null)} className="text-sm">×</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2e4666] gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveMainTab('overview');
              setSelectedCourseId(null);
            }}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeMainTab === 'overview'
                ? 'bg-[#3a7bb8] text-white shadow-md'
                : 'text-[#bccadb] hover:bg-[#101c2e]'
            }`}
          >
            📊 Analytics &amp; Courses Overview
          </button>

          <button
            onClick={() => {
              setActiveMainTab('enrollments');
              setSelectedCourseId(null);
            }}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'enrollments'
                ? 'bg-[#3a7bb8] text-white shadow-md'
                : 'text-[#bccadb] hover:bg-[#101c2e]'
            }`}
          >
            💳 Pending Enrollments
            {stats?.pendingEnrollments > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ffb531] text-[#1a1100] text-[10px] font-extrabold flex items-center justify-center">
                {stats.pendingEnrollments}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('settings')}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeMainTab === 'settings'
                ? 'bg-[#3a7bb8] text-white shadow-md'
                : 'text-[#bccadb] hover:bg-[#101c2e]'
            }`}
          >
            ⚙️ Payment &amp; Site Settings
          </button>

          <button
            onClick={() => setActiveMainTab('security')}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'security'
                ? 'bg-[#3a7bb8] text-white shadow-md'
                : 'text-[#bccadb] hover:bg-[#101c2e]'
            }`}
          >
            🔐 Security &amp; Admin Team
          </button>
        </div>

        {/* ========================================================
            TAB 1: ANALYTICS & COURSE BUTTONS HUB
        ======================================================== */}
        {activeMainTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-5 space-y-2">
                <span className="text-xs text-[#bccadb]">Total Enrolled Students</span>
                <p className="text-3xl font-extrabold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#7fb8ea]" />
                  {stats?.totalStudents || 0}
                </p>
                <span className="text-[11px] text-emerald-400">Verified learners across batches</span>
              </div>

              <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-5 space-y-2">
                <span className="text-xs text-[#bccadb]">Total Verified Revenue</span>
                <p className="text-3xl font-extrabold text-[#ffb531] flex items-center gap-2">
                  ৳{(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <span className="text-[11px] text-[#bccadb]">From confirmed bKash/Nagad payments</span>
              </div>

              <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-5 space-y-2">
                <span className="text-xs text-[#bccadb]">Pending Verification</span>
                <p className="text-3xl font-extrabold text-amber-400 flex items-center gap-2">
                  {stats?.pendingEnrollments || 0}
                </p>
                <span className="text-[11px] text-[#7fb8ea]">TrxID submissions awaiting approval</span>
              </div>

              <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-5 space-y-2">
                <span className="text-xs text-[#bccadb]">Active Courses</span>
                <p className="text-3xl font-extrabold text-[#50c878] flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#50c878]" />
                  {coursesList.length}
                </p>
                <span className="text-[11px] text-[#bccadb]">Published on academy catalog</span>
              </div>
            </div>

            {/* COURSE BUTTONS SECTION (Requirement 1: 'end jei koita course create koreche seigular button hisabe thakbe') */}
            <div className="bg-[#0b1624] border border-[#2e4666] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Course Management Buttons</h2>
                  <p className="text-xs text-[#bccadb]">
                    Click any course button below to open its dedicated hub (add videos, schedule live classes, view enrolled students &amp; login credentials, or chat).
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateCourseModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-xs flex items-center gap-2 shadow-md shrink-0 transition"
                >
                  <PlusCircle className="w-4 h-4" /> Create New Course
                </button>
              </div>

              {/* The Course Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {coursesList.map((c) => {
                  const isSelected = selectedCourseId === c._id;

                  return (
                    <button
                      key={c._id}
                      onClick={() => loadCourseHub(c._id)}
                      className={`text-left p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1a2c42] border-[#ffb531] shadow-lg shadow-[#ffb531]/10'
                          : 'bg-[#101c2e] border-[#2e4666] hover:border-[#3a7bb8] hover:bg-[#142339]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-[#ffb531] font-bold">৳{c.price.toLocaleString()}</span>
                          <span className="text-[#7fb8ea] font-medium">{c.durationDays} Days</span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{c.title}</h3>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#bccadb] pt-2 border-t border-[#1a2c42]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400" /> {c.studentCount} Students
                        </span>
                        {c.pendingCount > 0 && (
                          <span className="text-[#ffb531] font-bold">({c.pendingCount} Pending)</span>
                        )}
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-[#ffb531]' : 'text-[#7fb8ea]'}`}>
                          {isSelected ? '● Active Hub' : 'Manage Course →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DEDICATED COURSE HUB (Requirement 2 & 3: Opens when clicking a course button) */}
            {selectedCourseId && selectedCourseData && (
              <div className="bg-[#101c2e] border-2 border-[#3a7bb8] rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2e4666]">
                  <div>
                    <span className="text-xs text-[#7fb8ea] font-semibold uppercase">Currently Managing:</span>
                    <h3 className="text-xl font-extrabold text-white">{selectedCourseData.title}</h3>
                    <p className="text-xs text-[#bccadb] mt-0.5">
                      Fee: ৳{selectedCourseData.price} | Duration: {selectedCourseData.durationDays} Days | Classes: {selectedCourseData.totalClasses}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCourse(selectedCourseData._id)}
                      className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500 text-red-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Course
                    </button>
                  </div>
                </div>

                {/* Sub Tabs Inside Course Hub */}
                <div className="flex border-b border-[#2e4666] gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setCourseSubTab('students')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'students' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-[#bccadb] hover:bg-[#1a2c42]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Enrolled Students &amp; Passwords ({courseStudents.length})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('videos')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'videos' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-[#bccadb] hover:bg-[#1a2c42]'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Push Video Links ({selectedCourseData.videos?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('live')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'live' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-[#bccadb] hover:bg-[#1a2c42]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Live Class ({selectedCourseData.liveClasses?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('tasks')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'tasks' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-[#bccadb] hover:bg-[#1a2c42]'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Tasks &amp; Homework ({selectedCourseData.tasks?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('chat')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'chat' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-[#bccadb] hover:bg-[#1a2c42]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Student Discussion Chat
                  </button>
                </div>

                {/* HUB TAB 1: ENROLLED STUDENTS WITH VISIBLE PASSWORDS & BLOCK ACTION */}
                {courseSubTab === 'students' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#bccadb]">
                      <span>
                        Students registered for this course. Passwords are provided so you can assist students directly.
                      </span>
                    </div>

                    {courseStudents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#bccadb] bg-[#08111d] rounded-xl border border-[#2e4666]">
                        No students enrolled in this course yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-[#2e4666] rounded-xl overflow-hidden">
                          <thead className="bg-[#0b1624] text-[#7fb8ea] font-semibold border-b border-[#2e4666]">
                            <tr>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Mobile</th>
                              <th className="p-3">Login Email</th>
                              <th className="p-3">Generated Password</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1a2c42] bg-[#08111d]">
                            {courseStudents.map((st) => (
                              <tr key={st._id} className="hover:bg-[#101c2e]">
                                <td className="p-3 font-bold text-white">{st.name}</td>
                                <td className="p-3 font-mono text-[#bccadb]">{st.phone}</td>
                                <td className="p-3 font-mono text-[#7fb8ea]">{st.email}</td>
                                <td className="p-3 font-mono font-bold text-[#ffb531] bg-[#101c2e] px-2 py-1 rounded">
                                  {st.plainPasswordForAdmin || 'Hidden (Hashed)'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      st.status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : st.status === 'blocked'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    {st.status.toUpperCase()}
                                  </span>
                                  {st.blockReason && (
                                    <span className="block text-[10px] text-red-400 mt-0.5 max-w-xs truncate">
                                      Reason: {st.blockReason}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {st.status === 'blocked' ? (
                                    <button
                                      onClick={() => handleUnblockUser(st._id)}
                                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold transition"
                                    >
                                      Unblock
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setBlockingUser(st)}
                                      className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-500 text-red-300 rounded text-[11px] font-bold transition"
                                    >
                                      Block Student
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* HUB TAB 2: PUSH YOUTUBE VIDEOS */}
                {courseSubTab === 'videos' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddVideo} className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#ffb531]" />
                        Upload / Push New YouTube Video Lecture
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#bccadb] mb-1">Class Video Title *</label>
                          <input
                            type="text"
                            required
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder="e.g. Class 03: Rebar Detailing and BBS"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">YouTube URL / Link *</label>
                          <input
                            type="url"
                            required
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Duration (Optional)</label>
                          <input
                            type="text"
                            value={newVideoDuration}
                            onChange={(e) => setNewVideoDuration(e.target.value)}
                            placeholder="e.g. 1 hr 15 mins"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Lecture Note / Instructions</label>
                          <input
                            type="text"
                            value={newVideoNote}
                            onChange={(e) => setNewVideoNote(e.target.value)}
                            placeholder="e.g. Download BBS excel from resources tab"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold text-xs rounded-lg shadow transition"
                        >
                          Push Video to Student Dashboard
                        </button>
                      </div>
                    </form>

                    {/* Existing Videos List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#bccadb]">Published Videos ({selectedCourseData.videos?.length || 0}):</h4>
                      {selectedCourseData.videos?.map((vid) => (
                        <div
                          key={vid._id}
                          className="bg-[#08111d] border border-[#2e4666] p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{vid.title}</span>
                            <span className="text-[#7fb8ea] font-mono text-[11px] truncate max-w-sm block">
                              {vid.youtubeUrl}
                            </span>
                          </div>
                          <span className="text-[#bccadb] text-[11px]">{vid.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HUB TAB 3: SCHEDULE LIVE CLASS */}
                {courseSubTab === 'live' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddLiveClass} className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#ffb531]" />
                        Schedule Online Live Class (Google Meet / Zoom)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#bccadb] mb-1">Class Topic / Headline *</label>
                          <input
                            type="text"
                            required
                            value={newLiveTitle}
                            onChange={(e) => setNewLiveTitle(e.target.value)}
                            placeholder="e.g. Live Structural Drawing Coordination"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Google Meet / Meeting Link *</label>
                          <input
                            type="url"
                            required
                            value={newLiveLink}
                            onChange={(e) => setNewLiveLink(e.target.value)}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Date *</label>
                          <input
                            type="date"
                            required
                            value={newLiveDate}
                            onChange={(e) => setNewLiveDate(e.target.value)}
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Time Slot *</label>
                          <input
                            type="text"
                            required
                            value={newLiveTime}
                            onChange={(e) => setNewLiveTime(e.target.value)}
                            placeholder="e.g. 08:30 PM (BST)"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#3a7bb8] hover:bg-[#3a7bb8]/80 text-white font-bold text-xs rounded-lg shadow transition"
                        >
                          Publish Live Class Schedule
                        </button>
                      </div>
                    </form>

                    {/* Existing Live Classes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#bccadb]">Scheduled Sessions:</h4>
                      {selectedCourseData.liveClasses?.map((item) => (
                        <div
                          key={item._id}
                          className="bg-[#08111d] border border-[#2e4666] p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{item.title}</span>
                            <span className="text-[#bccadb] block text-[11px]">
                              {new Date(item.classDate).toLocaleDateString()} at {item.classTime}
                            </span>
                          </div>
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#7fb8ea] underline flex items-center gap-1"
                          >
                            Meet Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HUB TAB 4: TASKS & SUBMISSIONS */}
                {courseSubTab === 'tasks' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddTask} className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-[#ffb531]" />
                        Assign New Task / Homework
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#bccadb] mb-1">Task Title *</label>
                          <input
                            type="text"
                            required
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Prepare Rebar BBS for Footing"
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#bccadb] mb-1">Submission Deadline *</label>
                          <input
                            type="date"
                            required
                            value={newTaskDeadline}
                            onChange={(e) => setNewTaskDeadline(e.target.value)}
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[#bccadb] mb-1">Instructions &amp; Requirements *</label>
                          <textarea
                            rows={2}
                            required
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            placeholder="Describe what the student needs to submit..."
                            className="w-full bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                          ></textarea>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#ffb531] text-[#1a1100] font-bold text-xs rounded-lg shadow transition"
                        >
                          Post Task to Batch
                        </button>
                      </div>
                    </form>

                    {/* Student Submissions List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-white">Student Homework Submissions ({courseSubmissions.length}):</h4>
                      {courseSubmissions.length === 0 ? (
                        <p className="text-xs text-[#bccadb] italic">No submissions yet for this course.</p>
                      ) : (
                        courseSubmissions.map((sub) => (
                          <div
                            key={sub._id}
                            className="bg-[#08111d] border border-[#2e4666] p-4 rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {sub.studentName} ({sub.studentEmail})
                              </span>
                              <span className="text-[#bccadb]">
                                Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[#ffb531] font-semibold">Task: {sub.taskTitle}</p>
                            {sub.submissionLink && (
                              <p className="text-[#7fb8ea]">
                                Link:{' '}
                                <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer" className="underline">
                                  {sub.submissionLink}
                                </a>
                              </p>
                            )}
                            {sub.submissionText && <p className="text-[#bccadb]">{sub.submissionText}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* HUB TAB 5: ADMIN CHAT WITH STUDENTS */}
                {courseSubTab === 'chat' && (
                  <div className="bg-[#08111d] border border-[#2e4666] rounded-xl overflow-hidden flex flex-col h-[450px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {courseChat.length === 0 ? (
                        <p className="text-center py-8 text-xs text-[#bccadb]">No discussion in this course room yet.</p>
                      ) : (
                        courseChat.map((msg, idx) => {
                          const isAdmin = msg.senderRole === 'admin';

                          return (
                            <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-[#bccadb] mb-0.5 px-1">
                                {msg.senderName} ({msg.senderRole})
                              </span>
                              <div
                                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs ${
                                  isAdmin
                                    ? 'bg-[#3a7bb8] text-white rounded-br-none'
                                    : 'bg-[#101c2e] text-white border border-[#2e4666] rounded-bl-none'
                                }`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendAdminChat} className="p-3 bg-[#0b1624] border-t border-[#2e4666] flex gap-2">
                      <input
                        type="text"
                        value={adminChatMsg}
                        onChange={(e) => setAdminChatMsg(e.target.value)}
                        placeholder="Reply to students in this course..."
                        className="flex-1 bg-[#101c2e] border border-[#2e4666] rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#ffb531] text-[#1a1100] font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                      >
                        <Send className="w-3.5 h-3.5" /> Reply
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: PENDING ENROLLMENTS VERIFICATION
        ======================================================== */}
        {activeMainTab === 'enrollments' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Pending &amp; Processed Enrollments</h2>
              <p className="text-xs text-[#bccadb]">
                Verify the Transaction ID against your bKash/Nagad statement. Clicking &quot;Approve&quot; automatically creates the student credentials and emails them to the student.
              </p>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-[#101c2e] border border-[#2e4666] rounded-xl p-8 text-center text-xs text-[#bccadb]">
                No enrollment submissions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#2e4666] rounded-xl overflow-hidden">
                  <thead className="bg-[#0b1624] text-[#7fb8ea] font-semibold border-b border-[#2e4666]">
                    <tr>
                      <th className="p-3">Applicant Name</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Course</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Sender Mobile</th>
                      <th className="p-3">Transaction ID (TrxID)</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2c42] bg-[#08111d]">
                    {enrollments.map((en) => (
                      <tr key={en._id} className="hover:bg-[#101c2e]">
                        <td className="p-3 font-bold text-white">
                          {en.studentName}
                          <span className="block text-[10px] text-[#bccadb]">{en.studentAddress}</span>
                        </td>
                        <td className="p-3">
                          <span className="block font-mono text-[#bccadb]">{en.studentPhone}</span>
                          <span className="block text-[#7fb8ea]">{en.studentEmail}</span>
                        </td>
                        <td className="p-3 font-semibold text-white max-w-xs">{en.courseTitle}</td>
                        <td className="p-3 font-medium text-[#bccadb]">{en.paymentMethod}</td>
                        <td className="p-3 font-mono text-white">{en.senderNumber}</td>
                        <td className="p-3 font-mono font-bold text-[#ffb531] bg-[#101c2e] px-2 py-1 rounded">
                          {en.transactionId}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">৳{en.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              en.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : en.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {en.status.toUpperCase()}
                          </span>
                          {en.generatedPassword && (
                            <span className="block text-[10px] text-[#bccadb] font-mono mt-0.5">
                              Pass: {en.generatedPassword}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {en.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveEnrollment(en._id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                              >
                                Approve &amp; Send Email
                              </button>
                              <button
                                onClick={() => handleRejectEnrollment(en._id)}
                                className="px-2.5 py-1.5 rounded-lg border border-red-500 text-red-300 hover:bg-red-950 text-xs transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: SITE SETTINGS & PAYMENT NUMBERS
        ======================================================== */}
        {activeMainTab === 'settings' && siteSettings && (
          <form onSubmit={handleSaveSettings} className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2e4666] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Website Information &amp; Payment Gateway Settings</h2>
                <p className="text-xs text-[#bccadb]">
                  Any changes made here will immediately update on the homepage, payment screen, student portal, and footers.
                </p>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-xs flex items-center gap-2 shadow-lg transition shrink-0"
              >
                <Save className="w-4 h-4" /> Save All Settings
              </button>
            </div>

            {/* SECTION 1: CONTACT, PHONE, WHATSAPP, EMAIL */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#ffb531] flex items-center gap-2 border-b border-[#1a2c42] pb-2">
                📞 Official Contact &amp; Support Helpline (Homepage &amp; Footer)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">
                    Contact Helpline Phone * (ফোন নম্বর)
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.contactPhone}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                  <span className="text-[10px] text-[#7fb8ea]">Appears in header, footer &amp; direct calling</span>
                </div>

                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">
                    WhatsApp Number (with country code e.g. 880) *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.whatsappNumber}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                    placeholder="88013XXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                  <span className="text-[10px] text-emerald-400">Used for direct WhatsApp chat button links</span>
                </div>

                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">
                    Official Support Email * (ইমেইল ঠিকানা)
                  </label>
                  <input
                    type="email"
                    required
                    value={siteSettings.contactEmail}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                    placeholder="info@blueprintlearningacademy.com"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                  <span className="text-[10px] text-[#7fb8ea]">Displayed in contact links &amp; email notifications</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: BKASH & NAGAD PAYMENT GATEWAY */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#7fb8ea] flex items-center gap-2 border-b border-[#1a2c42] pb-2">
                💳 bKash, Nagad &amp; Rocket Payment Numbers (Student Enrollment)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">bKash Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.bkashNumber}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.bkashType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-1.5 bg-[#08111d] border border-[#1a2c42] rounded-lg px-2 py-1 text-[11px] text-[#bccadb]"
                  />
                </div>

                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">Nagad Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.nagadNumber}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.nagadType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-1.5 bg-[#08111d] border border-[#1a2c42] rounded-lg px-2 py-1 text-[11px] text-[#bccadb]"
                  />
                </div>

                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">Rocket Number</label>
                  <input
                    type="text"
                    value={siteSettings.rocketNumber}
                    onChange={(e) => setSiteSettings({ ...siteSettings, rocketNumber: e.target.value })}
                    placeholder="013XXXXXXXX-X"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: WEBSITE BRANDING & HEADLINES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1a2c42] pb-2">
                🌐 Academy Branding &amp; Content Customization
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">Academy / Website Name</label>
                  <input
                    type="text"
                    value={siteSettings.siteName || 'Blueprint Learning Academy'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#bccadb] mb-1 font-semibold">Hero Bengali Tagline</label>
                  <input
                    type="text"
                    value={siteSettings.heroBengaliNote || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBengaliNote: e.target.value })}
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#bccadb] mb-1 font-semibold">Hero Main Headline Title</label>
                  <input
                    type="text"
                    value={siteSettings.heroTitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#bccadb] mb-1 font-semibold">Hero Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={siteSettings.heroSubtitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#2e4666]">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-xs flex items-center gap-2 shadow-xl transition"
              >
                <Save className="w-4 h-4" /> Save All Changes
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            TAB 4: SECURITY & ADMIN TEAM MANAGEMENT
        ======================================================== */}
        {activeMainTab === 'security' && (
          <div className="space-y-8">
            {/* PART 1: PASSWORD CHANGE VIA EMAIL VERIFICATION */}
            <div className="bg-[#101c2e] border-2 border-[#3a7bb8] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs text-[#ffb531] font-bold uppercase tracking-wider block">
                  Security Authentication
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Change Administrator Password via Email Verification (OTP)
                </h2>
                <p className="text-xs text-[#bccadb]">
                  To change your password, request a secure 6-digit one-time verification code to your registered email address.
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="max-w-lg space-y-3 text-xs bg-[#08111d] p-5 rounded-xl border border-[#2e4666]">
                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">
                      Your Registered Administrator Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="admin@careerpath.com"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-white outline-none"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={otpSending}
                      className="px-5 py-2.5 bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50"
                    >
                      {otpSending ? 'Sending Code...' : 'Send 6-Digit Verification Code (OTP)'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="max-w-lg space-y-4 text-xs bg-[#08111d] p-5 rounded-xl border border-[#ffb531]">
                  <div className="p-3 bg-[#101c2e] border border-emerald-500 rounded-lg text-emerald-300">
                    ✅ A 6-digit verification code has been dispatched to <strong>{otpEmail}</strong> (valid for 10 minutes).
                  </div>

                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">
                      Enter 6-Digit Verification Code (OTP) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 482915"
                      className="w-full bg-[#101c2e] border border-[#ffb531] rounded-lg px-3 py-2.5 text-lg font-mono tracking-widest text-[#ffb531] text-center font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">
                      Enter New Secure Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-white outline-none"
                    />
                    <span className="text-[11px] text-[#7fb8ea]">Minimum 6 characters long</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={otpVerifying}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50"
                    >
                      {otpVerifying ? 'Verifying & Updating...' : 'Verify Code & Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-[#bccadb] hover:underline"
                    >
                      Resend Code / Change Email
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* PART 2: MANAGE ADMINISTRATOR TEAM (ADD NEW ADMIN) */}
            <div className="bg-[#101c2e] border border-[#2e4666] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs text-[#7fb8ea] font-bold uppercase tracking-wider block">
                  Team Access Control
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Administrator Team ({adminsList.length})
                </h2>
                <p className="text-xs text-[#bccadb]">
                  Authorized administrators with full portal permissions (managing courses, approving enrollments, and viewing credentials).
                </p>
              </div>

              {/* Add New Admin Form */}
              <form onSubmit={handleAddNewAdmin} className="bg-[#08111d] border border-[#2e4666] p-5 rounded-xl space-y-3 text-xs">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#ffb531]" />
                  Add New Administrator (নতুন অ্যাডমিন যুক্ত করুন)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Engr. Shafiqul Islam"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">Login Email *</label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin2@careerpath.com"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#bccadb] mb-1 font-semibold">Admin Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#101c2e] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-5 py-2.5 bg-[#3a7bb8] hover:bg-[#3a7bb8]/80 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {creatingAdmin ? 'Adding Admin...' : 'Register New Administrator'}
                  </button>
                </div>
              </form>

              {/* List of Admins */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#2e4666] rounded-xl overflow-hidden">
                  <thead className="bg-[#0b1624] text-[#7fb8ea] font-semibold border-b border-[#2e4666]">
                    <tr>
                      <th className="p-3">Administrator Name</th>
                      <th className="p-3">Login Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2c42] bg-[#08111d]">
                    {adminsList.map((adm) => (
                      <tr key={adm._id} className="hover:bg-[#101c2e]">
                        <td className="p-3 font-bold text-white">{adm.name}</td>
                        <td className="p-3 font-mono text-[#7fb8ea]">{adm.email}</td>
                        <td className="p-3 font-mono text-[#bccadb]">{adm.phone}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {adm.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-[#bccadb]">
                          {new Date(adm.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteAdmin(adm._id, adm.name)}
                            className="px-2.5 py-1 text-[11px] bg-red-950/70 hover:bg-red-900 border border-red-500 text-red-300 rounded transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE COURSE MODAL */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101c2e] border-2 border-[#2e4666] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Engineering Course</h3>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#bccadb] mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Real Estate Project Planning and Scheduling"
                  className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#bccadb] mb-1">Offer Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                    className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bccadb] mb-1">Regular Price (৳)</label>
                  <input
                    type="number"
                    value={createRegularPrice}
                    onChange={(e) => setCreateRegularPrice(Number(e.target.value))}
                    className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bccadb] mb-1">Course Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    value={createDurationDays}
                    onChange={(e) => setCreateDurationDays(Number(e.target.value))}
                    className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bccadb] mb-1">Total Classes Count *</label>
                  <input
                    type="number"
                    required
                    value={createTotalClasses}
                    onChange={(e) => setCreateTotalClasses(Number(e.target.value))}
                    className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#bccadb] mb-1">WhatsApp Batch Group Invite Link *</label>
                <input
                  type="url"
                  required
                  value={createWhatsappLink}
                  onChange={(e) => setCreateWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[#bccadb] mb-1">Short Description *</label>
                <input
                  type="text"
                  required
                  value={createShortDesc}
                  onChange={(e) => setCreateShortDesc(e.target.value)}
                  placeholder="Brief 1-2 sentence overview for cards"
                  className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[#bccadb] mb-1">Full Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={createFullDesc}
                  onChange={(e) => setCreateFullDesc(e.target.value)}
                  placeholder="Comprehensive description of the course..."
                  className="w-full bg-[#08111d] border border-[#2e4666] rounded-lg px-3 py-2 text-white outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2e4666] text-[#bccadb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#ffb531] text-[#1a1100] font-bold shadow"
                >
                  Create &amp; Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCK USER MODAL (Requirement: Admin enters reason and email is dispatched) */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101c2e] border-2 border-red-500 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Suspend / Block Student Access
            </div>
            <p className="text-xs text-[#bccadb]">
              You are about to block <strong>{blockingUser.name}</strong> ({blockingUser.email}).
              Please enter the official reason. This reason will be <strong>emailed to the student</strong> immediately.
            </p>

            <form onSubmit={handleBlockUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-red-300 mb-1 font-semibold">
                  Reason for Suspension (কারণ) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="e.g. Disciplinary breach in class, payment reversal, or code of conduct violation..."
                  className="w-full bg-[#08111d] border border-red-500/50 rounded-lg p-2.5 text-white outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockingUser(null)}
                  className="px-4 py-2 rounded-lg border border-[#2e4666] text-[#bccadb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow"
                >
                  Confirm &amp; Send Block Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
