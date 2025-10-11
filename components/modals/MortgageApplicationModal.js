import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import CloseIconSvg from "../icons/CloseIconSvg";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  white: "#FDFDFD",
};

const MortgageApplicationModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <CloseIconSvg />
          </TouchableOpacity>

          <Text style={styles.messageText}>
            Sounds good, our mortgage broker will be contacting you in the next
            24 hours
          </Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",

    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 42,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  closeModalButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: "Futura",
  },
  confirmButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: "center",
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
});

export default MortgageApplicationModal;
