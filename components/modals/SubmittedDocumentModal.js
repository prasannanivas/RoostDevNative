// SubmittedDocumentModal.js
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
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
  clientName,
  coClientName = "",
}) => {
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      // Sequential animation: backdrop fades in, then modal slides up
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Closing animation: reverse of opening (modal slides down, then backdrop fades out)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      onClose();
    });
  };

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
        `https://signup.roostapp.io/documents/${clientId}/documents/${document._id}`,
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
      handleClose();
    } catch (error) {
      Alert.alert("Error", "Failed to delete document");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Modal
      visible={internalVisible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: backdropOpacity }]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
              opacity: modalOpacity,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {document?.displayName || document?.docType || "Document"}
            </Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={handleClose}
            >
              <CloseIconSvg height={26} width={26} color="#797979" />
            </TouchableOpacity>
          </View>

          <Text style={styles.clientNameText}>
            {document?.type === "Needed" ? clientName : coClientName}
          </Text>

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
                <Text style={styles.modalButtonText}>Change</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.nevermindButton]}
              onPress={handleClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 48,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 24,
    width: "100%",
    maxWidth: "100%",
    position: "relative",
    zIndex: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    paddingTop: 10,
    position: "relative",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.black,
    fontFamily: "Futura",
    textAlign: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Futura",
  },
  completeModalText: {
    fontSize: 14,
    fontWeight: 500,
    color: COLORS.slate,
    textAlign: "center",
    marginVertical: 24,
    fontFamily: "Futura",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    maxWidth: 120,
  },
  nevermindButton: {
    backgroundColor: COLORS.green,
    maxWidth: 150,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "Futura",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SubmittedDocumentModal;
