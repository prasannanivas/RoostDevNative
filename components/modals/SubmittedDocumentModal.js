// SubmittedDocumentModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
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

const SubmittedDocumentModal = ({
  visible,
  onClose,
  document,
  clientId,
  onDeleteSuccess,
}) => {
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Delete document
  const handleDeleteDocument = async () => {
    console.log("Deleting document:", document);
    setDeleteLoading(true);

    try {
      if (!document || !document._id) {
        Alert.alert("Error", "Document ID is missing");
        console.error("Document ID is missing:", document);
        return;
      }

      const response = await fetch(
        `http://159.203.58.60:5000/documents/${clientId}/documents/${document._id}`,
        {
          method: "DELETE",
        }
      );

      // Clone the response before consuming the body
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => ({}));
      console.log("Delete response:", responseData);

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

      // Notify parent of deletion success
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      Alert.alert("Success", "Document deleted successfully");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to delete document");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>
              {document?.displayName || document?.docType || "Document"}
            </Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <CloseIconSvg />
            </TouchableOpacity>
          </View>

          <Text style={styles.completeModalText}>
            You have already submitted this document. If you wish to reupload
            it, delete the existing doc and try again.
          </Text>

          <View style={styles.modalButtonGroup}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.deleteButton,
                deleteLoading && styles.buttonDisabled,
              ]}
              onPress={handleDeleteDocument}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.modalButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.nevermindButton]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Never Mind</Text>
            </TouchableOpacity>
          </View>
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
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 33,
    alignItems: "center",
    minHeight: 42,
    minWidth: 90,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
  },
  nevermindButton: {
    backgroundColor: COLORS.green,
    minWidth: 120,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: 700, // P weight
    fontSize: 12, // H3 size
    fontFamily: "Futura",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SubmittedDocumentModal;
