import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Svg, Path, Circle } from "react-native-svg";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  red: "#A20E0E",
  noticeContainer: "rgba(55, 116, 115, 0.25)",
};

const CloseButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      style={[style, { zIndex: 9999 }]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
        <Circle cx="18.5" cy="18.5" r="18.5" fill="transparent" />
        <Path
          d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
          fill="#A9A9A9"
        />
      </Svg>
    </TouchableOpacity>
  );
};

export default function ChangeEmailModal({
  visible,
  onClose,
  onSuccess,
  userId,
  userType = "client", // 'client' or 'realtor'
  currentFormData,
  fetchRefreshData,
}) {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Success
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef(null);

  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setNewEmail("");
      setOtp("");
      setError("");
      setStep(1);

      // Stagger animations: backdrop fades in, then modal slides up
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations
      backdropOpacity.setValue(0);
      modalOpacity.setValue(0);
      slideAnim.setValue(Dimensions.get("window").height);
    }
  }, [visible]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleEmailSubmit = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setError("");

      // First check if email already exists
      await axios.post("https://signup.roostapp.io/presignup/email", {
        email: newEmail,
      });

      // If we get here, the email is available
      // Send OTP to the new email
      const otpResponse = await axios.post(
        "https://signup.roostapp.io/otp/email/generate",
        { email: newEmail }
      );

      if (otpResponse?.data?.message === "OTP sent successfully") {
        setStep(2);
        setCountdown(60);
        // Focus OTP input when it appears
        setTimeout(() => {
          if (otpInputRef.current) {
            otpInputRef.current.focus();
          }
        }, 100);
      } else {
        setError("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(
          error.response.data.error ||
            "This email is already registered. Please use a different email."
        );
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    try {
      setError("");

      // Verify the OTP
      const verifyResponse = await axios.post(
        "https://signup.roostapp.io/otp/email/verify",
        {
          email: newEmail,
          otp: otp,
        }
      );

      if (verifyResponse.data && verifyResponse.data.success) {
        // Update the profile with the new email
        const endpoint =
          userType === "client"
            ? `https://signup.roostapp.io/client/${userId}`
            : `https://signup.roostapp.io/realtor/${userId}`;

        const payload = {
          ...currentFormData,
          email: newEmail,
        };

        const updateResponse = await axios.put(endpoint, payload);

        if (updateResponse.status === 200) {
          setStep(3);

          // Close the modal after showing success for 2 seconds
          setTimeout(() => {
            handleClose();
            if (onSuccess) onSuccess(newEmail);
            if (fetchRefreshData) fetchRefreshData(userId);
          }, 2000);
        }
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response?.data?.error || "Invalid verification code");
      } else {
        setError("Failed to verify code. Please try again.");
      }
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setError("");
      const response = await axios.post(
        "https://signup.roostapp.io/otp/email/generate",
        { email: newEmail }
      );

      if (response?.data?.message === "OTP sent successfully") {
        setOtp("");
        setCountdown(60);
      } else {
        setError("Failed to resend code. Please try again.");
      }
    } catch (error) {
      setError("Failed to resend verification code.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: modalOpacity,
            },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1
                ? "Change Email Address"
                : step === 2
                ? "Verify Your Email"
                : "Email Updated!"}
            </Text>
            {step !== 3 && (
              <CloseButton onPress={handleClose} style={styles.closeButton} />
            )}
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Step 1: Enter New Email */}
            {step === 1 && (
              <>
                <Text style={styles.subtitle}>
                  Enter your new email address below. We'll send a verification
                  code to this address.
                </Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new email address"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="email-address"
                    value={newEmail}
                    onChangeText={(text) => setNewEmail(text)}
                    autoCapitalize="none"
                    autoFocus={false}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleEmailSubmit}
                >
                  <Text style={styles.submitButtonText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Enter OTP */}
            {step === 2 && (
              <>
                <Text style={styles.subtitle}>
                  We've sent a verification code to {newEmail}. Enter it below
                  to verify your email address.
                </Text>
                <Text style={styles.pasteInstruction}>
                  Paste your 6-digit code in the field - it will handle full
                  codes automatically
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpInput}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    value={otp}
                    onChangeText={(text) => {
                      if (text.length > 1) {
                        const pastedDigits = text
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOtp(pastedDigits);
                      } else {
                        setOtp(text.replace(/\D/g, ""));
                      }
                    }}
                    maxLength={6}
                    selectTextOnFocus={true}
                    onFocus={() => {
                      if (otp) {
                        otpInputRef.current?.setSelection(0, otp.length);
                      }
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleOtpSubmit}
                >
                  <Text style={styles.submitButtonText}>Verify Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    countdown > 0 && styles.resendButtonDisabled,
                  ]}
                  onPress={handleResendOtp}
                  disabled={countdown > 0}
                >
                  <Text
                    style={[
                      styles.resendButtonText,
                      countdown > 0 && styles.resendButtonTextDisabled,
                    ]}
                  >
                    {countdown > 0
                      ? `Resend code in ${countdown} seconds`
                      : "Resend verification code"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={60}
                  color={COLORS.green}
                />
                <Text style={styles.successText}>
                  Email successfully updated!
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    fontFamily: "Futura",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29, 35, 39, 0.5)",
    zIndex: 1,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get("window").height * 0.85,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    zIndex: 2,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.gray,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 8,
  },
  content: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
    textAlign: "center",
    marginBottom: 24,
  },
  pasteInstruction: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.green,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: COLORS.noticeContainer,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    backgroundColor: COLORS.white,
    textAlign: "center",
    letterSpacing: 8,
  },
  submitButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    backgroundColor: "transparent",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  cancelButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  resendButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  resendButtonDisabled: {
    borderColor: COLORS.gray,
  },
  resendButtonText: {
    color: COLORS.green,
    fontWeight: "500",
    fontFamily: "Futura",
    fontSize: 14,
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginTop: 16,
  },
});
