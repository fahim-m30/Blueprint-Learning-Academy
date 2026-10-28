export interface SyllabusItem {
  _id?: string;
  classNumber: number;
  title: string;
  topics: string[];
}

export interface VideoItem {
  _id: string;
  title: string;
  youtubeUrl: string;
  duration?: string;
  note?: string;
  createdAt?: string;
}

export interface LiveClassItem {
  _id: string;
  title: string;
  classDate: string;
  classTime: string;
  meetingLink: string;
  platform: string;
  note?: string;
  isCompleted: boolean;
}

export interface TaskItem {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  points: number;
  createdAt?: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  durationDays: number;
  totalClasses: number;
  price: number;
  regularPrice: number;
  whatsappGroupLink: string;
  instructor?: {
    name: string;
    designation: string;
    bio: string;
  };
  syllabus: SyllabusItem[];
  videos?: VideoItem[];
  liveClasses?: LiveClassItem[];
  tasks?: TaskItem[];
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBengaliNote: string;
  contactPhone: string;
  whatsappNumber: string;
  contactEmail: string;
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  nagadType: string;
  rocketNumber: string;
  paymentInstructions: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: 'student' | 'admin';
  status: 'active' | 'paused' | 'blocked';
  blockReason?: string;
  plainPasswordForAdmin?: string;
  enrolledCourses?: Array<{
    course: Course;
    enrolledAt: string;
    expiresAt?: string;
    status: string;
  }>;
}

export interface Enrollment {
  _id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentAddress?: string;
  course: Course | string;
  courseTitle: string;
  amount: number;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  generatedPassword?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface TaskSubmission {
  _id: string;
  course: string;
  taskId: string;
  taskTitle: string;
  student: string;
  studentName: string;
  studentEmail: string;
  submissionText?: string;
  submissionLink?: string;
  feedback?: string;
  grade?: string;
  status: 'submitted' | 'reviewed';
  submittedAt: string;
}

export interface ChatMessage {
  _id: string;
  course: string;
  sender: string;
  senderName: string;
  senderRole: 'student' | 'admin';
  message: string;
  createdAt: string;
}
