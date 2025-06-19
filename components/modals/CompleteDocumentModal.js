// CompleteDocumentModal.js
import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import CloseIconSvg from "../icons/CloseIconSvg";

/**
 * Color palette from UX team design system
 */
const COLORS = {
  // Core colors
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070", // dark gray
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",

  // Opacity variations
  noticeContainerBg: "#37747340", // Green with 25% opacity
  coloredBgFill: "#3774731A", // Green with 10% opacity
};

const CompleteDocumentModal = ({ visible, onClose, document }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <CloseIconSvg />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {document?.displayName || document?.docType || "Document"}
            </Text>
          </View>

          <Text style={styles.completeModalText}>
            You have already submitted this document and accepted as valid
          </Text>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    position: "relative",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 24, // H2 size
    fontWeight: 700, // H2 weight
    color: COLORS.black,
    flex: 1,
    fontFamily: "Futura",
    textAlign: "center",
    marginTop: 24, // Center title vertically
  },
  closeModalButton: {
    position: "absolute",
    top: -12,
    right: -12,
    padding: 5,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalText: {
    color: COLORS.black,
  },
  completeModalText: {
    fontSize: 14, // H3 size
    fontWeight: 500, // H3 weight
    color: COLORS.slate,
    textAlign: "center",
    marginVertical: 24,
    fontFamily: "Futura",
  },
  closeButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    borderRadius: 50,
    minWidth: 82,
    minHeight: 42,
    marginTop: 16,
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 700, // P weight
    textAlign: "center",
    fontSize: 12, // H3 size
    fontFamily: "Futura",
  },
});

export default CompleteDocumentModal;
