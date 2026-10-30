const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  // Platform & Branding
  siteName: {
    type: String,
    default: 'Blueprint Learning Academy',
  },
  tagline: {
    type: String,
    default: 'Real Estate Career Courses for Civil Engineers',
  },

  // Hero Section Texts & Badges
  heroBadgeText: {
    type: String,
    default: "Bangladesh's #1 Practical Civil Engineering Academy",
  },
  heroTitle: {
    type: String,
    default: 'Build a real estate career as a civil engineer in Bangladesh.',
  },
  heroSubtitle: {
    type: String,
    default: 'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.',
  },
  heroBengaliNote: {
    type: String,
    default: 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।',
  },

  // Lead Instructor Details & Photo
  instructorName: {
    type: String,
    default: 'Engr. Md Abdul Mazid',
  },
  instructorDegree: {
    type: String,
    default: 'B.Sc. in Civil Engineering (BUET)',
  },
  instructorExp: {
    type: String,
    default: '10+ Years On Real Projects in Bangladesh',
  },
  instructorShortExp: {
    type: String,
    default: '10+ Yrs Exp',
  },
  instructorImage: {
    type: String,
    default: '/instructor.jpg?v=2',
  },
  instructorBio: {
    type: String,
    default: 'Engr. Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience leading residential, commercial, and high-rise developer construction projects in Dhaka. He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks and what Bangladeshi developer companies and site consultants actually demand.',
  },

  // Key Highlights / Features under Instructor
  feature1Title: {
    type: String,
    default: 'Real Developer Drawings',
  },
  feature1Desc: {
    type: String,
    default: 'Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.',
  },
  feature2Title: {
    type: String,
    default: 'Live Site Situations',
  },
  feature2Desc: {
    type: String,
    default: 'Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.',
  },

  // Stats Counter
  statsCourses: {
    type: String,
    default: '6+',
  },
  statsExperience: {
    type: String,
    default: '10+ Yrs',
  },
  statsMentorTag: {
    type: String,
    default: 'BUET',
  },

  // Contact Helpline Numbers
  contactPhone: {
    type: String,
    default: '01313893838',
  },
  whatsappNumber: {
    type: String,
    default: '8801313893838',
  },
  contactEmail: {
    type: String,
    default: 'info@blueprintlearningacademy.com',
  },

  // Payment Numbers & Instructions
  bkashNumber: {
    type: String,
    default: '01313893838',
  },
  bkashType: {
    type: String,
    default: 'Personal (Send Money)',
  },
  nagadNumber: {
    type: String,
    default: '01313893838',
  },
  nagadType: {
    type: String,
    default: 'Personal (Send Money)',
  },
  rocketNumber: {
    type: String,
    default: '01313893838-5',
  },
  paymentInstructions: {
    type: String,
    default: 'Please use Send Money to our official number, write your name as reference, and enter the Transaction ID in the enrollment form.',
  },

  // Email / SMTP Dispatch Settings (Brevo & Gmail)
  smtpHost: {
    type: String,
    default: 'smtp-relay.brevo.com',
  },
  smtpPort: {
    type: Number,
    default: 587,
  },
  smtpUser: {
    type: String,
    default: '',
  },
  smtpPass: {
    type: String,
    default: '',
  },
  smtpSecure: {
    type: Boolean,
    default: false,
  },
  emailFrom: {
    type: String,
    default: '"Blueprint Learning Academy" <admin.blueprintlearning@gmail.com>',
  },
  gmailUser: {
    type: String,
    default: '',
  },
  gmailPass: {
    type: String,
    default: '',
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
