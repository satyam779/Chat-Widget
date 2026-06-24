import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const ChatWindow = ({ visitorId, socket }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    const handleReceiveReply = (message) => {
      if (message.visitorId === visitorId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleReceiveMessage = (message) => {
      if (message.visitorId === visitorId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receiveReply', handleReceiveReply);
    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveReply', handleReceiveReply);
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [visitorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const BACKEND_URL = 'http://32.236.140.56';
      const res = await axios.get(`${BACKEND_URL}/api/messages/${visitorId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const replyData = {
      visitorId,
      message: inputValue
    };

    // Optimistically update
    const tempMsg = {
      _id: Date.now().toString(),
      visitorId,
      sender: 'admin',
      message: inputValue,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    socket.emit('adminReply', replyData);
    setInputValue('');
  };

  return (
    <div className="admin-chat-window">
      <div className="admin-chat-header">
        <h3>Conversation with {visitorId}</h3>
      </div>
      
      <div className="admin-chat-messages">
        {messages.map((msg) => {
          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isUser = msg.sender === 'user';
          
          return (
            <div 
              key={msg._id} 
              style={{
                alignSelf: isUser ? 'flex-start' : 'flex-end',
                backgroundColor: isUser ? '#F3F4F6' : '#4F46E5',
                color: isUser ? '#1F2937' : '#FFFFFF',
                padding: '10px 14px',
                borderRadius: '12px',
                borderBottomLeftRadius: isUser ? '4px' : '12px',
                borderBottomRightRadius: isUser ? '12px' : '4px',
                maxWidth: '70%'
              }}
            >
              <div>{msg.message}</div>
              <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>
                {time}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="admin-chat-input-area" onSubmit={handleSendReply}>
        <input
          type="text"
          className="admin-chat-input"
          placeholder="Type your reply..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button 
          type="submit" 
          className="admin-send-btn"
          disabled={!inputValue.trim()}
        >
          <span>Send</span>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
