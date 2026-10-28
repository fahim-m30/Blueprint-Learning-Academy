const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  taskTitle: {
    type: String,
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  submissionText: {
    type: String,
    default: '',
  },
  submissionLink: {
    type: String,
    default: '',
  },
  feedback: {
    type: String,
    default: '',
  },
  grade: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed'],
    default: 'submitted',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
