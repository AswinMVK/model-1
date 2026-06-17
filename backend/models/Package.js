const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tutor User ID
  name: { type: String, required: true },
  type: { type: String, enum: ['single', 'monthly', 'custom'], required: true },
  price: { type: Number, required: true },
  numberOfSessions: { type: Number, required: true },
  description: { type: String, default: '' }
});

module.exports = mongoose.model('Package', packageSchema);
