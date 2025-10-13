import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import CloseIconSvg from "../icons/CloseIconSvg";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  white: "#FDFDFD",
};

const MortgageApplicationModal = ({
  visible,
  onClose,
  onConfirm,
  realtorInfo,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); // 'success' | 'error' | null

  const handleClose = () => {
    setSubmissionResult(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Prepare realtor details for API call
      const payload = {
        name: realtorInfo?.name || "N/A",
        email: realtorInfo?.email || "N/A",
        phone: realtorInfo?.phone || "N/A",
      };

      // Make POST request to the new endpoint
      const response = await fetch(
        "https://signup.roostapp.io/realtor/privatemortgage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        console.log("Mortgage application submitted successfully");
        setSubmissionResult("success");
      } else {
        console.warn(
          "Failed to submit mortgage application, status:",
          response.status
        );
        setSubmissionResult("error");
      }
    } catch (error) {
      console.error("Error submitting mortgage application:", error);
      setSubmissionResult("error");
    } finally {
      setIsSubmitting(false);

      // Call the original onConfirm handler if provided (for backward compatibility)
      if (onConfirm) {
        onConfirm();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={handleClose}
          >
            <CloseIconSvg />
          </TouchableOpacity>

          {submissionResult === "success" ? (
            <>
              <Text style={[styles.messageText, styles.successText]}>
                ✅ Success! Your mortgage application has been submitted
                successfully. Our mortgage broker will be contacting you in the
                next 24 hours.
              </Text>
              <TouchableOpacity
                style={[styles.confirmButton, styles.successButton]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            </>
          ) : submissionResult === "error" ? (
            <>
              <Text style={[styles.messageText, styles.errorText]}>
                ❌ Sorry, there was an error submitting your mortgage
                application. Please try again or contact support if the problem
                persists.
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.retryButton]}
                  onPress={() => {
                    setSubmissionResult(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelButton]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.confirmButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.messageText}>
                Sounds good, our mortgage broker will be contacting you in the
                next 24 hours
              </Text>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleConfirm}
                activeOpacity={isSubmitting ? 1 : 0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
  disabledButton: {
    backgroundColor: "#A9A9A9",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  retryButton: {
    backgroundColor: COLORS.green,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  cancelButtonText: {
    color: COLORS.green,
  },
  successText: {
    color: "#4CAF50",
  },
  errorText: {
    color: "#F44336",
  },
});

export default MortgageApplicationModal;
