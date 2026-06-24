const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
