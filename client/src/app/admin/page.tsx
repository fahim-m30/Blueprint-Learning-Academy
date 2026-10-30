'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, removeAuthToken } from '@/lib/api';
import { Course, Enrollment, SiteSettings } from '@/lib/types';
import {
  ShieldCheck,
  ArrowLeft,
  UserPlus,
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
  Globe,
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

  // Manual student enrollment inside course hub
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentName, setAddStudentName] = useState('');
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addStudentPhone, setAddStudentPhone] = useState('');
  const [addStudentPassword, setAddStudentPassword] = useState('');
  const [addStudentAddress, setAddStudentAddress] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

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

  // Trap back navigation so admin stays firmly in the admin portal
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

  // Manual Add Student to Course Handler
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !addStudentName.trim() || !addStudentEmail.trim() || !addStudentPhone.trim()) {
      showAlert('Please enter student name, email, and phone number.', 'error');
      return;
    }

    setAddingStudent(true);
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/students`, {
      method: 'POST',
      body: JSON.stringify({
        name: addStudentName.trim(),
        email: addStudentEmail.trim(),
        phone: addStudentPhone.trim(),
        password: addStudentPassword.trim(),
        address: addStudentAddress.trim(),
      }),
    });
    setAddingStudent(false);

    if (res.success) {
      showAlert(res.message || 'Student added successfully!', 'success');
      setShowAddStudentModal(false);
      setAddStudentName('');
      setAddStudentEmail('');
      setAddStudentPhone('');
      setAddStudentAddress('');
      setAddStudentPassword('');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Failed to add student.', 'error');
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

  // 9. Upload & Convert Instructor Photo to Base64 Data URL
  const handleInstructorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !siteSettings) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image file size must be less than 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSiteSettings({
          ...siteSettings,
          instructorImage: event.target.result as string,
        });
        showAlert('Instructor photo loaded! Remember to click "Save All Changes" to publish.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // 10. Update Site Settings
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
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/40 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600">Loading Administrator Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Blueprint Learning Academy"
                className="w-12 h-12 object-contain rounded-full ring-2 ring-[#ffb531] bg-white p-0.5 shadow-md"
              />
              <span className="text-xl font-black text-slate-900 hidden sm:inline">
                Blueprint <span className="text-[#ffb531]">Learning Academy</span>
              </span>
            </Link>
            <span className="text-xs bg-red-50 border border-red-200 text-red-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerCleanup}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
              title="Permanently remove expired courses from database"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#ffb531]" />
              <span className="hidden sm:inline">Run Auto-Cleanup</span><span className="sm:hidden">Cleanup</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white transition"
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
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-700'
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
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveMainTab('overview');
              setSelectedCourseId(null);
            }}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeMainTab === 'overview'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-white'
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
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-white'
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
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            ⚙️ Payment &amp; Site Settings
          </button>

          <button
            onClick={() => setActiveMainTab('security')}
            className={`py-2.5 px-4 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'security'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            🔐 Security &amp; Admin Team
          </button>
        </div>

        {/* ========================================================
            TAB 1: ANALYTICS & COURSE BUTTONS HUB
        ======================================================== */}
        {activeMainTab === 'overview' && (
          selectedCourseId && selectedCourseData ? (
            /* DEDICATED COURSE HUB (ENTERED INSIDE COURSE) */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Navigation & Back Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(null);
                    setSelectedCourseData(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 hover:text-slate-900 text-xs font-bold transition shadow-sm self-start group"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition" />
                  <span>← Back to All Courses (সকল কোর্স তালিকা)</span>
                </button>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    Course Workspace Mode: {selectedCourseData.title}
                  </span>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs text-blue-700 font-semibold uppercase">Currently Managing:</span>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedCourseData.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Fee: ৳{selectedCourseData.price} | Duration: {selectedCourseData.durationDays} Days | Classes: {selectedCourseData.totalClasses}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAddStudentName('');
                        setAddStudentEmail('');
                        setAddStudentPhone('');
                        setAddStudentAddress('');
                        setAddStudentPassword('BLP-' + Math.random().toString(36).substring(2, 8).toUpperCase());
                        setShowAddStudentModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition hover:scale-105"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> + Add Student (নতুন স্টুডেন্ট যুক্ত করুন)
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(selectedCourseData._id)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Course
                    </button>
                  </div>
                </div>

                {/* Sub Tabs Inside Course Hub */}
                <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setCourseSubTab('students')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'students' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Enrolled Students &amp; Passwords ({courseStudents.length})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('videos')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'videos' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Push Video Links ({selectedCourseData.videos?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('live')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'live' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Live Class ({selectedCourseData.liveClasses?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('tasks')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'tasks' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Tasks &amp; Homework ({selectedCourseData.tasks?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('chat')}
                    className={`py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      courseSubTab === 'chat' ? 'bg-[#ffb531] text-[#1a1100]' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Student Discussion Chat
                  </button>
                </div>

                {/* HUB TAB 1: ENROLLED STUDENTS WITH VISIBLE PASSWORDS & BLOCK ACTION */}
                {courseSubTab === 'students' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-700" /> Enrolled Students ({courseStudents.length})
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Students registered for this course. Passwords are provided so you can assist students directly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddStudentName('');
                          setAddStudentEmail('');
                          setAddStudentPhone('');
                          setAddStudentAddress('');
                          setAddStudentPassword('BLP-' + Math.random().toString(36).substring(2, 8).toUpperCase());
                          setShowAddStudentModal(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 shrink-0 transition"
                      >
                        <UserPlus className="w-4 h-4" /> Add New Student (নতুন স্টুডেন্ট যোগ করুন)
                      </button>
                    </div>

                    {courseStudents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                        No students enrolled in this course yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden min-w-[640px]">
                          <thead className="bg-white text-blue-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Mobile</th>
                              <th className="p-3">Login Email</th>
                              <th className="p-3">Generated Password</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-slate-50">
                            {courseStudents.map((st) => (
                              <tr key={st._id} className="hover:bg-white">
                                <td className="p-3 font-bold text-slate-900">{st.name}</td>
                                <td className="p-3 font-mono text-slate-600">{st.phone}</td>
                                <td className="p-3 font-mono text-blue-700">{st.email}</td>
                                <td className="p-3 font-mono font-bold text-[#ffb531] bg-white px-2 py-1 rounded">
                                  {st.plainPasswordForAdmin || 'Hidden (Hashed)'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      st.status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : st.status === 'blocked'
                                        ? 'bg-red-500/20 text-red-400 border border-red-300/30'
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
                                      className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded text-[11px] font-bold transition"
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
                    <form onSubmit={handleAddVideo} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#ffb531]" />
                        Upload / Push New YouTube Video Lecture
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1">Class Video Title *</label>
                          <input
                            type="text"
                            required
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder="e.g. Class 03: Rebar Detailing and BBS"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">YouTube URL / Link *</label>
                          <input
                            type="url"
                            required
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Duration (Optional)</label>
                          <input
                            type="text"
                            value={newVideoDuration}
                            onChange={(e) => setNewVideoDuration(e.target.value)}
                            placeholder="e.g. 1 hr 15 mins"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Lecture Note / Instructions</label>
                          <input
                            type="text"
                            value={newVideoNote}
                            onChange={(e) => setNewVideoNote(e.target.value)}
                            placeholder="e.g. Download BBS excel from resources tab"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
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
                      <h4 className="text-xs font-bold text-slate-600">Published Videos ({selectedCourseData.videos?.length || 0}):</h4>
                      {selectedCourseData.videos?.map((vid) => (
                        <div
                          key={vid._id}
                          className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{vid.title}</span>
                            <span className="text-blue-700 font-mono text-[11px] truncate max-w-sm block">
                              {vid.youtubeUrl}
                            </span>
                          </div>
                          <span className="text-slate-600 text-[11px]">{vid.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HUB TAB 3: SCHEDULE LIVE CLASS */}
                {courseSubTab === 'live' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddLiveClass} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#ffb531]" />
                        Schedule Online Live Class (Google Meet / Zoom)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1">Class Topic / Headline *</label>
                          <input
                            type="text"
                            required
                            value={newLiveTitle}
                            onChange={(e) => setNewLiveTitle(e.target.value)}
                            placeholder="e.g. Live Structural Drawing Coordination"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Google Meet / Meeting Link *</label>
                          <input
                            type="url"
                            required
                            value={newLiveLink}
                            onChange={(e) => setNewLiveLink(e.target.value)}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Date *</label>
                          <input
                            type="date"
                            required
                            value={newLiveDate}
                            onChange={(e) => setNewLiveDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Time Slot *</label>
                          <input
                            type="text"
                            required
                            value={newLiveTime}
                            onChange={(e) => setNewLiveTime(e.target.value)}
                            placeholder="e.g. 08:30 PM (BST)"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-700/80 text-white font-bold text-xs rounded-lg shadow transition"
                        >
                          Publish Live Class Schedule
                        </button>
                      </div>
                    </form>

                    {/* Existing Live Classes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-600">Scheduled Sessions:</h4>
                      {selectedCourseData.liveClasses?.map((item) => (
                        <div
                          key={item._id}
                          className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{item.title}</span>
                            <span className="text-slate-600 block text-[11px]">
                              {new Date(item.classDate).toLocaleDateString()} at {item.classTime}
                            </span>
                          </div>
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 underline flex items-center gap-1"
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
                    <form onSubmit={handleAddTask} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-[#ffb531]" />
                        Assign New Task / Homework
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1">Task Title *</label>
                          <input
                            type="text"
                            required
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Prepare Rebar BBS for Footing"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Submission Deadline *</label>
                          <input
                            type="date"
                            required
                            value={newTaskDeadline}
                            onChange={(e) => setNewTaskDeadline(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 mb-1">Instructions &amp; Requirements *</label>
                          <textarea
                            rows={2}
                            required
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            placeholder="Describe what the student needs to submit..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
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
                      <h4 className="text-xs font-bold text-slate-900">Student Homework Submissions ({courseSubmissions.length}):</h4>
                      {courseSubmissions.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">No submissions yet for this course.</p>
                      ) : (
                        courseSubmissions.map((sub) => (
                          <div
                            key={sub._id}
                            className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {sub.studentName} ({sub.studentEmail})
                              </span>
                              <span className="text-slate-600">
                                Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[#ffb531] font-semibold">Task: {sub.taskTitle}</p>
                            {sub.submissionLink && (
                              <p className="text-blue-700">
                                Link:{' '}
                                <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer" className="underline">
                                  {sub.submissionLink}
                                </a>
                              </p>
                            )}
                            {sub.submissionText && <p className="text-slate-600">{sub.submissionText}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* HUB TAB 5: ADMIN CHAT WITH STUDENTS */}
                {courseSubTab === 'chat' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[450px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {courseChat.length === 0 ? (
                        <p className="text-center py-8 text-xs text-slate-600">No discussion in this course room yet.</p>
                      ) : (
                        courseChat.map((msg, idx) => {
                          const isAdmin = msg.senderRole === 'admin';

                          return (
                            <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                              <span className="text-[10px] text-slate-600 mb-0.5 px-1">
                                {msg.senderName} ({msg.senderRole})
                              </span>
                              <div
                                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs ${
                                  isAdmin
                                    ? 'bg-blue-700 text-white rounded-br-none'
                                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                                }`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendAdminChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <input
                        type="text"
                        value={adminChatMsg}
                        onChange={(e) => setAdminChatMsg(e.target.value)}
                        placeholder="Reply to students in this course..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
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
            </div>
          ) : (
            /* OVERVIEW & ALL COURSES LIST */
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-600">Total Enrolled Students</span>
                <p className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-700" />
                  {stats?.totalStudents || 0}
                </p>
                <span className="text-[11px] text-emerald-400">Verified learners across batches</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-600">Total Verified Revenue</span>
                <p className="text-3xl font-extrabold text-[#ffb531] flex items-center gap-2">
                  ৳{(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-600">From confirmed bKash/Nagad payments</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-600">Pending Verification</span>
                <p className="text-3xl font-extrabold text-amber-400 flex items-center gap-2">
                  {stats?.pendingEnrollments || 0}
                </p>
                <span className="text-[11px] text-blue-700">TrxID submissions awaiting approval</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-600">Active Courses</span>
                <p className="text-3xl font-extrabold text-[#50c878] flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#50c878]" />
                  {coursesList.length}
                </p>
                <span className="text-[11px] text-slate-600">Published on academy catalog</span>
              </div>
            </div>

            {/* COURSE BUTTONS SECTION (Requirement 1: 'end jei koita course create koreche seigular button hisabe thakbe') */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Course Management Buttons</h2>
                  <p className="text-xs text-slate-600">
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
                          ? 'bg-slate-100 border-[#ffb531] shadow-lg shadow-[#ffb531]/10'
                          : 'bg-white border-slate-200 hover:border-blue-500/40 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-[#ffb531] font-bold">৳{c.price.toLocaleString()}</span>
                          <span className="text-blue-700 font-medium">{c.durationDays} Days</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400" /> {c.studentCount} Students
                        </span>
                        {c.pendingCount > 0 && (
                          <span className="text-[#ffb531] font-bold">({c.pendingCount} Pending)</span>
                        )}
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-[#ffb531]' : 'text-blue-700'}`}>
                          {isSelected ? '● Active Hub' : 'Manage Course →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          )
        )}

        {/* ========================================================
            TAB 2: PENDING ENROLLMENTS VERIFICATION
        ======================================================== */}
        {activeMainTab === 'enrollments' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pending &amp; Processed Enrollments</h2>
              <p className="text-xs text-slate-600">
                Verify the Transaction ID against your bKash/Nagad statement. Clicking &quot;Approve&quot; automatically creates the student credentials and emails them to the student.
              </p>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-600">
                No enrollment submissions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden min-w-[850px]">
                  <thead className="bg-white text-blue-700 font-semibold border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-200 bg-slate-50">
                    {enrollments.map((en) => (
                      <tr key={en._id} className="hover:bg-white">
                        <td className="p-3 font-bold text-slate-900">
                          {en.studentName}
                          <span className="block text-[10px] text-slate-600">{en.studentAddress}</span>
                        </td>
                        <td className="p-3">
                          <span className="block font-mono text-slate-600">{en.studentPhone}</span>
                          <span className="block text-blue-700">{en.studentEmail}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 max-w-xs">{en.courseTitle}</td>
                        <td className="p-3 font-medium text-slate-600">{en.paymentMethod}</td>
                        <td className="p-3 font-mono text-slate-900">{en.senderNumber}</td>
                        <td className="p-3 font-mono font-bold text-[#ffb531] bg-white px-2 py-1 rounded">
                          {en.transactionId}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">৳{en.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              en.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : en.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border border-red-300/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {en.status.toUpperCase()}
                          </span>
                          {en.generatedPassword && (
                            <span className="block text-[10px] text-slate-600 font-mono mt-0.5">
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
                                className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs transition"
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
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" /> Homepage Content, Instructor Profile &amp; Gateway Settings
                </h2>
                <p className="text-xs text-slate-600">
                  Change instructor photo, names, headings, experience, phone numbers, and bKash/Nagad accounts. Updates appear live across the site immediately.
                </p>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-extrabold text-xs flex items-center gap-2 shadow-lg transition shrink-0"
              >
                <Save className="w-4 h-4" /> Save All Settings
              </button>
            </div>

            {/* SECTION 1: INSTRUCTOR NAME, PHOTO & PROFILE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <h3 className="text-sm font-bold text-[#ffb531] flex items-center gap-2 border-b border-slate-200 pb-2.5">
                👨‍🏫 Lead Instructor Name, Photo &amp; Qualifications (ইন্সট্রাক্টর প্রোফাইল ও ছবি)
              </h3>
              
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Photo Preview and File Uploader */}
                <div className="w-full md:w-auto flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shrink-0">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Instructor Photo</span>
                  <div className="relative w-28 h-36 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-900 group">
                    <img
                      src={siteSettings.instructorImage || '/instructor.jpg?v=2'}
                      alt="Instructor preview"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  
                  <label className="cursor-pointer w-full text-center px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md">
                    📁 Change Photo (ছবি আপলোড)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInstructorImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 text-center max-w-[150px]">
                    Upload JPG/PNG from your PC or phone (Max 5MB)
                  </span>
                </div>

                {/* Details Form Grid */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Instructor Full Name (ইন্সট্রাক্টরের পুরো নাম) *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteSettings.instructorName || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorName: e.target.value })}
                      placeholder="Engr. Md Abdul Mazid"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Degree &amp; University (ডিগ্রি ও বিশ্ববিদ্যালয়) *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteSettings.instructorDegree || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorDegree: e.target.value })}
                      placeholder="B.Sc. in Civil Engineering (BUET)"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Full Experience Label (অভিজ্ঞতা শিরোনাম)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.instructorExp || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorExp: e.target.value })}
                      placeholder="10+ Years On Real Projects in Bangladesh"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Short Experience Badge (ছোট ব্যাজ)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.instructorShortExp || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorShortExp: e.target.value })}
                      placeholder="10+ Yrs Exp"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Instructor Image URL (বা ছবির সরাসরি লিংক)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.instructorImage || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorImage: e.target.value })}
                      placeholder="/instructor.jpg?v=2 or https://..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none text-[11px] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Detailed Bio / Mission Paragraph (শিক্ষকের বিস্তারিত বিবরণ)
                    </label>
                    <textarea
                      rows={3}
                      value={siteSettings.instructorBio || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instructorBio: e.target.value })}
                      placeholder="Engr. Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Two Feature Highlights */}
              <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-amber-400 font-bold">Feature 1: Title &amp; Description (ফিচার ১)</label>
                  <input
                    type="text"
                    value={siteSettings.feature1Title || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, feature1Title: e.target.value })}
                    placeholder="Real Developer Drawings"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.feature1Desc || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, feature1Desc: e.target.value })}
                    placeholder="Learn using actual architectural, structural, and MEP drawings..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 outline-none text-[11px]"
                  />
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-emerald-400 font-bold">Feature 2: Title &amp; Description (ফিচার ২)</label>
                  <input
                    type="text"
                    value={siteSettings.feature2Title || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, feature2Title: e.target.value })}
                    placeholder="Live Site Situations"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.feature2Desc || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, feature2Desc: e.target.value })}
                    placeholder="Master casting SOPs, rebar BBS optimization..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: HOMEPAGE STATS COUNTERS & TOP BADGE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                📊 Homepage Badges &amp; Stat Numbers (পরিসংখ্যান ও টপ ব্যাজ)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Courses Count (কোর্স সংখ্যা)</label>
                  <input
                    type="text"
                    value={siteSettings.statsCourses || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsCourses: e.target.value })}
                    placeholder="6+"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Experience Stat (অভিজ্ঞতা)</label>
                  <input
                    type="text"
                    value={siteSettings.statsExperience || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsExperience: e.target.value })}
                    placeholder="10+ Yrs"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mentor Institution (প্রতিষ্ঠান)</label>
                  <input
                    type="text"
                    value={siteSettings.statsMentorTag || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsMentorTag: e.target.value })}
                    placeholder="BUET"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Top Hero Badge Text</label>
                  <input
                    type="text"
                    value={siteSettings.heroBadgeText || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBadgeText: e.target.value })}
                    placeholder="Bangladesh's #1 Practical Civil Engineering Academy"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: WEBSITE BRANDING & HEADLINES */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                🌐 Academy Branding, Hero Title &amp; Bengali Note (মূল শিরোনাম)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Academy / Platform Name</label>
                  <input
                    type="text"
                    value={siteSettings.siteName || 'Blueprint Learning Academy'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Hero Bengali Tagline Note (বাংলা ব্যানার)</label>
                  <input
                    type="text"
                    value={siteSettings.heroBengaliNote || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBengaliNote: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Hero Main Headline Title (প্রধান হেডলাইন)</label>
                  <input
                    type="text"
                    value={siteSettings.heroTitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Hero Subtitle Description (উপ-বিবরণ)</label>
                  <textarea
                    rows={2}
                    value={siteSettings.heroSubtitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* SECTION 4: CONTACT, PHONE, WHATSAPP, EMAIL */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#ffb531] flex items-center gap-2 border-b border-slate-200 pb-2.5">
                📞 Official Helpline &amp; WhatsApp Numbers (ফোন নম্বর ও সাপোর্ট)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    Contact Helpline Phone * (ফোন নম্বর)
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.contactPhone || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                  <span className="text-[10px] text-blue-700">Appears in header, footer &amp; direct calling</span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    WhatsApp Number (with country code e.g. 880) *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.whatsappNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                    placeholder="88013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                  <span className="text-[10px] text-emerald-400">Used for direct WhatsApp chat button links</span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    Official Support Email * (ইমেইল ঠিকানা)
                  </label>
                  <input
                    type="email"
                    required
                    value={siteSettings.contactEmail || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                    placeholder="info@blueprintlearningacademy.com"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                  <span className="text-[10px] text-blue-700">Displayed in contact links &amp; email notifications</span>
                </div>
              </div>
            </div>

            {/* SECTION 5: BKASH & NAGAD PAYMENT GATEWAY */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                💳 bKash, Nagad &amp; Rocket Payment Numbers (পেমেন্ট নম্বরসমূহ)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">bKash Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.bkashNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.bkashType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Nagad Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.nagadNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={siteSettings.nagadType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Rocket Number</label>
                  <input
                    type="text"
                    value={siteSettings.rocketNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, rocketNumber: e.target.value })}
                    placeholder="013XXXXXXXX-X"
                    className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
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
            <div className="bg-white border-2 border-blue-500/40 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs text-[#ffb531] font-bold uppercase tracking-wider block">
                  Security Authentication
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Change Administrator Password via Email Verification (OTP)
                </h2>
                <p className="text-xs text-slate-600">
                  To change your password, request a secure 6-digit one-time verification code to your registered email address.
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="max-w-lg space-y-3 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Your Registered Administrator Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="admin@careerpath.com"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
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
                <form onSubmit={handleVerifyOtp} className="max-w-lg space-y-4 text-xs bg-slate-50 p-5 rounded-xl border border-[#ffb531]">
                  <div className="p-3 bg-white border border-emerald-500 rounded-lg text-emerald-800">
                    ✅ A 6-digit verification code has been dispatched to <strong>{otpEmail}</strong> (valid for 10 minutes).
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Enter 6-Digit Verification Code (OTP) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 482915"
                      className="w-full bg-white border border-[#ffb531] rounded-lg px-3 py-2.5 text-lg font-mono tracking-widest text-[#ffb531] text-center font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">
                      Enter New Secure Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2.5 text-slate-900 outline-none"
                    />
                    <span className="text-[11px] text-blue-700">Minimum 6 characters long</span>
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
                      className="text-xs text-slate-600 hover:underline"
                    >
                      Resend Code / Change Email
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* PART 2: MANAGE ADMINISTRATOR TEAM (ADD NEW ADMIN) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">
                  Team Access Control
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Administrator Team ({adminsList.length})
                </h2>
                <p className="text-xs text-slate-600">
                  Authorized administrators with full portal permissions (managing courses, approving enrollments, and viewing credentials).
                </p>
              </div>

              {/* Add New Admin Form */}
              <form onSubmit={handleAddNewAdmin} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3 text-xs">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#ffb531]" />
                  Add New Administrator (নতুন অ্যাডমিন যুক্ত করুন)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Engr. Shafiqul Islam"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Login Email *</label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin2@careerpath.com"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Admin Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-[#ffb531] rounded-lg px-3 py-2 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-700/80 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {creatingAdmin ? 'Adding Admin...' : 'Register New Administrator'}
                  </button>
                </div>
              </form>

              {/* List of Admins */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden min-w-[640px]">
                  <thead className="bg-white text-blue-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Administrator Name</th>
                      <th className="p-3">Login Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-slate-50">
                    {adminsList.map((adm) => (
                      <tr key={adm._id} className="hover:bg-white">
                        <td className="p-3 font-bold text-slate-900">{adm.name}</td>
                        <td className="p-3 font-mono text-blue-700">{adm.email}</td>
                        <td className="p-3 font-mono text-slate-600">{adm.phone}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {adm.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {new Date(adm.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteAdmin(adm._id, adm.name)}
                            className="px-2.5 py-1 text-[11px] bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded transition"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New Engineering Course</h3>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Real Estate Project Planning and Scheduling"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Offer Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Regular Price (৳)</label>
                  <input
                    type="number"
                    value={createRegularPrice}
                    onChange={(e) => setCreateRegularPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Course Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    value={createDurationDays}
                    onChange={(e) => setCreateDurationDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Total Classes Count *</label>
                  <input
                    type="number"
                    required
                    value={createTotalClasses}
                    onChange={(e) => setCreateTotalClasses(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">WhatsApp Batch Group Invite Link *</label>
                <input
                  type="url"
                  required
                  value={createWhatsappLink}
                  onChange={(e) => setCreateWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Short Description *</label>
                <input
                  type="text"
                  required
                  value={createShortDesc}
                  onChange={(e) => setCreateShortDesc(e.target.value)}
                  placeholder="Brief 1-2 sentence overview for cards"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Full Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={createFullDesc}
                  onChange={(e) => setCreateFullDesc(e.target.value)}
                  placeholder="Comprehensive description of the course..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-300 rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Suspend / Block Student Access
            </div>
            <p className="text-xs text-slate-600">
              You are about to block <strong>{blockingUser.name}</strong> ({blockingUser.email}).
              Please enter the official reason. This reason will be <strong>emailed to the student</strong> immediately.
            </p>

            <form onSubmit={handleBlockUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-red-700 mb-1 font-semibold">
                  Reason for Suspension (কারণ) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="e.g. Disciplinary breach in class, payment reversal, or code of conduct violation..."
                  className="w-full bg-slate-50 border border-red-300/50 rounded-lg p-2.5 text-slate-900 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
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

      {/* MANUAL ADD STUDENT MODAL */}
      {showAddStudentModal && selectedCourseData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" /> Manually Add Student to Course
                </h3>
                <p className="text-xs text-blue-700 font-semibold mt-0.5 truncate max-w-sm">
                  {selectedCourseData.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Student Full Name (শিক্ষার্থীর পূর্ণ নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={addStudentName}
                  onChange={(e) => setAddStudentName(e.target.value)}
                  placeholder="e.g. Engr. Tanvir Ahmed"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Mobile Number (মোবাইল নম্বর) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addStudentPhone}
                    onChange={(e) => setAddStudentPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Login Email (লগইন ইমেইল) *
                  </label>
                  <input
                    type="email"
                    required
                    value={addStudentEmail}
                    onChange={(e) => setAddStudentEmail(e.target.value)}
                    placeholder="tanvir@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Login Password (লগইন পাসওয়ার্ড)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddStudentPassword('BLP-' + Math.random().toString(36).substring(2, 8).toUpperCase())}
                    className="text-[10px] text-amber-700 hover:underline font-bold"
                  >
                    🎲 Regenerate Auto-Password
                  </button>
                </div>
                <input
                  type="text"
                  value={addStudentPassword}
                  onChange={(e) => setAddStudentPassword(e.target.value)}
                  placeholder="Auto-generated if left empty"
                  className="w-full bg-amber-50/60 border border-amber-300 rounded-xl px-3.5 py-2.5 text-amber-950 font-mono font-bold outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can give this password directly to the student so they can log in immediately.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Address / City (ঠিকানা বা শহর - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={addStudentAddress}
                  onChange={(e) => setAddStudentAddress(e.target.value)}
                  placeholder="e.g. Uttara, Dhaka"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {addingStudent ? 'Enrolling Student...' : 'Confirm & Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}