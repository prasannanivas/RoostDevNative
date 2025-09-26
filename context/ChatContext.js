// context/ChatContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import ChatService from "../services/ChatService";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children, userId }) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);

  // Load initial messages
  const loadMessages = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const messages = await ChatService.getMessages(userId);
      setMessages(messages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (text) => {
    if (!userId || !text.trim()) return null;

    try {
      const message = await ChatService.sendMessage(userId, text.trim());
      setMessages((prev) => [...prev, message]);
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds) => {
    if (!userId || !messageIds.length) return;

    try {
      await ChatService.markMessagesAsRead(userId, messageIds);
      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - messageIds.length));
    } catch (error) {
      console.log("Error marking messages as read:", error);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!userId) return;

    try {
      const count = await ChatService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      if (!message.fromCurrentUser) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleTyping = (isTyping, fromUserId) => {
      // Handle typing indicators here if needed
      console.log(
        `User ${fromUserId} is ${isTyping ? "typing" : "not typing"}`
      );
    };

    try {
      const ws = ChatService.subscribeToChat(
        userId,
        handleNewMessage,
        handleTyping
      );
      setWsConnection(ws);

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);

      return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error("Error setting up chat subscription:", error);
    }
  }, [userId]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadMessages();
      loadUnreadCount();
    }
  }, [userId]);

  const value = {
    messages,
    unreadCount,
    loading,
    connected,
    sendMessage,
    markAsRead,
    loadMessages,
    loadUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
