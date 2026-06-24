require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-widget')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.get('/api/messages/:visitorId', async (req, res) => {
  try {
    const messages = await Message.find({ visitorId: req.params.visitorId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
    try {
      const { visitorId, sender, message } = req.body;
      const newMessage = new Message({ visitorId, sender, message });
      await newMessage.save();
      res.json(newMessage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save message' });
    }
});

app.get('/api/conversations', async (req, res) => {
  try {
    // Get unique visitors who have sent a message
    const visitors = await Message.distinct('visitorId');
    const conversations = [];
    
    for (const visitorId of visitors) {
      const lastMessage = await Message.findOne({ visitorId }).sort({ timestamp: -1 });
      conversations.push({
        visitorId,
        lastMessage
      });
    }
    
    // Sort conversations by latest message
    conversations.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/admin/login', (req, res) => {
  // Simple dummy login for this example
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true, token: 'dummy-admin-token' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});


// Socket.IO Handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User sends message
  socket.on('sendMessage', async (data) => {
    const { visitorId, message } = data;
    
    // Create user if doesn't exist
    let user = await User.findOne({ visitorId });
    if (!user) {
      user = new User({ visitorId });
      await user.save();
    }

    const newMessage = new Message({
      visitorId,
      sender: 'user',
      message
    });
    await newMessage.save();

    // Broadcast to admins
    socket.broadcast.emit('receiveMessage', newMessage);
  });

  // Admin replies
  socket.on('adminReply', async (data) => {
    const { visitorId, message } = data;

    const newReply = new Message({
      visitorId,
      sender: 'admin',
      message
    });
    await newReply.save();

    // Broadcast reply to the specific user (and other admins to keep in sync)
    // We broadcast to all since we don't have specific user rooms setup yet for simplicity
    socket.broadcast.emit('receiveReply', newReply);
  });
  
  socket.on('typing', (data) => {
      socket.broadcast.emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
