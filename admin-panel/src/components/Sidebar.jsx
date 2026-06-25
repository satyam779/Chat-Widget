import React from 'react';

const Sidebar = ({ conversations, activeVisitor, setActiveVisitor }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Active Chats</h2>
      </div>
      <div className="conversation-list">
        {conversations.map((conv) => {
          const time = new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div 
              key={conv.visitorId} 
              className={`conversation-item ${activeVisitor === conv.visitorId ? 'active' : ''}`}
              onClick={() => setActiveVisitor(conv.visitorId)}
            >
              <div className="conversation-meta">
                <span className="conversation-name" style={{ fontWeight: 'bold' }}>{conv.name || 'Anonymous'}</span>
                <span className="conversation-time">{time}</span>
              </div>
              <div className="conversation-preview">
                {conv.lastMessage.sender === 'admin' ? 'You: ' : ''}
                {conv.lastMessage.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
