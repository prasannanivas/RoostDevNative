// ChatModal.js
import React from "react";
import { Modal, StyleSheet } from "react-native";
import Chat from "./Chat";

const ChatModal = ({
  visible,
  onClose,
  userId,
  userName,
  userType = "client",
  chatType = "admin",
  onUnreadChange,
}) => {
  // Chat component now always mounted and handles its own modal
  // Use chatType as key to ensure complete isolation between admin and mortgage-broker chats
  return (
    <Chat
      key={`chat-${chatType}-${userId}`}
      visible={visible}
      onClose={onClose}
      userId={userId}
      userName={userName}
      userType={userType}
      chatType={chatType}
      onUnreadChange={onUnreadChange}
    />
  );
};

export default ChatModal;
