const mongoose = require('mongoose');

const syllabusItemSchema = new mongoose.Schema({
  classNumber: { type: Number, required: true },
  title: { type: String, required: true },
  topics: [{ type: String }],
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  duration: { type: String, default: '' },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const liveClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classDate: { type: Date, required: true },
  classTime: { type: String, required: true },
  meetingLink: { type: String, required: true },
  platform: { type: String, default: 'Google Meet' },
  note: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  points: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now },
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Civil Engineering & Real Estate',
  },
  shortDescription: {
    type: String,
    required: true,
  },
  fullDescription: {
    type: String,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
    default: 30,
  },
  totalClasses: {
    type: Number,
    required: true,
    default: 8,
  },
  price: {
    type: Number,
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  whatsappGroupLink: {
    type: String,
    default: 'https://chat.whatsapp.com/sample',
  },
  instructor: {
    name: { type: String, default: 'Engr. Md Abdul Mazid' },
    designation: { type: String, default: 'Senior Civil Engineer (BUET), 10+ Years Experience' },
    bio: { type: String, default: 'Practicing engineer with over a decade of hands-on real estate project execution experience across Bangladesh.' },
  },
  syllabus: [syllabusItemSchema],
  videos: [videoSchema],
  liveClasses: [liveClassSchema],
  tasks: [taskSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  // Auto-calculated or manually specified expiration date
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
