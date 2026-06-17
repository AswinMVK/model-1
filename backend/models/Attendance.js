const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Excused'], default: 'Present' },
  joinTime: { type: Date },
  leaveTime: { type: Date },
  durationMinutes: { type: Number, default: 0 },
  updatedBy: { type: String, enum: ['auto', 'tutor', 'admin'], default: 'tutor' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
