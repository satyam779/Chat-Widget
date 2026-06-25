import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import MessageBubble from './MessageBubble';

// Connect to the backend server
const BACKEND_URL = window.location.origin;
const socket = io(BACKEND_URL);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
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

    const savedName = localStorage.getItem('chat_visitor_name');
    if (savedName) {
      setIsRegistered(true);
      setName(savedName);
    }

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
  }, [messages, isOpen, isRegistered]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      await fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, name, email })
      });
      localStorage.setItem('chat_visitor_name', name);
      localStorage.setItem('chat_visitor_email', email);
      setIsRegistered(true);
    } catch (err) {
      console.error("Failed to register", err);
    }
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
          
          {!isRegistered ? (
            <div className="chat-registration" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h4 style={{ marginBottom: '15px' }}>Welcome!</h4>
                <p style={{ marginBottom: '20px', color: '#555', fontSize: '14px' }}>Please enter your details to start the chat.</p>
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                  />
                  <button type="submit" style={{ padding: '12px', background: '#5e43f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Start Chat
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      <button className="chat-toggle-btn" onClick={toggleChat}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </>
  );
};

export default ChatWidget;
