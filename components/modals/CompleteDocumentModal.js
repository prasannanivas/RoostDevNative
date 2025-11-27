// CompleteDocumentModal.js
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
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

const CompleteDocumentModal = ({
  visible,
  onClose,
  document,
  clientId,
  clientName,
  coClientName,
}) => {
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
              <CloseIconSvg width={24} height={24} color="#797979" />
            </TouchableOpacity>
          </View>

          <Text style={styles.clientNameText}>
            {document?.type === "Needed" ? clientName : coClientName}
          </Text>

          <Text style={styles.completeModalText}>
            You have already submitted this document and accepted as valid
          </Text>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
    paddingBottom: 46,
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
    marginBottom: 8,
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
  closeButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    borderRadius: 999,
    minWidth: 120,
    minHeight: 42,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 700,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Futura",
  },
});

export default CompleteDocumentModal;
