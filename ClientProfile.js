import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  Switch,
  Image,
  Animated, // Add this for animation
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons

// Design System Colors
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",
  noticeContainer: "rgba(55, 116, 115, 0.25)", // 25% green opacity
  coloredBackgroundFill: "rgba(55, 116, 115, 0.1)", // 10% green opacity
};

export default function ClientProfile({ onClose }) {
  const { user, logout } = useAuth(); // if needed
  const { clientInfo, fetchRefreshData } = useClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Notification preferences - stored locally
  const [notificationPrefs, setNotificationPrefs] = useState({
    // Push notifications
    documentReminders: false,
    documentApprovals: false,
    newMessages: false,
    marketingNotifications: false,

    // Email notifications
    termsOfServiceEmails: false,
    statusUpdateEmails: false,
    marketingEmails: false,
  });

  // For demonstration, we split name into firstName & lastName to match screenshot
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // Add a timer reference for auto-save
  const saveTimerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Email change states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Success
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);
  const otpInputRef = useRef(null);

  // Countdown state for OTP resend
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Load client info
    if (clientInfo) {
      const [first = "", ...rest] = (clientInfo.name || "").split(" ");
      const last = rest.join(" ");
      setFormData({
        firstName: first,
        lastName: last,
        phone: clientInfo.phone || "",
        email: clientInfo.email || "",
        address: clientInfo.address?.address || "",
        city: clientInfo.address?.city || "",
        postalCode: clientInfo.address?.postalCode || "",
      });
    }

    // Load notification preferences from AsyncStorage
    loadNotificationPreferences();
  }, [clientInfo]);

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

  const loadNotificationPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem("notificationPreferences");
      if (savedPrefs) {
        setNotificationPrefs(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.log("Error loading notification preferences:", error);
    }
  };

  const saveNotificationPreferences = async (newPrefs) => {
    try {
      await AsyncStorage.setItem(
        "notificationPreferences",
        JSON.stringify(newPrefs)
      );
    } catch (error) {
      console.log("Error saving notification preferences:", error);
    }
  };

  const toggleNotificationPref = (key) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };
    setNotificationPrefs(newPrefs);
    saveNotificationPreferences(newPrefs);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear any existing timer when the user types
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set a new timer for auto-save after 10 seconds
    saveTimerRef.current = setTimeout(() => {
      handleSubmit();
    }, 1000);
  };

  const handlePasswordInputChange = (key, value) => {
    setPasswordData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    setFeedback({ message: "", type: "" });
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      setFeedback({
        message: "Error logging out",
        type: "error",
      });
    }
  };

  // Modified handleSubmit with success notification
  const handleSubmit = async () => {
    // Prevent duplicate save calls
    if (isSaving) return;

    try {
      setIsSaving(true);
      // Merge firstName + lastName
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const payload = {
        name: fullName,
        phone: formData.phone,
        email: formData.email,
        address: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
      };
      const response = await axios.put(
        `http://159.203.58.60:5000/client/${clientInfo.id}`,
        payload
      );
      if (response.status === 200) {
        // Show success notification
        setSaveSuccess(true);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Fade out after 2 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setSaveSuccess(false));
        }, 2000);
      }
    } catch (error) {
      console.error(
        "Auto-save error:",
        error.response?.data?.error || "Error updating profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Modify the close button handler to refresh data after closing
  const handleClose = async () => {
    // Clear any pending auto-save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Save changes before closing
    handleSubmit();

    fetchRefreshData(clientInfo.id);
    // Trigger client data refetch if possible
    if (onClose) {
      // Assuming the ClientContext has a method to refresh client data

      onClose();
    }
  };

  const handlePasswordSubmit = async () => {
    setError("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      const response = await axios.post(
        `http://159.203.58.60:5000/client/${clientInfo.id}/updatepassword`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }
      );
      if (response.data) {
        Alert.alert("Success", "Password updated successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      setError(error.response?.data?.error || "Error updating password");
    }
  };

  // A helper to get initials from first & last name
  const getInitials = () => {
    const firstInitial = formData.firstName?.[0]?.toUpperCase() || "";
    const lastInitial = formData.lastName?.[0]?.toUpperCase() || "";
    return `${firstInitial}${lastInitial}` || "SM";
  };

  // New handler functions for email change
  const handleEmailChangeStart = () => {
    setNewEmail("");
    setEmailOtp("");
    setEmailError("");
    setEmailChangeStep(1);
    setShowEmailModal(true);
  };

  // Update the handleEmailSubmit function to use the correct OTP generation endpoint
  const handleEmailSubmit = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setEmailError("");

      // First check if email already exists
      await axios.post("http://159.203.58.60:5000/presignup/email", {
        email: newEmail,
      });

      // If we get here, the email is available (doesn't exist yet)
      // Now send OTP to the new email using the correct endpoint
      const otpResponse = await axios.post(
        "http://159.203.58.60:5000/otp/email/generate",
        { email: newEmail }
      );

      if (otpResponse?.data?.message === "OTP sent successfully") {
        setEmailChangeStep(2);
        // Focus OTP input when it appears
        setTimeout(() => {
          if (otpInputRef.current) {
            otpInputRef.current.focus();
          }
        }, 100);
      } else {
        setEmailError("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setEmailError(
          error.response.data.error ||
            "This email is already registered. Please use a different email."
        );
      } else {
        setEmailError("An error occurred. Please try again.");
      }
    }
  };

  // Update the handleOtpSubmit function to use the standard profile update endpoint

  const handleOtpSubmit = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      setEmailError("Please enter the complete 6-digit verification code");
      return;
    }

    try {
      setEmailError("");

      // First verify the OTP using the correct endpoint
      const verifyResponse = await axios.post(
        "http://159.203.58.60:5000/otp/email/verify",
        {
          email: newEmail,
          otp: emailOtp,
        }
      );

      if (verifyResponse.data && verifyResponse.data.success) {
        // If OTP is verified, update the profile with the new email
        // using the standard profile update endpoint

        // Create payload similar to regular profile update
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        const payload = {
          name: fullName,
          phone: formData.phone,
          email: newEmail, // Use the new email
          address: {
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
        };

        // Use PUT request to update profile
        const updateResponse = await axios.put(
          `http://159.203.58.60:5000/client/${clientInfo.id}`,
          payload
        );

        if (updateResponse.status === 200) {
          // Update local form data with new email
          setFormData((prev) => ({ ...prev, email: newEmail }));
          setEmailChangeStep(3);
          setEmailChangeSuccess(true);

          // Close the modal after showing success for 2 seconds
          setTimeout(() => {
            setShowEmailModal(false);
            setEmailChangeSuccess(false);
            // Refresh client data to reflect changes
            fetchRefreshData(clientInfo.id);
          }, 2000);
        }
      } else {
        setEmailError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setEmailError(
          error.response?.data?.error || "Invalid verification code"
        );
      } else {
        setEmailError("Failed to verify code. Please try again.");
      }
    }
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setEmailError("");
  };

  // Function to handle resending the OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setEmailError("");
      const response = await axios.post(
        "http://159.203.58.60:5000/otp/email/generate",
        { email: newEmail }
      );

      if (response?.data?.message === "OTP sent successfully") {
        setEmailOtp("");
        setCountdown(60); // Start 60 second countdown
      } else {
        setEmailError("Failed to resend code. Please try again.");
      }
    } catch (error) {
      setEmailError("Failed to resend verification code.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Success notification */}
      {saveSuccess && (
        <Animated.View style={[styles.saveNotification, { opacity: fadeAnim }]}>
          <Text style={styles.saveNotificationText}>
            Profile updated successfully
          </Text>
        </Animated.View>
      )}

      {/* Close Button in top-right corner - updated to use new handler */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      )}

      {/* Avatar & Title */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Text style={styles.profileTitle}>Your Profile</Text>
        <Text style={styles.profileSubtitle}>
          Keep your personal info up to date
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Personal Info Card */}
        <View style={styles.card}>
          {" "}
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={COLORS.gray}
              value={formData.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={COLORS.gray}
              value={formData.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
            />
            {/* Email with Change Button */}
            <View style={styles.emailContainer}>
              <TextInput
                style={[styles.input, styles.emailInput]}
                placeholder="Email"
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
                value={formData.email}
                editable={false} // Make it non-editable
              />
              <TouchableOpacity
                style={styles.changeEmailButton}
                onPress={handleEmailChangeStart}
              >
                <Text style={styles.changeEmailText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send my rewards to</Text>
          <Text style={styles.cardSubtitle}>
            Make sure thing info is complete and up to date.
          </Text>{" "}
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.gray}
              value={formData.firstName + " " + formData.lastName}
              editable={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor={COLORS.gray}
              value={formData.address}
              onChangeText={(text) => handleChange("address", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor={COLORS.gray}
              value={formData.city}
              onChangeText={(text) => handleChange("city", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              placeholderTextColor={COLORS.gray}
              value={formData.postalCode}
              onChangeText={(text) => handleChange("postalCode", text)}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          {/* Document Reminders */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Document Reminders</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("documentReminders")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.documentReminders && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.documentReminders && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Document Approvals */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Document Approvals</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("documentApprovals")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.documentApprovals && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.documentApprovals && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* New Messages */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>New Messages</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("newMessages")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.newMessages && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.newMessages && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Marketing Notifications */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Marketing Notifications</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("marketingNotifications")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.marketingNotifications &&
                  styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.marketingNotifications &&
                    styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Email Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email Notifications</Text>
          <Text style={styles.cardSubtitle}>
            Manage what emails you receive from us
          </Text>

          {/* Terms of Service Updates */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Terms of Service Updates</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("termsOfServiceEmails")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.termsOfServiceEmails && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.termsOfServiceEmails &&
                    styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Status Updates */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Status Updates</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("statusUpdateEmails")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.statusUpdateEmails && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.statusUpdateEmails && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Marketing Emails */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Marketing Emails</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("marketingEmails")}
              style={[
                styles.toggleSwitch,
                notificationPrefs.marketingEmails && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  notificationPrefs.marketingEmails && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            {error ? (
              <Text style={styles.errorMessage}>{error}</Text>
            ) : null}{" "}
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              value={passwordData.oldPassword}
              onChangeText={(text) =>
                handlePasswordInputChange("oldPassword", text)
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) =>
                handlePasswordInputChange("newPassword", text)
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                handlePasswordInputChange("confirmPassword", text)
              }
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.modalButtonText}>Update Password</Text>
              </TouchableOpacity>{" "}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.gray }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setError("");
                  setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {/* Logout Button */}
          </View>
        </View>
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Email Change Modal */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {emailChangeStep === 1
                  ? "Change Email Address"
                  : emailChangeStep === 2
                  ? "Verify Your Email"
                  : "Email Updated!"}
              </Text>
              {!emailChangeSuccess && (
                <TouchableOpacity
                  onPress={handleEmailModalClose}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Error Message */}
            {emailError ? (
              <Text style={styles.errorMessage}>{emailError}</Text>
            ) : null}
            {/* Step 1: Enter New Email */}
            {emailChangeStep === 1 && (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter your new email address below. We'll send a verification
                  code to this address.
                </Text>{" "}
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Email Address"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={(text) => setNewEmail(text)}
                  autoCapitalize="none"
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.fullWidthButton}
                  onPress={handleEmailSubmit}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Step 2: Enter OTP */}
            {emailChangeStep === 2 && (
              <>
                {" "}
                <Text style={styles.modalSubtitle}>
                  We've sent a verification code to {newEmail}. Enter it below
                  to verify your email address.
                </Text>
                <Text style={styles.pasteInstruction}>
                  Paste your 6-digit code in the field - it will handle full
                  codes automatically
                </Text>{" "}
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  placeholder="Enter verification code"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="numeric"
                  value={emailOtp}
                  onChangeText={(text) => {
                    // Handle paste operation for full codes
                    if (text.length > 1) {
                      // Extract only numeric characters and limit to 6 digits
                      const pastedDigits = text.replace(/\D/g, "").slice(0, 6);
                      setEmailOtp(pastedDigits);
                    } else {
                      // Handle single character input
                      setEmailOtp(text.replace(/\D/g, ""));
                    }
                  }}
                  maxLength={6}
                  selectTextOnFocus={true}
                  onFocus={() => {
                    // Select all text when focusing to make paste/editing easier
                    if (emailOtp) {
                      otpInputRef.current?.setSelection(0, emailOtp.length);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.fullWidthButton}
                  onPress={handleOtpSubmit}
                >
                  <Text style={styles.buttonText}>Verify Email</Text>
                </TouchableOpacity>
                {/* Resend button with countdown */}
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
            )}{" "}
            {/* Step 3: Success */}
            {emailChangeStep === 3 && (
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container for everything
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 16,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.black,
    fontFamily: "Futura",
    fontWeight: "bold",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    color: COLORS.white,
    fontFamily: "Futura",
    fontWeight: "bold",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Card style
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
    marginBottom: 16,
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 16,
    height: 48,
  },

  // Toggles
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray,
    justifyContent: "center",
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: COLORS.green,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: {
    marginLeft: 20,
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  passwordButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  passwordButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },

  /* Logout Button */
  logoutButton: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  logoutSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },

  // Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(29, 35, 39, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    width: "100%",
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 16,
    height: 48,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  errorMessage: {
    color: COLORS.red,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    backgroundColor: COLORS.noticeContainer,
    padding: 16,
    borderRadius: 8,
  },

  // Success notification
  saveNotification: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    zIndex: 100,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveNotificationText: {
    color: COLORS.white,
    fontWeight: "500",
    fontFamily: "Futura",
    fontSize: 14,
  },

  // Email Field Styles
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: COLORS.silver,
  },
  changeEmailButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 16,
    height: 48,
    justifyContent: "center",
  },
  changeEmailText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Futura",
  },

  // Modal Styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
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
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.black,
    fontFamily: "Futura",
    fontWeight: "bold",
  },
  fullWidthButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    height: 48,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  textButton: {
    marginTop: 16,
    alignSelf: "center",
  },
  textButtonLabel: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
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
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 24,
    height: 48,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginTop: 16,
  },
  // Resend button styles
  resendButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 48,
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
});
