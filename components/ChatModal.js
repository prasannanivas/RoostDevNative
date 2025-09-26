// ChatModal.js
import React from "react";
import { Modal, StyleSheet } from "react-native";
import Chat from "./Chat";

const ChatModal = ({ visible, onClose, userId, userName }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Chat
        visible={visible}
        onClose={onClose}
        userId={userId}
        userName={userName}
      />
    </Modal>
  );
};

export default ChatModal;
