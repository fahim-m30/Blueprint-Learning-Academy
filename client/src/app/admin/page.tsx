'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, removeAuthToken } from '@/lib/api';
import { Course, Enrollment, SiteSettings, StudentCV } from '@/lib/types';
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
  FileText,
  Download,
  Search,
  CheckCircle2,
  Mail,
  Bell,
  Pin,
  PinOff,
  Clock,
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // High level data
  const [stats, setStats] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Student CVs Management state
  const [allStudentCvs, setAllStudentCvs] = useState<any[]>([]);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvSearchQuery, setCvSearchQuery] = useState('');
  const [cvStatusFilter, setCvStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'needs_revision'>('all');
  const [viewingStudentCv, setViewingStudentCv] = useState<any | null>(null);
  const [adminCvFeedback, setAdminCvFeedback] = useState('');
  const [adminCvStatus, setAdminCvStatus] = useState<'submitted' | 'reviewed' | 'needs_revision'>('reviewed');
  const [savingCvFeedback, setSavingCvFeedback] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Active view
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'enrollments' | 'cvs' | 'settings' | 'security'>('overview');

  // Course Messenger States
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string | null>(null);
  const [chatStudentSearch, setChatStudentSearch] = useState('');
  const courseChatBottomRef = useRef<HTMLDivElement | null>(null);
  const courseChatContainerRef = useRef<HTMLDivElement | null>(null);

  const isUserScrolledUpAdminRef = useRef(false);

  const scrollAdminChatToBottom = (force = false) => {
    if (courseChatContainerRef.current) {
      // If user has scrolled up to read previous messages, DO NOT force scroll down!
      if (!force && isUserScrolledUpAdminRef.current) {
        return;
      }
      courseChatContainerRef.current.scrollTo({
        top: courseChatContainerRef.current.scrollHeight,
        behavior: force ? 'auto' : 'smooth',
      });
      if (force) {
        isUserScrolledUpAdminRef.current = false;
      }
    }
  };

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
  const [courseSubTab, setCourseSubTab] = useState<'students' | 'videos' | 'live' | 'tasks' | 'notices' | 'chat'>('students');

  // Notice Form & Batch info state inside Course Hub
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'batch_start' | 'vacation' | 'special'>('batch_start');
  const [noticeDate, setNoticeDate] = useState('');
  const [noticeIsPinned, setNoticeIsPinned] = useState(true);
  const [submittingNotice, setSubmittingNotice] = useState(false);

  const [batchStartDateInput, setBatchStartDateInput] = useState('');
  const [batchScheduleInput, setBatchScheduleInput] = useState('');
  const [savingBatchInfo, setSavingBatchInfo] = useState(false);

  // Form states for Course additions
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('');
  const [newVideoNote, setNewVideoNote] = useState('');

  // Course-specific Public Demo Video states (for Homepage Demo Carousel)
  const [courseDemoUrl, setCourseDemoUrl] = useState('');
  const [courseDemoTitle, setCourseDemoTitle] = useState('');
  const [courseDemoDescription, setCourseDemoDescription] = useState('');
  const [savingCourseDemo, setSavingCourseDemo] = useState(false);

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
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Feedback notifications
  const [alertBanner, setAlertBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Fast hydrate from local cache
    try {
      const cached = localStorage.getItem('bpa_admin_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.stats) setStats(data.stats);
        if (data.courses) setCoursesList(data.courses);
        if (data.enrollments) setEnrollments(data.enrollments);
        if (data.settings) setSiteSettings(data.settings);
        setLoading(false);
      }
    } catch {}

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
    const [overviewRes, enrollRes, settingsRes, adminsRes, cvsRes] = await Promise.all([
      apiRequest('/admin/overview'),
      apiRequest('/admin/enrollments'),
      apiRequest('/admin/settings'),
      apiRequest('/admin/admins'),
      apiRequest('/admin/cvs'),
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

    if (cvsRes.success && cvsRes.data?.students) {
      setAllStudentCvs(cvsRes.data.students);
    }

    try {
      localStorage.setItem(
        'bpa_admin_cache',
        JSON.stringify({
          stats: overviewRes.data.stats,
          courses: overviewRes.data.courses,
          enrollments: enrollRes.data?.enrollments || [],
          settings: settingsRes.data?.settings || null,
        })
      );
    } catch {}

    setLoading(false);
  };

  const loadStudentCvs = async () => {
    setCvLoading(true);
    const res = await apiRequest('/admin/cvs');
    if (res.success && res.data?.students) {
      setAllStudentCvs(res.data.students);
    }
    setCvLoading(false);
  };

  // Only scroll when entering chat tab or switching student
  useEffect(() => {
    if (courseSubTab === 'chat') {
      setTimeout(() => scrollAdminChatToBottom(true), 60);
    }
  }, [courseSubTab, selectedChatStudentId]);

  // Live Auto-Polling for Pending Enrollments, Payments & Overview Stats (every 3.5s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(async () => {
      try {
        const [enrollRes, overviewRes] = await Promise.all([
          apiRequest('/admin/enrollments'),
          apiRequest('/admin/overview'),
        ]);
        if (enrollRes.success && enrollRes.data?.enrollments) {
          setEnrollments((prev) => (prev.length !== enrollRes.data.enrollments.length ? enrollRes.data.enrollments : prev));
        }
        if (overviewRes.success && overviewRes.data?.stats) {
          setStats((prev: any) => {
            if (
              !prev ||
              prev.pendingEnrollments !== overviewRes.data.stats.pendingEnrollments ||
              prev.totalRevenue !== overviewRes.data.stats.totalRevenue
            ) {
              return overviewRes.data.stats;
            }
            return prev;
          });
        }
      } catch {}
    }, 3500);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Live Smooth Real-Time Auto-Polling inside Course Hub (Non-Flickering, Messenger Smoothness)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (selectedCourseId) {
      interval = setInterval(async () => {
        try {
          if (courseSubTab === 'chat') {
            const chatRes = await apiRequest(`/admin/courses/${selectedCourseId}/chat`);
            const msgs = (chatRes.data as any)?.messages || (chatRes as any)?.messages;
            if (chatRes.success && Array.isArray(msgs)) {
              setCourseChat((prev) => {
                const prevLen = prev.length;
                const newLen = msgs.length;
                if (prevLen !== newLen || (prevLen > 0 && prev[prevLen - 1]?._id !== msgs[newLen - 1]?._id)) {
                  setTimeout(() => scrollAdminChatToBottom(false), 50);
                  return msgs;
                }
                return prev; // Same data -> NO re-render, ZERO screen jump!
              });
            }
          } else {
            const cRes = await apiRequest(`/admin/courses/${selectedCourseId}`);
            if (cRes.success && cRes.data) {
              setSelectedCourseData((prev: any) => {
                if (JSON.stringify(prev?.syllabus) !== JSON.stringify(cRes.data.course?.syllabus)) {
                  return cRes.data.course;
                }
                return prev;
              });
              if (cRes.data.students) {
                setCourseStudents((prev: any[]) =>
                  prev.length !== cRes.data.students.length ? cRes.data.students : prev
                );
              }
              if (cRes.data.taskSubmissions) {
                setCourseSubmissions((prev: any[]) =>
                  prev.length !== cRes.data.taskSubmissions.length ? cRes.data.taskSubmissions : prev
                );
              }
            }
          }
        } catch {}
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCourseId, courseSubTab]);

  // Live Real-Time Auto-Polling for Student CVs (every 2.5s, keeps badge & student lists fresh)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(async () => {
      try {
        const res = await apiRequest('/admin/cvs');
        const list = res.data?.students || (res as any)?.students;
        if (res.success && Array.isArray(list)) {
          setAllStudentCvs(list);
        }
      } catch {}
    }, 2500);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleSaveCvFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingStudentCv) return;

    setSavingCvFeedback(true);
    const res = await apiRequest(`/admin/cvs/${viewingStudentCv._id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        feedback: adminCvFeedback.trim(),
        status: adminCvStatus,
      }),
    });
    setSavingCvFeedback(false);

    if (res.success) {
      showAlert('CV feedback and review status updated successfully!');
      setViewingStudentCv(null);
      loadStudentCvs();
      if (selectedCourseId) loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Error updating CV feedback.', 'error');
    }
  };

  const loadCourseHub = async (courseId: string) => {
    setSelectedCourseId(courseId);
    const [cRes, chatRes] = await Promise.all([
      apiRequest(`/admin/courses/${courseId}`),
      apiRequest(`/admin/courses/${courseId}/chat`),
    ]);

    if (cRes.success && cRes.data) {
      const crs = cRes.data.course;
      setSelectedCourseData(crs);
      setCourseStudents(cRes.data.students || []);
      setCourseSubmissions(cRes.data.taskSubmissions || []);
      setCourseDemoUrl(crs?.demoVideoUrl || '');
      setCourseDemoTitle(crs?.demoVideoTitle || '');
      setCourseDemoDescription(crs?.demoVideoDescription || '');
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
  const handleApproveEnrollment = async (enrollmentId: string, en?: any) => {
    showAlert('Approving enrollment and dispatching email...');
    const res = await apiRequest(`/admin/enrollments/${enrollmentId}/approve`, {
      method: 'POST',
    });
    if (res.success) {
      const responseData = (res.data || res) as any;
      const backendEmailDispatched = responseData?.emailResult?.success;

      // Always guarantee email is sent on the very FIRST click:
      if (!backendEmailDispatched && en) {
        await handleResendCredentialsEmail({
          ...en,
          studentId: responseData?.credentials?.studentId || en.studentId,
          generatedPassword: responseData?.credentials?.password || en.generatedPassword || 'BLP-LEARN2026',
        });
      } else {
        showAlert(res.message || 'Enrollment approved and email sent successfully!');
      }
      loadAdminData();
    } else {
      showAlert(res.message || 'Error approving enrollment.', 'error');
    }
  };

  const handleResendCredentialsEmail = async (en: any) => {
    showAlert(`Dispatching credentials email to ${en.studentEmail || 'student'}...`);
    try {
      const res = await apiRequest(`/admin/enrollments/${en._id}/resend-email`, {
        method: 'POST',
      });
      if (res && res.success) {
        showAlert(res.message || 'Credentials email resent successfully!');
        return;
      }
    } catch (backendErr) {
      console.warn('Backend resend endpoint not reachable, engaging direct relay:', backendErr);
    }

    // Direct Vercel HTTPS Relay Fallback
    try {
      const courseTitle = en.course?.title || 'Blueprint Learning Career Course';
      const password = en.generatedPassword || 'BLP-LEARN2026';
      const loginUrl = typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/login` : 'https://blueprint-learning-academy.vercel.app/login';
      const currentYear = new Date().getFullYear();

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to Blueprint Learning Academy</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="width:100%;padding:30px 10px 40px;box-sizing:border-box;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 15px 35px -5px rgba(15,23,42,0.08);">
      <div style="background:linear-gradient(135deg,#091224 0%,#0f274a 55%,#1e3a8a 100%);padding:36px 24px 28px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Blueprint <span style="color:#ffb531;">Learning Academy</span></h1>
        <p style="margin:6px 0 0;color:#93c5fd;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">Bangladesh's #1 Practical Civil Engineering Academy</p>
      </div>
      <div style="padding:32px 30px;">
        <div style="display:inline-block;background-color:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:11px;font-weight:800;text-transform:uppercase;padding:5px 14px;border-radius:9999px;margin-bottom:16px;">
          ✓ Enrollment &amp; Payment Verified
        </div>
        <h2 style="margin:0 0 12px;color:#0f172a;font-size:22px;font-weight:900;">Welcome to the Batch, ${en.studentName}!</h2>
        <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">Congratulations on enrolling in Blueprint Learning Academy. Your student portal account is now active with the credentials below:</p>
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:11px;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:4px;">Enrolled Course</div>
          <div style="color:#0f172a;font-size:16px;font-weight:900;">${courseTitle}</div>
        </div>
        <div style="background:#0b1528;border:1.5px solid #ffb531;border-radius:16px;padding:20px;margin-bottom:24px;">
          <div style="color:#ffb531;font-size:13px;font-weight:800;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:8px;">🔐 Student Access Credentials</div>
          ${en.studentId ? `
          <div style="margin-bottom:10px;">
            <div style="color:#94a3b8;font-size:11px;font-weight:700;">Official Student ID</div>
            <div style="background:#1c1917;border:1px solid #b45309;border-radius:8px;padding:8px 12px;color:#ffb531;font-family:monospace;font-weight:900;font-size:15px;letter-spacing:2px;">${en.studentId}</div>
          </div>` : ''}
          <div style="margin-bottom:10px;">
            <div style="color:#94a3b8;font-size:11px;font-weight:700;">Login Identifier (Student ID or Email)</div>
            <div style="background:#0f1d35;border:1px solid #254070;border-radius:8px;padding:8px 12px;color:#fff;font-family:monospace;font-weight:700;font-size:14px;">${en.studentEmail}</div>
          </div>
          <div>
            <div style="color:#94a3b8;font-size:11px;font-weight:700;">Portal Password</div>
            <div style="background:#1c1917;border:1px solid #b45309;border-radius:8px;padding:8px 12px;color:#ffb531;font-family:monospace;font-weight:800;font-size:15px;letter-spacing:1px;">${password}</div>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}?email=${encodeURIComponent(en.studentEmail)}&from=email" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 32px;border-radius:12px;">Sign In to Student Portal</a>
        </div>
      </div>
      <div style="background:#091224;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
        Blueprint Learning Academy &copy; ${currentYear}. Helpline: +880 1313-916161
      </div>
    </div>
  </div>
</body>
</html>`;

      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'blueprint_academy_email_secret_key_2026',
          to: en.studentEmail,
          subject: `Course Enrollment Confirmation: ${courseTitle} - Student ID & Login Credentials`,
          html,
          text: `Welcome ${en.studentName}! Your course access for ${courseTitle} is active. Student ID: ${en.studentId || ''}, Email: ${en.studentEmail}, Password: ${password}, Login URL: ${loginUrl}?email=${encodeURIComponent(en.studentEmail)}&from=email`,
          config: {
            smtpHost: siteSettings?.smtpHost || 'smtp-relay.brevo.com',
            smtpPort: Number(siteSettings?.smtpPort) || 587,
            smtpUser: siteSettings?.smtpUser || 'c0c2b6001@smtp-brevo.com',
            smtpPass: siteSettings?.smtpPass,
            gmailUser: siteSettings?.gmailUser || 'admin.blueprintlearning@gmail.com',
            gmailPass: siteSettings?.gmailPass || 'ncpcooxwigjauknm',
          }
        }),
      });

      const emailData = await emailRes.json();
      if (emailRes.ok && emailData.success) {
        showAlert(`Credentials email sent to ${en.studentEmail} successfully via ${emailData.provider || 'Relay'}!`);
      } else {
        showAlert(`Failed to resend email: ${emailData.message || emailData.error}`, 'error');
      }
    } catch (relayErr: any) {
      showAlert(`Error sending email: ${relayErr.message}`, 'error');
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

    setBlockingLoading(true);
    showAlert('Suspending student and dispatching official notice email...');
    const res = await apiRequest(`/admin/users/${blockingUser._id}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'blocked',
        blockReason: blockReasonInput.trim(),
      }),
    });
    setBlockingLoading(false);

    if (res.success) {
      showAlert(res.message || `User has been blocked. Notification email sent to ${blockingUser.email}`);
      const blockedId = blockingUser._id;
      const appliedReason = blockReasonInput.trim();
      setBlockingUser(null);
      setBlockReasonInput('');
      setCourseStudents((prev) =>
        prev.map((s) => (s._id === blockedId ? { ...s, status: 'blocked', blockReason: appliedReason } : s))
      );
      if (selectedCourseId) loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Error blocking user.', 'error');
    }
  };

  const handleUnblockUser = async (userId: string, studentName?: string, studentEmail?: string) => {
    showAlert('Reinstating account & sending confirmation email to student...');
    const res = await apiRequest(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'active' }),
    });
    if (res.success) {
      showAlert(res.message || `User account reinstated to Active! Confirmation email dispatched${studentEmail ? ` to ${studentEmail}` : ''}.`);
      setCourseStudents((prev) =>
        prev.map((s) => (s._id === userId ? { ...s, status: 'active', blockReason: '' } : s))
      );
      if (selectedCourseId) loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Error unblocking user.', 'error');
    }
  };

  // 2.5 Course Demo Preview Video (Homepage Carousel)
  const handleSaveCourseDemoVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCourseId) {
      showAlert('Please select a course first.', 'error');
      return;
    }
    let formattedUrl = courseDemoUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setSavingCourseDemo(true);
    const res = await apiRequest(`/admin/courses/${selectedCourseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        demoVideoUrl: formattedUrl,
        demoVideoTitle: courseDemoTitle.trim(),
        demoVideoDescription: courseDemoDescription.trim(),
      }),
    });
    setSavingCourseDemo(false);

    if (res.success) {
      showAlert('✓ Public Demo Video updated for this course! It is now live on the homepage demo carousel.');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(`✕ Error saving course demo video: ${res.message || 'Please check connection.'}`, 'error');
    }
  };

  const handleSetVideoAsDemo = async (vid: { title: string; youtubeUrl: string; note?: string }) => {
    if (!selectedCourseId) return;
    setCourseDemoUrl(vid.youtubeUrl || '');
    setCourseDemoTitle(vid.title || '');
    setCourseDemoDescription(vid.note || '');

    setSavingCourseDemo(true);
    const res = await apiRequest(`/admin/courses/${selectedCourseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        demoVideoUrl: vid.youtubeUrl || '',
        demoVideoTitle: vid.title || '',
        demoVideoDescription: vid.note || '',
      }),
    });
    setSavingCourseDemo(false);

    if (res.success) {
      showAlert(`✓ Video "${vid.title}" is now set as the Homepage Demo Preview for this course!`);
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(`✕ Error setting video as demo: ${res.message || 'Please check connection.'}`, 'error');
    }
  };

  // 3. Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showAlert('Please select a course first.', 'error');
      return;
    }
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showAlert('Please provide both Video Title and YouTube Link.', 'error');
      return;
    }

    let formattedUrl = newVideoUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setSavingSection('video');
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/videos`, {
      method: 'POST',
      body: JSON.stringify({
        title: newVideoTitle.trim(),
        youtubeUrl: formattedUrl,
        duration: newVideoDuration.trim(),
        note: newVideoNote.trim(),
      }),
    });
    setSavingSection(null);

    if (res.success) {
      showAlert('✓ Class video added successfully and published to student dashboard.');
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoDuration('');
      setNewVideoNote('');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(`✕ Error adding video: ${res.message || 'Please check connection.'}`, 'error');
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

  // 6. Admin Chat (Instant Optimistic UI + Background Dispatch)
  const handleSendAdminChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = adminChatMsg.trim();
    if (!selectedCourseId || !text) return;

    // Immediately clear input for smooth, lag-free typing
    setAdminChatMsg('');

    // Instant optimistic render in feed (0ms delay)
    const tempId = 'temp_admin_' + Date.now();
    const optimisticMsg: any = {
      _id: tempId,
      course: selectedCourseId,
      sender: 'admin',
      senderName: 'Admin / Instructor',
      senderRole: 'admin',
      message: text,
      createdAt: new Date().toISOString(),
    };
    setCourseChat((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollAdminChatToBottom(true), 20);

    try {
      const res = await apiRequest(`/admin/courses/${selectedCourseId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });

      if (res.success && res.data?.message) {
        setCourseChat((prev) => prev.map((m) => (m._id === tempId ? res.data.message : m)));
      }
    } catch (err) {
      console.error('Failed to post admin message:', err);
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

  // Course Hub Notice & Batch Info Handlers
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showAlert('Notice title and content are required.', 'error');
      return;
    }
    setSubmittingNotice(true);
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/notices`, {
      method: 'POST',
      body: JSON.stringify({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        date: noticeDate.trim(),
        isPinned: noticeIsPinned,
      }),
    });
    setSubmittingNotice(false);
    if (res.success) {
      showAlert('Notice published successfully to Course Hub & Landing Page Notice Board!');
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeDate('');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Failed to publish notice.', 'error');
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!selectedCourseId) return;
    if (!confirm('Are you sure you want to delete this notice?')) return;
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/notices/${noticeId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      showAlert('Notice deleted successfully.');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Failed to delete notice.', 'error');
    }
  };

  const handleTogglePinNotice = async (noticeId: string) => {
    if (!selectedCourseId) return;
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/notices/${noticeId}/pin`, {
      method: 'PUT',
    });
    if (res.success) {
      showAlert('Notice pin status toggled successfully.');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Failed to toggle notice pin status.', 'error');
    }
  };

  const handleUpdateBatchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSavingBatchInfo(true);
    const res = await apiRequest(`/admin/courses/${selectedCourseId}/batch-info`, {
      method: 'PUT',
      body: JSON.stringify({
        batchStartDate: batchStartDateInput.trim(),
        batchSchedule: batchScheduleInput.trim(),
      }),
    });
    setSavingBatchInfo(false);
    if (res.success) {
      showAlert('Batch start date and weekly class schedule updated successfully!');
      loadCourseHub(selectedCourseId);
    } else {
      showAlert(res.message || 'Failed to update batch schedule.', 'error');
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

  // 10. Update Site Settings (Individual Section or Master Save)
  const handleSaveSection = async (sectionKey: string, sectionTitle: string) => {
    if (!siteSettings) return;

    // Auto-format URLs if missing protocol
    const payload = { ...siteSettings };
    if (payload.demoClassLink && !/^https?:\/\//i.test(payload.demoClassLink.trim())) {
      payload.demoClassLink = `https://${payload.demoClassLink.trim()}`;
    }
    if (payload.demoVideoUrl && !/^https?:\/\//i.test(payload.demoVideoUrl.trim())) {
      payload.demoVideoUrl = `https://${payload.demoVideoUrl.trim()}`;
    }

    setSavingSection(sectionKey);
    const res = await apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setSavingSection(null);

    if (res.success) {
      showAlert(`✅ ${sectionTitle} updated and published live!`);
      if (res.data?.settings) {
        setSiteSettings(res.data.settings);
      }
    } else {
      showAlert(`❌ Error saving ${sectionTitle}: ${res.message || 'Please check connection.'}`, 'error');
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handleSaveSection('all', 'All settings & payment numbers');
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    const res = await apiRequest('/admin/test-email', {
      method: 'POST',
      body: JSON.stringify({ targetEmail: siteSettings?.contactEmail || 'admin.blueprintlearning@gmail.com' }),
    });
    setSendingTestEmail(false);
    if (res.success) {
      showAlert(res.message || '✅ Test email dispatched successfully via SMTP!');
    } else {
      showAlert(res.message || '❌ Failed to dispatch test email. Please check your SMTP settings.', 'error');
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
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <img
                src="/logo.png?v=6"
                alt="Blueprint Learning Academy"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-full shadow-xs group-hover:scale-105 transition"
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
        <div className="flex border-b border-slate-200 gap-2.5 overflow-x-auto pb-1.5">
          <button
            onClick={() => {
              setActiveMainTab('overview');
              setSelectedCourseId(null);
            }}
            className={`py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-extrabold rounded-xl transition whitespace-nowrap shadow-xs ${
              activeMainTab === 'overview'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            📊 Analytics &amp; Courses Overview
          </button>

          <button
            onClick={() => {
              setActiveMainTab('enrollments');
              setSelectedCourseId(null);
            }}
            className={`py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-extrabold rounded-xl transition whitespace-nowrap flex items-center gap-2 shadow-xs ${
              activeMainTab === 'enrollments'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            💳 Pending Enrollments
            {stats?.pendingEnrollments > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#ffb531] text-[#1a1100] text-xs font-black flex items-center justify-center">
                {stats.pendingEnrollments}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMainTab('cvs');
              setSelectedCourseId(null);
              loadStudentCvs();
            }}
            className={`py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-extrabold rounded-xl transition whitespace-nowrap flex items-center gap-2 shadow-xs ${
              activeMainTab === 'cvs'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            📄 Student CVs &amp; Resumes
            {allStudentCvs.length > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                {allStudentCvs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('settings')}
            className={`py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-extrabold rounded-xl transition whitespace-nowrap shadow-xs ${
              activeMainTab === 'settings'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'
            }`}
          >
            ⚙️ Payment &amp; Site Settings
          </button>

          <button
            onClick={() => setActiveMainTab('security')}
            className={`py-3 sm:py-3.5 px-5 text-xs sm:text-sm font-extrabold rounded-xl transition whitespace-nowrap flex items-center gap-2 shadow-xs ${
              activeMainTab === 'security'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 hover:text-slate-900 text-xs sm:text-sm font-extrabold transition shadow-sm self-start group"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition" />
                  <span>← Back to All Courses</span>
                </button>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-blue-700 font-extrabold bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full">
                    Course Workspace Mode: {selectedCourseData.title}
                  </span>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs sm:text-sm text-blue-700 font-bold uppercase tracking-wider">Currently Managing:</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">{selectedCourseData.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1">
                      Fee: BDT {selectedCourseData.price} | Duration: {selectedCourseData.durationDays} Days | Classes: {selectedCourseData.totalClasses}
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
                      <UserPlus className="w-3.5 h-3.5" /> + Add Student
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
                <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1.5 text-xs sm:text-sm">
                  <button
                    onClick={() => setCourseSubTab('students')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold transition flex items-center gap-2 ${
                      courseSubTab === 'students' ? 'bg-[#ffb531] text-[#1a1100] shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Enrolled Students &amp; Passwords ({courseStudents.length})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('videos')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold transition flex items-center gap-2 ${
                      courseSubTab === 'videos' ? 'bg-[#ffb531] text-[#1a1100] shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Push Video Links ({selectedCourseData.videos?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('live')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold transition flex items-center gap-2 ${
                      courseSubTab === 'live' ? 'bg-[#ffb531] text-[#1a1100] shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Live Class ({selectedCourseData.liveClasses?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('tasks')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold transition flex items-center gap-2 ${
                      courseSubTab === 'tasks' ? 'bg-[#ffb531] text-[#1a1100] shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Tasks &amp; Homework ({selectedCourseData.tasks?.length || 0})
                  </button>

                  <button
                    onClick={() => setCourseSubTab('chat')}
                    className={`py-2.5 px-4 rounded-xl font-extrabold transition flex items-center gap-2 ${
                      courseSubTab === 'chat' ? 'bg-[#ffb531] text-[#1a1100] shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Student Discussion Messenger
                    {courseChat.length > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-700 text-white text-[10px] font-black flex items-center justify-center">
                        {courseChat.length}
                      </span>
                    )}
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
                        <UserPlus className="w-4 h-4" /> Add New Student
                      </button>
                    </div>

                    {courseStudents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                        No students enrolled in this course yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-2xl overflow-hidden min-w-[720px]">
                          <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider border-b border-slate-200 text-xs sm:text-sm">
                            <tr>
                              <th className="p-3.5">Student Name</th>
                              <th className="p-3.5">Mobile</th>
                              <th className="p-3.5">Login Email</th>
                              <th className="p-3.5">Generated Password</th>
                              <th className="p-3.5">Task Progress</th>
                              <th className="p-3.5">CV / Resume</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {courseStudents.map((st) => (
                              <tr key={st._id} className="hover:bg-slate-50/80 transition">
                                <td className="p-3.5 font-black text-slate-950 text-sm sm:text-base">{st.name}</td>
                                <td className="p-3.5 font-mono font-semibold text-slate-700 text-xs sm:text-sm">{st.phone}</td>
                                <td className="p-3.5 font-mono font-bold text-blue-700 text-xs sm:text-sm">{st.email}</td>
                                <td className="p-3.5 font-mono font-black text-amber-950 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200 text-xs sm:text-sm">
                                  {st.plainPasswordForAdmin || 'Hidden (Hashed)'}
                                </td>
                                <td className="p-3.5">
                                  {(() => {
                                    const studentSubs = courseSubmissions.filter((sub) => sub.student === st._id || sub.studentEmail === st.email);
                                    const totalCourseTasks = selectedCourseData?.tasks?.length || 0;
                                    const enrolledItem = st.enrolledCourses?.find((e: any) => e.course === selectedCourseData?._id || e.course?._id === selectedCourseData?._id);
                                    const progress = enrolledItem?.progress ?? (totalCourseTasks > 0 ? Math.round((studentSubs.length / totalCourseTasks) * 100) : 0);
                                    return (
                                      <div className="space-y-1 min-w-[100px]">
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="font-extrabold text-xs text-slate-800">
                                            {studentSubs.length}/{totalCourseTasks} Tasks
                                          </span>
                                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                            {progress}%
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="p-3.5">
                                  {(() => {
                                    const atlasStudent = allStudentCvs.find((c) => c._id === st._id || c.email === st.email);
                                    const studentCv = atlasStudent?.cv?.updatedAt
                                      ? atlasStudent.cv
                                      : (st.cv?.updatedAt ? st.cv : null);

                                    if (studentCv?.updatedAt) {
                                      return (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setViewingStudentCv({ ...st, cv: studentCv });
                                              setAdminCvFeedback(studentCv.adminFeedback || '');
                                              setAdminCvStatus(studentCv.status || 'reviewed');
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs inline-flex items-center gap-1.5 transition shadow-xs hover:scale-105 cursor-pointer"
                                            title="Click to view CV and submit feedback"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-blue-600" /> View CV
                                          </button>
                                          <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase ${
                                            studentCv.status === 'reviewed'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : studentCv.status === 'needs_revision'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {studentCv.status || 'Sent'}
                                          </span>
                                        </div>
                                      );
                                    }

                                    return <span className="text-xs text-slate-400 italic font-medium">No CV</span>;
                                  })()}
                                </td>
                                <td className="p-3.5">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                      st.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : st.status === 'blocked'
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    {st.status.toUpperCase()}
                                  </span>
                                  {st.blockReason && (
                                    <span className="block text-xs font-medium text-red-600 mt-1 max-w-xs truncate">
                                      Reason: {st.blockReason}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right">
                                  {st.status === 'blocked' ? (
                                    <button
                                      onClick={() => handleUnblockUser(st._id, st.name, st.email)}
                                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold transition shadow-xs"
                                    >
                                      Unblock
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setBlockingUser(st)}
                                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded-lg text-xs font-extrabold transition"
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
                    {/* Course-Specific Demo Video Configuration Card */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/40 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <h4 className="text-xs sm:text-sm font-black text-amber-900 flex items-center gap-2">
                            <span>🎬 Public Demo Preview Video for this Course</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                              Homepage Carousel
                            </span>
                          </h4>
                        </div>
                        {courseDemoUrl && (
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            ✓ Demo Video Configured
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        ওয়েবসাইটের হোমপেজে <strong>&quot;ফ্রি ডেমো ক্লাস&quot;</strong> সেকশনে শিক্ষার্থীরা একটি প্রফেশনাল স্ক্রলযোগ্য লিস্ট থেকে এই কোর্সের নাম সিলেক্ট করলেই নিচের ভিডিওটি ডেমো হিসেবে দেখতে পাবে।
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-bold mb-1">
                            Demo Video YouTube Link / URL *
                          </label>
                          <input
                            type="text"
                            value={courseDemoUrl}
                            onChange={(e) => setCourseDemoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Demo Headline / Title (Optional)
                          </label>
                          <input
                            type="text"
                            value={courseDemoTitle}
                            onChange={(e) => setCourseDemoTitle(e.target.value)}
                            placeholder="e.g. সাইট এক্সিকিউশন ও বিওকিউ প্র্যাকটিক্যাল ডেমো ক্লাস"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Short Summary / Description (Optional)
                          </label>
                          <input
                            type="text"
                            value={courseDemoDescription}
                            onChange={(e) => setCourseDemoDescription(e.target.value)}
                            placeholder="e.g. বাস্তব প্রজেক্টের ড্রয়িং থেকে রড কাটিং ও ঢালাই চেকিং সেশন..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] text-slate-500">
                          {courseDemoUrl ? (
                            <a
                              href={courseDemoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>▶ Test Preview Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span>Tip: নিচে প্রকাশিত যেকোনো ক্লাসের পাশের ⭐ বাটনে ক্লিক করেও এই কোর্সের ডেমো বানাতে পারেন।</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveCourseDemoVideo()}
                          disabled={savingCourseDemo}
                          className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{savingCourseDemo ? 'Saving Demo...' : 'Save Course Demo Video'}</span>
                        </button>
                      </div>
                    </div>

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
                            type="text"
                            required
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
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
                      {selectedCourseData.videos?.map((vid) => {
                        const isCurrentDemo = courseDemoUrl && courseDemoUrl.trim() === vid.youtubeUrl.trim();
                        return (
                          <div
                            key={vid._id}
                            className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border ${
                              isCurrentDemo
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 block">{vid.title}</span>
                                {isCurrentDemo && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                    ★ Active Homepage Demo
                                  </span>
                                )}
                              </div>
                              <span className="text-blue-700 font-mono text-[11px] truncate max-w-sm block">
                                {vid.youtubeUrl}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-slate-600 text-[11px]">{vid.duration}</span>
                              <button
                                type="button"
                                onClick={() => handleSetVideoAsDemo(vid)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                  isCurrentDemo
                                    ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                                title="Set this video as the homepage demo preview for this course"
                              >
                                <span>⭐</span>
                                <span>{isCurrentDemo ? 'Reset as Demo' : 'Set as Course Demo'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
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

                {/* HUB TAB 5: MESSENGER - REAL-TIME STUDENT CHAT */}
                {courseSubTab === 'chat' && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[620px]">
                    {/* LEFT SIDEBAR: STUDENTS OF THIS COURSE (MESSENGER INBOX LIST) */}
                    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col h-64 md:h-auto shrink-0">
                      {/* Search & Header */}
                      <div className="p-3.5 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-700" /> Course Messenger
                          </h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                            {courseStudents.length} Students
                          </span>
                        </div>
                        <input
                          type="text"
                          value={chatStudentSearch}
                          onChange={(e) => setChatStudentSearch(e.target.value)}
                          placeholder="Search student by name/ID..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-600"
                        />
                      </div>

                      {/* Student Conversations List */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {/* Option 1: View Entire Course Room (All Messages) */}
                        <button
                          type="button"
                          onClick={() => setSelectedChatStudentId(null)}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 border ${
                            selectedChatStudentId === null
                              ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              selectedChatStudentId === null ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            👥
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-black truncate">Entire Course Room</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  selectedChatStudentId === null ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {courseChat.length}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] truncate ${
                                selectedChatStudentId === null ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              All discussion in this course
                            </p>
                          </div>
                        </button>

                        <div className="pt-1.5 pb-0.5 px-1 flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                          <span>Individual Students</span>
                          <span>Last Activity</span>
                        </div>

                        {/* List of enrolled students in this course */}
                        {(() => {
                          const filtered = courseStudents.filter((st: any) => {
                            if (!chatStudentSearch.trim()) return true;
                            const q = chatStudentSearch.toLowerCase();
                            return (
                              st.name?.toLowerCase().includes(q) ||
                              st.email?.toLowerCase().includes(q) ||
                              st.studentId?.toLowerCase().includes(q)
                            );
                          });

                          // Sort: Students with messages or recent messages first
                          const sorted = [...filtered].sort((a: any, b: any) => {
                            const aMsgs = courseChat.filter(
                              (m: any) => m.sender === a._id || m.senderName === a.name
                            );
                            const bMsgs = courseChat.filter(
                              (m: any) => m.sender === b._id || m.senderName === b.name
                            );
                            const aLast = aMsgs[aMsgs.length - 1];
                            const bLast = bMsgs[bMsgs.length - 1];
                            const aTime = aLast ? new Date(aLast.createdAt).getTime() : 0;
                            const bTime = bLast ? new Date(bLast.createdAt).getTime() : 0;
                            return bTime - aTime;
                          });

                          if (sorted.length === 0) {
                            return (
                              <p className="text-[11px] text-slate-400 text-center py-6">
                                No students found.
                              </p>
                            );
                          }

                          return sorted.map((st: any) => {
                            const isSelected = selectedChatStudentId === st._id;
                            
                            // Accurate unreplied detection: check if student sent a message after the last admin message
                            let lastStudentIdx = -1;
                            for (let i = courseChat.length - 1; i >= 0; i--) {
                              const m = courseChat[i];
                              if (m.sender === st._id || m.senderName === st.name) {
                                lastStudentIdx = i;
                                break;
                              }
                            }

                            let hasAdminRepliedAfter = false;
                            if (lastStudentIdx !== -1) {
                              for (let i = lastStudentIdx + 1; i < courseChat.length; i++) {
                                if (courseChat[i].senderRole === 'admin') {
                                  hasAdminRepliedAfter = true;
                                  break;
                                }
                              }
                            }

                            const hasStudentUnreplied = lastStudentIdx !== -1 && !hasAdminRepliedAfter;
                            const studentLatestMsg = lastStudentIdx !== -1 ? courseChat[lastStudentIdx] : null;
                            const studentMsgCount = courseChat.filter((m: any) => m.sender === st._id || m.senderName === st.name).length;

                            return (
                              <button
                                key={st._id}
                                type="button"
                                onClick={() => setSelectedChatStudentId(st._id)}
                                className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : hasStudentUnreplied
                                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs uppercase ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                    }`}
                                  >
                                    {st.name?.charAt(0) || 'S'}
                                  </div>
                                  {hasStudentUnreplied && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold truncate">{st.name}</span>
                                    {studentLatestMsg && (
                                      <span
                                        className={`text-[9px] shrink-0 ${
                                          isSelected ? 'text-blue-100' : 'text-slate-400'
                                        }`}
                                      >
                                        {new Date(studentLatestMsg.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-1 mt-0.5">
                                    <p
                                      className={`text-[11px] truncate ${
                                        isSelected
                                          ? 'text-blue-100'
                                          : hasStudentUnreplied
                                          ? 'text-red-700 font-bold'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {studentLatestMsg ? studentLatestMsg.message : (st.studentId || st.email)}
                                    </p>
                                    {hasStudentUnreplied && (
                                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white shrink-0">
                                        Waiting
                                      </span>
                                    )}
                                    {studentMsgCount > 0 && !hasStudentUnreplied && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                          isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {studentMsgCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* RIGHT PANEL: LIVE MESSENGER CHAT WINDOW */}
                    <div className="flex-1 flex flex-col bg-slate-100/70 overflow-hidden">
                      {/* Messenger Top Header */}
                      {(() => {
                        const targetStudent = selectedChatStudentId
                          ? courseStudents.find((s: any) => s._id === selectedChatStudentId)
                          : null;

                        return (
                          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {targetStudent ? (targetStudent.name?.charAt(0) || 'S') : '👥'}
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                                  {targetStudent ? targetStudent.name : 'Entire Course Group Room'}
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live (2s)
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {targetStudent
                                    ? `ID: ${targetStudent.studentId || 'N/A'} • ${targetStudent.email}`
                                    : `Discussion room for "${selectedCourseData?.title}" • ${courseChat.length} messages`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Direct View CV Button in Chat Header */}
                              {targetStudent && (() => {
                                const studentCvData = targetStudent.cv?.updatedAt
                                  ? targetStudent.cv
                                  : allStudentCvs.find((s) => s._id === targetStudent._id || s.email === targetStudent.email)?.cv;

                                if (studentCvData?.updatedAt) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingStudentCv({ ...targetStudent, cv: studentCvData });
                                        setAdminCvFeedback(studentCvData.adminFeedback || '');
                                        setAdminCvStatus(studentCvData.status || 'reviewed');
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition hover:scale-105"
                                      title="View student submitted CV & feedback"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                                      <span>📄 View CV</span>
                                    </button>
                                  );
                                }
                                return null;
                              })()}

                              <button
                                type="button"
                                onClick={async () => {
                                  if (!selectedCourseId) return;
                                  const res = await apiRequest(`/admin/courses/${selectedCourseId}/chat`);
                                  if (res.success && res.data?.messages) {
                                    setCourseChat(res.data.messages);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Sync
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Messenger Feed with safe up-scroll detection */}
                      <div
                        ref={courseChatContainerRef}
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
                          isUserScrolledUpAdminRef.current = isUp;
                        }}
                        className="flex-1 p-4 overflow-y-auto space-y-3"
                      >
                        {(() => {
                          const targetStudent = selectedChatStudentId
                            ? courseStudents.find((s: any) => s._id === selectedChatStudentId)
                            : null;

                          const displayMessages = targetStudent
                            ? courseChat.filter(
                                (m: any) =>
                                  m.senderRole === 'admin' ||
                                  m.sender === targetStudent._id ||
                                  m.senderName === targetStudent.name
                              )
                            : courseChat;

                          if (displayMessages.length === 0) {
                            return (
                              <div className="text-center py-16 space-y-2">
                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs font-bold text-slate-700">No messages yet.</p>
                                <p className="text-[11px] text-slate-500">
                                  {targetStudent
                                    ? `Send a message below to chat with ${targetStudent.name}!`
                                    : 'Send a message below to broadcast to all students in this course!'}
                                </p>
                              </div>
                            );
                          }

                          return displayMessages.map((msg: any, idx: number) => {
                            const isAdmin = msg.senderRole === 'admin';

                            // Date Divider calculation
                            const msgDateStr = msg.createdAt ? new Date(msg.createdAt).toDateString() : '';
                            const prevDateStr = idx > 0 && displayMessages[idx - 1]?.createdAt
                              ? new Date(displayMessages[idx - 1].createdAt).toDateString()
                              : '';
                            const showDateDivider = msgDateStr && msgDateStr !== prevDateStr;

                            // Student CV quick access
                            const studentCv = !isAdmin
                              ? allStudentCvs.find((s) => s._id === msg.sender || s.email === msg.sender || s.name === msg.senderName)?.cv ||
                                courseStudents.find((s: any) => s._id === msg.sender || s.name === msg.senderName)?.cv
                              : null;

                            return (
                              <div key={idx} className="space-y-1">
                                {showDateDivider && (
                                  <div className="flex items-center justify-center my-3">
                                    <span className="px-3 py-1 bg-slate-200/90 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                      {(() => {
                                        const d = new Date(msg.createdAt);
                                        const today = new Date();
                                        if (d.toDateString() === today.toDateString()) return 'Today';
                                        const yesterday = new Date();
                                        yesterday.setDate(today.getDate() - 1);
                                        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                        return d.toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        });
                                      })()}
                                    </span>
                                  </div>
                                )}

                                <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-semibold text-slate-500">
                                    <strong
                                      onClick={() => {
                                        if (!isAdmin) {
                                          const matched = courseStudents.find(
                                            (s: any) => s._id === msg.sender || s.name === msg.senderName
                                          );
                                          if (matched) setSelectedChatStudentId(matched._id);
                                        }
                                      }}
                                      className={`${isAdmin ? 'text-blue-800' : 'text-slate-800 hover:text-blue-600 cursor-pointer'}`}
                                    >
                                      {isAdmin ? 'Admin / Instructor' : msg.senderName}
                                    </strong>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                        isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                                      }`}
                                    >
                                      {msg.senderRole}
                                    </span>
                                    {studentCv?.updatedAt && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const studentObj =
                                            allStudentCvs.find((s) => s._id === msg.sender || s.email === msg.sender || s.name === msg.senderName) ||
                                            courseStudents.find((s: any) => s._id === msg.sender || s.name === msg.senderName);
                                          if (studentObj) {
                                            setViewingStudentCv({ ...studentObj, cv: studentCv });
                                            setAdminCvFeedback(studentCv.adminFeedback || '');
                                            setAdminCvStatus(studentCv.status || 'reviewed');
                                          }
                                        }}
                                        className="px-1.5 py-0.2 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-black text-[9px] flex items-center gap-0.5 cursor-pointer shadow-2xs hover:scale-105 transition"
                                        title="View student submitted CV"
                                      >
                                        <FileText className="w-2.5 h-2.5 text-amber-600" /> CV
                                      </button>
                                    )}
                                    <span className="text-slate-400 text-[9px]">
                                      {msg.createdAt
                                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </span>
                                  </div>

                                  <div
                                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs ${
                                      isAdmin
                                        ? 'bg-blue-600 text-white rounded-br-xs'
                                        : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                                    }`}
                                  >
                                    {msg.message}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                        <div ref={courseChatBottomRef} />
                      </div>

                      {/* Messenger Input Box */}
                      <form onSubmit={handleSendAdminChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input
                          type="text"
                          value={adminChatMsg}
                          onChange={(e) => setAdminChatMsg(e.target.value)}
                          placeholder={
                            selectedChatStudentId
                              ? `Type message to ${courseStudents.find((s: any) => s._id === selectedChatStudentId)?.name || 'student'}... (Enter to send)`
                              : 'Type message to all students in this course... (Enter to send)'
                          }
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        />
                        <button
                          type="submit"
                          disabled={!adminChatMsg.trim()}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* OVERVIEW & ALL COURSES LIST */
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Total Enrolled Students</span>
                <p className="text-3xl sm:text-4xl font-black text-slate-950 flex items-center gap-2.5">
                  <Users className="w-7 h-7 text-blue-700" />
                  {stats?.totalStudents || 0}
                </p>
                <span className="text-xs sm:text-sm font-semibold text-emerald-600 block">Verified learners across batches</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Total Verified Revenue</span>
                <p className="text-3xl sm:text-4xl font-black text-amber-600 flex items-center gap-2.5">
                  BDT {(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 block">From confirmed bKash/Nagad payments</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Pending Verification</span>
                <p className="text-3xl sm:text-4xl font-black text-amber-500 flex items-center gap-2.5">
                  {stats?.pendingEnrollments || 0}
                </p>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 block">TrxID submissions awaiting approval</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Active Courses</span>
                <p className="text-3xl sm:text-4xl font-black text-emerald-600 flex items-center gap-2.5">
                  <BookOpen className="w-7 h-7 text-emerald-600" />
                  {coursesList.length}
                </p>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Published on academy catalog</span>
              </div>
            </div>

            {/* COURSE BUTTONS SECTION (Requirement 1: 'end jei koita course create koreche seigular button hisabe thakbe') */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950">Course Management Buttons</h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Click any course button below to open its dedicated hub (add videos, schedule live classes, view enrolled students &amp; login credentials, or chat).
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateCourseModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shrink-0 transition hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" /> Create New Course
                </button>
              </div>

              {/* The Course Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {coursesList.map((c) => {
                  const isSelected = selectedCourseId === c._id;

                  return (
                    <button
                      key={c._id}
                      onClick={() => loadCourseHub(c._id)}
                      className={`text-left p-5 rounded-2xl border-2 transition flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'bg-slate-50 border-[#ffb531] shadow-xl shadow-[#ffb531]/10'
                          : 'bg-white border-slate-200 hover:border-blue-500/50 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                          <span className="text-amber-600 font-black">BDT {c.price.toLocaleString()}</span>
                          <span className="text-blue-700 font-extrabold">{c.durationDays} Days</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-950 line-clamp-1">{c.title}</h3>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-semibold pt-3 border-t border-slate-200">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Users className="w-4 h-4 text-emerald-600" /> {c.studentCount} Students
                        </span>
                        {c.pendingCount > 0 && (
                          <span className="text-amber-600 font-black">({c.pendingCount} Pending)</span>
                        )}
                        <span className={`text-xs font-black ${isSelected ? 'text-amber-600' : 'text-blue-700'}`}>
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
                <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-2xl overflow-hidden min-w-[850px]">
                  <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider border-b border-slate-200 text-xs sm:text-sm">
                    <tr>
                      <th className="p-3.5">Applicant Name</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Course</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Sender Mobile</th>
                      <th className="p-3.5">Transaction ID (TrxID)</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {enrollments.map((en) => (
                      <tr key={en._id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-black text-slate-950 text-sm sm:text-base">
                          <div className="flex items-center gap-2">
                            <span>{en.studentName}</span>
                            {en.studentId && (
                              <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-950 font-mono text-[11px] font-black rounded-md">
                                {en.studentId}
                              </span>
                            )}
                          </div>
                          <span className="block text-xs font-semibold text-slate-500 mt-0.5">{en.studentAddress}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="block font-mono font-semibold text-slate-700 text-xs sm:text-sm">{en.studentPhone}</span>
                          <span className="block font-mono font-bold text-blue-700 text-xs sm:text-sm">{en.studentEmail}</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 max-w-xs text-xs sm:text-sm">{en.courseTitle}</td>
                        <td className="p-3.5 font-extrabold text-slate-800 text-xs sm:text-sm">{en.paymentMethod}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 text-xs sm:text-sm">{en.senderNumber}</td>
                        <td className="p-3.5 font-mono font-black text-amber-950 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200 text-xs sm:text-sm">
                          {en.transactionId}
                        </td>
                        <td className="p-3.5 font-black text-emerald-700 text-sm sm:text-base">BDT {en.amount.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                              en.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : en.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {en.status.toUpperCase()}
                          </span>
                          {en.generatedPassword && (
                            <span className="block text-xs text-slate-600 font-mono font-bold mt-1">
                              Pass: {en.generatedPassword}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {en.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveEnrollment(en._id, en)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition"
                              >
                                Approve &amp; Send Email
                              </button>
                              <button
                                onClick={() => handleRejectEnrollment(en._id)}
                                className="px-3.5 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm font-bold transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : en.status === 'approved' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleResendCredentialsEmail(en)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                title="Resend Welcome & Login Credentials Email"
                              >
                                <Mail className="w-3.5 h-3.5" /> Resend Email
                              </button>
                            </div>
                          ) : null}
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
            TAB: STUDENT CVS & RESUME PLACEMENTS
        ======================================================== */}
        {activeMainTab === 'cvs' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" /> Student CVs &amp; Job Placement Submissions
                </h2>
                <p className="text-xs text-slate-600">
                  Review student resumes, download PDFs, open Google Drive links, and provide instructor feedback or developer placement recommendations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadStudentCvs}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cvLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cvSearchQuery}
                  onChange={(e) => setCvSearchQuery(e.target.value)}
                  placeholder="Search by student name, email, or job role..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-slate-500 font-semibold shrink-0 mr-1">Status:</span>
                {(['all', 'submitted', 'reviewed', 'needs_revision'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCvStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] capitalize transition ${
                      cvStatusFilter === st
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'needs_revision' ? 'Needs Revision' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* CVs Table */}
            {(() => {
              const filteredCvs = allStudentCvs.filter((s) => {
                const query = cvSearchQuery.toLowerCase();
                const matchesQuery =
                  !query ||
                  s.name?.toLowerCase().includes(query) ||
                  s.email?.toLowerCase().includes(query) ||
                  s.phone?.includes(query) ||
                  s.cv?.targetJobTitle?.toLowerCase().includes(query) ||
                  s.cv?.fileName?.toLowerCase().includes(query);

                const matchesStatus =
                  cvStatusFilter === 'all' || (s.cv?.status || 'submitted') === cvStatusFilter;

                return matchesQuery && matchesStatus;
              });

              if (filteredCvs.length === 0) {
                return (
                  <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    No student CVs match the selected criteria.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-2xl overflow-hidden min-w-[760px]">
                    <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider border-b border-slate-200 text-xs sm:text-sm">
                      <tr>
                        <th className="p-3.5">Student &amp; Contact</th>
                        <th className="p-3.5">Target Job Track</th>
                        <th className="p-3.5">Enrolled Courses</th>
                        <th className="p-3.5">Submitted CV File / URL</th>
                        <th className="p-3.5">Submission Date</th>
                        <th className="p-3.5">Review Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredCvs.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <span className="font-black text-slate-950 block text-sm sm:text-base">{s.name}</span>
                            <span className="font-mono font-semibold text-slate-700 block text-xs sm:text-sm mt-0.5">{s.phone}</span>
                            <span className="font-mono font-bold text-blue-700 block text-xs sm:text-sm">{s.email}</span>
                          </td>

                          <td className="p-3.5 font-bold text-slate-900 text-xs sm:text-sm">
                            {s.cv?.targetJobTitle || 'Civil Engineer'}
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <div className="flex flex-wrap gap-1.5">
                              {s.enrolledCourses?.map((ec: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold truncate max-w-[160px]"
                                  title={ec.course?.title}
                                >
                                  {ec.course?.title || 'Enrolled'}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {s.cv?.fileData || s.cv?.hasFileData ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (s.cv?.fileData) {
                                    const a = document.createElement('a');
                                    a.href = s.cv.fileData;
                                    a.download = s.cv.fileName || `${s.name}_CV.pdf`;
                                    a.click();
                                  } else {
                                    const res = await apiRequest(`/admin/cvs/${s._id}/file`);
                                    if (res.success && res.data?.fileData) {
                                      const a = document.createElement('a');
                                      a.href = res.data.fileData;
                                      a.download = res.data.fileName || `${s.name}_CV.pdf`;
                                      a.click();
                                    } else {
                                      showAlert('File download error', 'error');
                                    }
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                              >
                                <Download className="w-4 h-4 text-emerald-600" /> Download ({s.cv?.fileName || 'CV.pdf'})
                              </button>
                            ) : s.cv?.fileUrl ? (
                              <a
                                href={s.cv.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-xs sm:text-sm transition shadow-xs"
                              >
                                <ExternalLink className="w-4 h-4 text-blue-600" /> Open Drive Link
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-medium">No file attached</span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap text-xs sm:text-sm">
                            {s.cv?.updatedAt
                              ? new Date(s.cv.updatedAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full font-black text-xs uppercase ${
                                s.cv?.status === 'reviewed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : s.cv?.status === 'needs_revision'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {s.cv?.status || 'Submitted'}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setViewingStudentCv(s);
                                setAdminCvFeedback(s.cv?.adminFeedback || '');
                                setAdminCvStatus(s.cv?.status || 'reviewed');
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black transition shadow-sm text-xs sm:text-sm"
                            >
                              Review &amp; Feedback
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================
            TAB 3: SITE SETTINGS & PAYMENT NUMBERS
        ======================================================== */}
        {activeMainTab === 'settings' && siteSettings && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-amber-500" /> Homepage Content, Instructor Profile &amp; Gateway Settings
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  You can edit and save each section independently below, or click master save to save all changes at once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveSection('all', 'All settings & payment numbers')}
                disabled={savingSection === 'all'}
                className="px-6 py-3 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition shrink-0 hover:scale-105 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSection === 'all' ? 'Saving All...' : 'Save All Settings (Master)'}</span>
              </button>
            </div>

            {/* SECTION 1: INSTRUCTOR NAME, PHOTO & PROFILE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <h3 className="text-base sm:text-lg font-black text-amber-600 flex items-center gap-2 border-b border-slate-200 pb-3">
                👨‍🏫 Lead Instructor Name, Photo &amp; Qualifications
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
                    📁 Change Photo
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
                      Instructor Full Name *
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
                      Degree &amp; University *
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
                      Full Experience Label
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
                      Short Experience Badge
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
                      Instructor Image URL
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
                      Detailed Bio / Mission Paragraph
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
                  <label className="block text-amber-400 font-bold">Feature 1: Title &amp; Description</label>
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
                  <label className="block text-emerald-400 font-bold">Feature 2: Title &amp; Description</label>
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

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveSection('instructor', 'Instructor Profile')}
                  disabled={savingSection === 'instructor'}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'instructor' ? 'Saving Profile...' : 'Save Instructor Profile'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: HOMEPAGE STATS COUNTERS & TOP BADGE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-blue-700 flex items-center gap-2 border-b border-slate-200 pb-3">
                📊 Homepage Badges &amp; Stat Numbers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Total Courses Count</label>
                  <input
                    type="text"
                    value={siteSettings.statsCourses || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsCourses: e.target.value })}
                    placeholder="6+"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Experience Stat</label>
                  <input
                    type="text"
                    value={siteSettings.statsExperience || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsExperience: e.target.value })}
                    placeholder="10+ Yrs"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Mentor Institution</label>
                  <input
                    type="text"
                    value={siteSettings.statsMentorTag || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, statsMentorTag: e.target.value })}
                    placeholder="BUET"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Top Hero Badge Text</label>
                  <input
                    type="text"
                    value={siteSettings.heroBadgeText || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBadgeText: e.target.value })}
                    placeholder="Bangladesh's #1 Practical Civil Engineering Academy"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('stats', 'Stats & Badges')}
                  disabled={savingSection === 'stats'}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'stats' ? 'Saving Stats...' : 'Save Stats & Badges'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: WEBSITE BRANDING & HEADLINES */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-200 pb-3">
                🌐 Academy Branding &amp; Hero Headline Content
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Academy / Platform Name</label>
                  <input
                    type="text"
                    value={siteSettings.siteName || 'Blueprint Learning Academy'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Hero Tagline Sub-banner Note</label>
                  <input
                    type="text"
                    value={siteSettings.heroBengaliNote || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBengaliNote: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1.5 font-bold">Hero Main Headline Title</label>
                  <input
                    type="text"
                    value={siteSettings.heroTitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1.5 font-bold">Hero Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={siteSettings.heroSubtitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('branding', 'Branding & Headlines')}
                  disabled={savingSection === 'branding'}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'branding' ? 'Saving Branding...' : 'Save Branding & Headlines'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 4: CONTACT, PHONE, WHATSAPP, EMAIL */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-amber-600 flex items-center gap-2 border-b border-slate-200 pb-3">
                📞 Official Helpline &amp; WhatsApp Numbers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    Contact Helpline Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.contactPhone || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-blue-700 font-semibold mt-1 block">Appears in header, footer &amp; direct calling</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    WhatsApp Number (with country code e.g. 880) *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteSettings.whatsappNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                    placeholder="88013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Used for direct WhatsApp chat button links</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    Official Support Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={siteSettings.contactEmail || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                    placeholder="info@blueprintlearningacademy.com"
                    className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-blue-700 font-semibold mt-1 block">Displayed in contact links &amp; email notifications</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('contact', 'Helpline & WhatsApp')}
                  disabled={savingSection === 'contact'}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'contact' ? 'Saving Contact...' : 'Save Helpline & Contact'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 5: BKASH & NAGAD PAYMENT GATEWAY */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-base sm:text-lg font-black text-emerald-700 flex items-center gap-2 border-b border-slate-200 pb-3">
                💳 bKash, Nagad &amp; Rocket Payment Numbers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">bKash Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.bkashNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <input
                    type="text"
                    value={siteSettings.bkashType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bkashType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Nagad Number *</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.nagadNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadNumber: e.target.value })}
                    placeholder="013XXXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <input
                    type="text"
                    value={siteSettings.nagadType || 'Personal (Send Money)'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, nagadType: e.target.value })}
                    placeholder="Type e.g. Personal (Send Money)"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Rocket Number</label>
                  <input
                    type="text"
                    value={siteSettings.rocketNumber || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, rocketNumber: e.target.value })}
                    placeholder="013XXXXXXXX-X"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-2 block">Optional alternative payment account</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('payment', 'Payment Gateway Numbers')}
                  disabled={savingSection === 'payment'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'payment' ? 'Saving Numbers...' : 'Save Payment Numbers'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 6: EMAIL & SMTP DISPATCH GATEWAY (BREVO & GMAIL) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-sky-700 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-sky-600" /> Brevo &amp; Gmail SMTP Email System
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Automatically sends student login credentials and WhatsApp links when you approve payments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition hover:scale-105 disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingTestEmail ? 'Sending Test...' : 'Send Live Test Email'}</span>
                </button>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl mb-4">
                <label className="block text-blue-950 mb-1.5 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Brevo v3 API Key (Recommended for Render Cloud &mdash; Port 443 HTTPS)
                </label>
                <input
                  type="password"
                  value={siteSettings.brevoApiKey || ''}
                  onChange={(e) => setSiteSettings({ ...siteSettings, brevoApiKey: e.target.value })}
                  placeholder="xkeysib-..."
                  className="w-full bg-white border border-blue-300 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-950 outline-none font-medium font-mono text-xs sm:text-sm"
                />
                <span className="text-[11px] text-blue-700 mt-1 block">
                  Generate from Brevo Dashboard &rarr; <strong>SMTP &amp; API</strong> &rarr; <strong>API Keys</strong> &rarr; <strong>+ Generate a new API key</strong>. Works 100% on Render cloud without SMTP port restrictions.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">SMTP Server Host</label>
                  <input
                    type="text"
                    value={siteSettings.smtpHost || 'smtp-relay.brevo.com'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smtpHost: e.target.value })}
                    placeholder="smtp-relay.brevo.com"
                    className="w-full bg-white border border-slate-200 focus:border-sky-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default: smtp-relay.brevo.com</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">SMTP Port</label>
                  <input
                    type="number"
                    value={siteSettings.smtpPort || 587}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smtpPort: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full bg-white border border-slate-200 focus:border-sky-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Port: 587 (TLS)</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Brevo SMTP Login Email</label>
                  <input
                    type="text"
                    value={siteSettings.smtpUser || 'c0c2b6001@smtp-brevo.com'}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smtpUser: e.target.value })}
                    placeholder="c0c2b6001@smtp-brevo.com"
                    className="w-full bg-white border border-slate-200 focus:border-sky-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Your Brevo Login</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">Brevo SMTP Key (Password)</label>
                  <input
                    type="password"
                    value={siteSettings.smtpPass || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, smtpPass: e.target.value })}
                    placeholder="xsmtpsib-..."
                    className="w-full bg-white border border-slate-200 focus:border-sky-600 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Master Brevo Key</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('email', 'Email & SMTP Settings')}
                  disabled={savingSection === 'email'}
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'email' ? 'Saving Email Settings...' : 'Save Email & SMTP Settings'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 7: DEMO CLASS & RECORDED VIDEO SETTINGS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <h3 className="text-base sm:text-lg font-black text-rose-600 flex items-center gap-2">
                  🎥 Free Demo Class &amp; Recorded Video Preview (Home Page)
                </h3>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={siteSettings.demoSectionEnabled !== false}
                    onChange={(e) => setSiteSettings({ ...siteSettings, demoSectionEnabled: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-xs font-black text-slate-800">
                    {siteSettings.demoSectionEnabled !== false ? '✅ Section Active on Home Page' : '❌ Section Hidden'}
                  </span>
                </label>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    Section Main Heading (Bengali/English)
                  </label>
                  <input
                    type="text"
                    value={siteSettings.demoClassTitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, demoClassTitle: e.target.value })}
                    placeholder="ফ্রি লাইভ ডেমো ক্লাস ও প্র্যাকটিক্যাল ভিডিও প্রিভিউ"
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    Section Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={siteSettings.demoClassSubtitle || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, demoClassSubtitle: e.target.value })}
                    placeholder="কোর্সে ভর্তি হওয়ার আগেই আমাদের টিচিং কোয়ালিটি ও রিয়েল প্রজেক্ট সাইট সেশন দেখে নিন।"
                    className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Live Demo Class Box (Meeting Link & Schedule) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block">
                  🔴 Live Demo Class Settings (Meeting Link &amp; Schedule)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">
                      Live Class Meeting URL (Google Meet / Zoom) *
                    </label>
                    <input
                      type="text"
                      value={siteSettings.demoClassLink || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, demoClassLink: e.target.value })}
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                    />
                    <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
                      Students will open this link directly to join live.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">
                      Live Class Date &amp; Time Text
                    </label>
                    <input
                      type="text"
                      value={siteSettings.demoClassDateText || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, demoClassDateText: e.target.value })}
                      placeholder="প্রতি শুক্রবার রাত ৯:০০ টা (সরাসরি গুগল মিট)"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                    />
                    <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                      Displayed on the schedule card on home page.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">
                      Join Button Text
                    </label>
                    <input
                      type="text"
                      value={siteSettings.demoClassBtnText || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, demoClassBtnText: e.target.value })}
                      placeholder="লাইভ ডেমো ক্লাসে যোগ দিন"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                    />
                    <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                      Label on the main CTA button.
                    </span>
                  </div>
                </div>
              </div>

              {/* Demo Recorded Video Settings */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 inline-block">
                  📹 Recorded Demo Video Settings (YouTube or Direct Video)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">
                      Recorded Demo Video URL (YouTube / Vimeo / MP4) *
                    </label>
                    <input
                      type="text"
                      value={siteSettings.demoVideoUrl || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, demoVideoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                    />
                    <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                      Supports YouTube Watch links, youtu.be, Shorts, or Vimeo.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">
                      Recorded Video Title
                    </label>
                    <input
                      type="text"
                      value={siteSettings.demoVideoTitle || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, demoVideoTitle: e.target.value })}
                      placeholder="সাইট এক্সিকিউশন ও বিওকিউ (BOQ) প্র্যাকটিক্যাল ডেমো ক্লাস"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold text-xs sm:text-sm">
                    Recorded Video Description
                  </label>
                  <textarea
                    rows={2}
                    value={siteSettings.demoVideoDescription || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, demoVideoDescription: e.target.value })}
                    placeholder="বাস্তব প্রজেক্টের আর্কিটেকচারাল ও স্ট্রাকচারাল ড্রয়িং থেকে কাস্টিং ও সাইট ম্যানেজমেন্টের বাস্তব সেশন দেখুন।"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-4 py-2.5 text-slate-900 outline-none font-medium text-xs sm:text-sm resize-none"
                  />
                </div>

                {/* Instant Video Player Preview inside Admin */}
                {siteSettings.demoVideoUrl && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-500 block mb-2">Live Player Preview:</span>
                    <div className="max-w-md aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md">
                      {(() => {
                        const trimmed = (siteSettings.demoVideoUrl || '').trim();
                        let embed = trimmed;
                        const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
                        if (ytMatch && ytMatch[1]) {
                          embed = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
                          return (
                            <iframe
                              src={embed}
                              title="Demo Video Preview"
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-4 text-center">
                            Video will render on Home Page ({trimmed})
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Section Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection('demo', 'Demo Class & Video Preview')}
                  disabled={savingSection === 'demo'}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSection === 'demo' ? 'Saving Demo Settings...' : 'Save Demo Class & Video Settings'}</span>
                </button>
              </div>
            </div>

            {/* MASTER SAVE BUTTON AT BOTTOM */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Want to publish all updated sections simultaneously? Use Master Save.
              </span>
              <button
                type="button"
                onClick={() => handleSaveSection('all', 'All settings & payment numbers')}
                disabled={savingSection === 'all'}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition hover:scale-105 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSection === 'all' ? 'Saving All...' : 'Save All Changes (Master Save)'}</span>
              </button>
            </div>
          </div>
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
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
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
                  Add New Administrator
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
            <h3 className="text-xl font-black text-slate-950">Create New Engineering Course</h3>
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
                  <label className="block text-slate-600 mb-1">Offer Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Regular Price (BDT)</label>
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
                  Reason for Suspension *
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
                  disabled={blockingLoading}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold shadow flex items-center gap-1.5"
                >
                  {blockingLoading ? 'Sending Notice Email...' : 'Confirm & Send Block Email'}
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
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" /> Manually Add Student to Course
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
                  Student Full Name *
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
                    Mobile Number *
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
                    Login Email *
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
                    Login Password
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
                  Address / City (Optional)
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

      {/* STUDENT CV REVIEW MODAL */}
      {viewingStudentCv && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" /> Review Student CV / Resume
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Candidate: <strong className="text-slate-900">{viewingStudentCv.name}</strong> ({viewingStudentCv.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudentCv(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Candidate Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Mobile Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingStudentCv.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Job Track:</span>
                  <span className="font-bold text-blue-700">{viewingStudentCv.cv?.targetJobTitle || 'Civil Engineer'}</span>
                </div>
              </div>

              {viewingStudentCv.cv?.note && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block font-semibold mb-0.5">Candidate Career Note:</span>
                  <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                    {viewingStudentCv.cv.note}
                  </p>
                </div>
              )}

              {/* Download / Open File Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {(viewingStudentCv.cv?.fileData || viewingStudentCv.cv?.hasFileData) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (viewingStudentCv.cv?.fileData) {
                        const a = document.createElement('a');
                        a.href = viewingStudentCv.cv.fileData;
                        a.download = viewingStudentCv.cv.fileName || `${viewingStudentCv.name}_CV.pdf`;
                        a.click();
                      } else {
                        const res = await apiRequest(`/admin/cvs/${viewingStudentCv._id}/file`);
                        if (res.success && res.data?.fileData) {
                          const a = document.createElement('a');
                          a.href = res.data.fileData;
                          a.download = res.data.fileName || `${viewingStudentCv.name}_CV.pdf`;
                          a.click();
                        } else {
                          showAlert('File data not available or already expired.', 'error');
                        }
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-xs transition text-xs sm:text-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download CV ({viewingStudentCv.cv?.fileName || 'PDF/DOC'})
                  </button>
                )}
                {viewingStudentCv.cv?.fileUrl && (
                  <a
                    href={viewingStudentCv.cv.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-center flex items-center justify-center gap-2 shadow-xs transition text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Portfolio / Cloud Link
                  </a>
                )}
              </div>
            </div>

            {/* Admin Feedback & Status Form */}
            <form onSubmit={handleSaveCvFeedback} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Review Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'submitted', label: 'Under Review' },
                    { id: 'reviewed', label: 'Approved / Ready' },
                    { id: 'needs_revision', label: 'Needs Revision' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setAdminCvStatus(item.id as any)}
                      className={`py-2 px-2.5 rounded-lg text-center font-bold transition border ${
                        adminCvStatus === item.id
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Instructor &amp; Recruiter Feedback / Recommendations
                </label>
                <textarea
                  rows={3}
                  value={adminCvFeedback}
                  onChange={(e) => setAdminCvFeedback(e.target.value)}
                  placeholder="e.g. Excellent site casting experience. Recommended for interview shortlist at ABC Developer Ltd..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl p-2.5 text-slate-900 outline-none"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  This note is directly visible to the student in their student dashboard.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewingStudentCv(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCvFeedback}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingCvFeedback ? 'Saving...' : 'Save Feedback & Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}