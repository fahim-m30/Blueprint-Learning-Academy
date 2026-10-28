const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  studentPhone: {
    type: String,
    required: true,
    trim: true,
  },
  studentAddress: {
    type: String,
    default: '',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bKash', 'Nagad', 'Rocket', 'Bank'],
    default: 'bKash',
  },
  senderNumber: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  generatedPassword: {
    type: String,
    default: '',
  },
  approvedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
