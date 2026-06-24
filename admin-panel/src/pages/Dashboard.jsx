import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);

const Dashboard = () => {
  const [conversationsState, setConversationsState] = useState([]);
  const [activeVisitor, setActiveVisitor] = useState(null);

  useEffect(() => {
    fetchConversations();

    socket.on('receiveMessage', (message) => {
      // Update conversations list with new message
      fetchConversations();
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/conversations`);
      setConversationsState(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };



  return (
    <div className="dashboard-layout">
      <Sidebar 
        conversations={conversationsState} 
        activeVisitor={activeVisitor} 
        setActiveVisitor={setActiveVisitor} 
      />
      {activeVisitor ? (
        <ChatWindow visitorId={activeVisitor} socket={socket} />
      ) : (
        <div className="empty-chat-state">
          <h3>Select a conversation</h3>
          <p>Choose a visitor from the sidebar to start chatting.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
