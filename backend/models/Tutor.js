const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qualifications: { type: String, required: true },
  subjects: [{ type: String }],
  experience: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  teachingMode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
  availability: [
    {
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      startTime: { type: String }, // e.g. "09:00"
      endTime: { type: String }   // e.g. "17:00"
    }
  ]
});

module.exports = mongoose.model('Tutor', tutorSchema);
