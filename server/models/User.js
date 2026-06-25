const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'Anonymous'
  },
  email: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
