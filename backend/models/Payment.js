const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  screenshot: { type: String }, // Base64 or local file path/receipt text
  status: {
    type: String,
    enum: ['Pending Verification', 'Package Accepted by Student', 'Verified', 'Rejected', 'Expired', 'Refunded'],
    default: 'Package Accepted by Student'
  },
  remainingSessions: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  remarks: { type: String, default: '' }
});

module.exports = mongoose.model('Payment', paymentSchema);
