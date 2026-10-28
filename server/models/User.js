const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Stored for admin review as requested: admin can view credentials to assist students
  plainPasswordForAdmin: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'blocked'],
    default: 'active',
  },
  blockReason: {
    type: String,
    default: '',
  },
  resetPasswordOtp: {
    type: String,
    default: '',
  },
  resetPasswordOtpExpires: {
    type: Date,
  },
  enrolledCourses: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
      enrolledAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'expired'],
        default: 'active',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
