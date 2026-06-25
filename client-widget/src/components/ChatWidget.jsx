import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import MessageBubble from './MessageBubble';

// Connect to the backend server
const BACKEND_URL = window.location.origin;
const socket = io(BACKEND_URL);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate or get visitor ID
    let vid = localStorage.getItem('chat_visitor_id');
    if (!vid) {
      vid = 'visitor_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_visitor_id', vid);
    }
    setVisitorId(vid);

    // Fetch message history
    fetch(`${BACKEND_URL}/api/messages/${vid}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(err => console.error("Failed to load messages", err));

    // Socket listeners
    const handleReceiveReply = (message) => {
      // If the reply is meant for this visitor, or if we broadcasted it
      // since we're broadcasting to all for simplicity, check visitorId
      if (message.visitorId === vid) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receiveReply', handleReceiveReply);

    return () => {
      socket.off('receiveReply', handleReceiveReply);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const messageData = {
      visitorId,
      message: inputValue
    };

    // Optimistically update UI
    const tempMsg = {
      _id: Date.now().toString(),
      visitorId,
      sender: 'user',
      message: inputValue,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Send to server
    socket.emit('sendMessage', messageData);
    setInputValue('');
  };

  return (
    <>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h3>Support Chat</h3>
              <p>We typically reply in a few minutes.</p>
            </div>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                Send us a message to start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble 
                  key={msg._id} 
                  message={msg} 
                  isUser={msg.sender === 'user'} 
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={!inputValue.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button className="chat-toggle-btn" onClick={toggleChat}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </>
  );
};

export default ChatWidget;
