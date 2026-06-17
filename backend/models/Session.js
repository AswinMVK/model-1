const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true },   // "HH:MM"
  status: {
    type: String,
    enum: [
      'Draft', 'Scheduled', 'Pending Student Approval', 'Pending Tutor Approval', 'Confirmed',
      'Upcoming', 'Live', 'Completed', 'Cancelled', 'Rescheduled',
      'Student Absent', 'Tutor Absent', 'Disputed'
    ],
    default: 'Pending Student Approval'
  },
  rescheduleRequest: {
    requestedBy: { type: String, enum: ['student', 'tutor'] },
    newDate: { type: Date },
    newStartTime: { type: String },
    newEndTime: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
