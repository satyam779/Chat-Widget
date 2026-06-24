import React from 'react';

const MessageBubble = ({ message, isUser }) => {
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-admin'}`}>
      <div>{message.message}</div>
      <div className="message-time">{time}</div>
    </div>
  );
};

export default MessageBubble;
