const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Blueprint Learning Academy',
  },
  tagline: {
    type: String,
    default: 'Real Estate Career Courses for Civil Engineers',
  },
  heroTitle: {
    type: String,
    default: 'Build a real estate career as a civil engineer in Bangladesh.',
  },
  heroSubtitle: {
    type: String,
    default: 'Practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.',
  },
  heroBengaliNote: {
    type: String,
    default: 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।',
  },
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
    default: 'info@concretepathacademy.com',
  },
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
