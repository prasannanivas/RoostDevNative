import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const COLORS = {
  green: "#377473",
  black: "#1D2327",
  slate: "#707070",
  white: "#FDFDFD",
};

/**
 * ShareOptionsModal - A reusable component for share options after inviting
 * @param {Object} props
 * @param {boolean} props.visible - Controls the visibility of the modal
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {string} props.title - Title text (e.g., "Client invite via" or "Realtor invite via")
 * @param {string} props.subtitle - Subtitle description text
 * @param {boolean} props.hasPhone - Whether phone option should be shown
 * @param {boolean} props.hasEmail - Whether email option should be shown
 * @param {Function} props.onPersonalText - Handler for Personal Text button
 * @param {Function} props.onPersonalEmail - Handler for Personal Email button
 * @param {Function} props.onSkip - Handler for Skip button
 */
const ShareOptionsModal = ({
  visible,
  onClose,
  title = "Invite via",
  subtitle = "We have sent an invite! However its always best to reach out directly. Sending a personalized message is simple just click one of the options below.",
  hasPhone,
  hasEmail,
  onPersonalText,
  onPersonalEmail,
  onSkip,
}) => {
  console.log("ShareOptionsModal - visible:", visible);
  console.log("ShareOptionsModal - hasPhone:", hasPhone, "hasEmail:", hasEmail);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                <Path
                  d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                  fill="#A9A9A9"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.options}>
              {hasPhone && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onPersonalText}
                >
                  <Text style={styles.primaryButtonText}>Personal Text</Text>
                </TouchableOpacity>
              )}

              {hasEmail && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onPersonalEmail}
                >
                  <Text style={styles.primaryButtonText}>Personal Email</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.skipContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  container: {
    backgroundColor: COLORS.white,
    width: "90%",
    maxWidth: 500,
    borderRadius: 15,
    padding: 28,
    position: "relative",
    zIndex: 10000,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10001,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0,
    color: COLORS.black,
    fontFamily: "Futura",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    marginBottom: 24,
    paddingHorizontal: 16,
    fontFamily: "Futura",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 23,
    alignItems: "center",
    minWidth: 120,
    width: "90%",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    fontFamily: "Futura",
    textAlign: "center",
  },
  skipContainer: {
    alignItems: "center",
    width: "100%",
  },
  skipButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 13,
    alignItems: "center",
    width: "90%",
  },
  skipButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
});

export default ShareOptionsModal;
