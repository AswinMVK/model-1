const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readStatus: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['schedule', 'payment', 'class_reminder', 'attendance', 'reschedule'],
    default: 'schedule'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
