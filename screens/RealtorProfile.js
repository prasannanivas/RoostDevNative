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
  Image,
  Animated,
  Dimensions,
  Clipboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRealtor } from "../context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function RealtorProfile({ onClose }) {
  const { realtorInfo, fetchRefreshData } = useRealtor();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const realtor = realtorInfo;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [error, setError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  // Main form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    rewardsAddress: "",
    rewardsCity: "",
    rewardsPostalCode: "",
    brokerageName: "",
    brokerageAddress: "",
    brokerageCity: "",
    brokeragePostalCode: "",
    brokeragePhone: "",
    brokerageEmail: "",
    licenseNumber: "",
  });

  // Password form data
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  // Email change state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Success
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef(null);

  // Notification preferences - stored locally
  const [notificationPrefs, setNotificationPrefs] = useState({
    // Push notifications
    clientAccept: false,
    clientPreApproval: false,
    marketingNotifications: false,

    // Email notifications
    termsOfServiceEmails: false,
    clientPreApprovalEmails: false,
    marketingEmails: false,
  });

  // Add these state variables at the top of your component with the other state declarations
  const saveTimerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load notification preferences when component mounts
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  // Load notification preferences from AsyncStorage
  const loadNotificationPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem(
        "realtorNotificationPreferences"
      );
      if (savedPrefs) {
        setNotificationPrefs(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.log("Error loading notification preferences:", error);
    }
  };

  // Save notification preferences to AsyncStorage
  const saveNotificationPreferences = async (newPrefs) => {
    try {
      await AsyncStorage.setItem(
        "realtorNotificationPreferences",
        JSON.stringify(newPrefs)
      );
    } catch (error) {
      console.log("Error saving notification preferences:", error);
    }
  };

  // Toggle notification preferences
  const toggleNotificationPref = (key) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };
    setNotificationPrefs(newPrefs);
    saveNotificationPreferences(newPrefs);
  };

  // Fetch shareable link
  const fetchShareableLink = async () => {
    if (!realtor?._id) return;

    try {
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor._id}/shareable-link`
      );

      if (response.ok) {
        const data = await response.json();
        setShareableLink(data.shareableLink || "");
      } else {
        console.error("Failed to fetch shareable link");
      }
    } catch (error) {
      console.error("Error fetching shareable link:", error);
    }
  };

  // Email change handler functions
  const handleEmailChangeStart = () => {
    setNewEmail("");
    setEmailOtp("");
    setEmailError("");
    setEmailChangeStep(1);
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setEmailError("");

      // First check if email already exists
      const checkResponse = await fetch(
        "http://159.203.58.60:5000/presignup/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );

      if (!checkResponse.ok) {
        // If response is not ok, the email might already exist
        const errorData = await checkResponse.json();
        setEmailError(
          errorData.error ||
            "This email is already registered. Please use a different email."
        );
        return;
      }

      // If we get here, the email is available (doesn't exist yet)
      // Now send OTP to the new email using the correct endpoint
      const otpResponse = await fetch(
        "http://159.203.58.60:5000/otp/email/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );

      const otpData = await otpResponse.json();

      if (otpData.message === "OTP sent successfully") {
        setEmailChangeStep(2);
        setCountdown(60); // Start 60 second countdown for resend
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
      console.error("Error in email check/OTP generation:", error);
      setEmailError("An error occurred. Please try again.");
    }
  };

  const handleOtpSubmit = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      setEmailError("Please enter the complete 6-digit verification code");
      return;
    }

    try {
      setEmailError("");

      // First verify the OTP using the correct endpoint
      const verifyResponse = await fetch(
        "http://159.203.58.60:5000/otp/email/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newEmail,
            otp: emailOtp,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // If OTP is verified, update the realtor's email
        // Join firstName and lastName for the API request
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        const updateResponse = await fetch(
          `http://159.203.58.60:5000/realtor/${realtor._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fullName,
              email: newEmail, // Update with new email
              rewardsAddress: formData.rewardsAddress,
              rewardsCity: formData.rewardsCity,
              rewardsPostalCode: formData.rewardsPostalCode,
              brokerageInfo: {
                brokerageName: formData.brokerageName,
                brokerageAddress: formData.brokerageAddress,
                brokerageCity: formData.brokerageCity,
                brokeragePostalCode: formData.brokeragePostalCode,
                brokeragePhone: formData.brokeragePhone,
                brokerageEmail: formData.brokerageEmail,
                licenseNumber: formData.licenseNumber,
              },
            }),
          }
        );

        if (updateResponse.ok) {
          // Update local form data with new email
          setFormData((prev) => ({ ...prev, email: newEmail }));
          setEmailChangeStep(3);
          setEmailChangeSuccess(true);

          setFeedback({
            message: "Email updated successfully!",
            type: "success",
          });

          // Close the modal after showing success for 2 seconds
          setTimeout(() => {
            setShowEmailModal(false);
            setEmailChangeSuccess(false);
          }, 2000);
        } else {
          setEmailError("Failed to update email. Please try again.");
        }
      } else {
        setEmailError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error in email verification/update:", error);
      setEmailError("Failed to verify code. Please try again.");
    }
  };

  // Handle close with data refresh
  const handleClose = () => {
    // If profile has been modified, refresh the data
    if (realtor && realtor._id) {
      fetchRefreshData(realtor._id);
    }

    // Call the original onClose prop
    if (onClose) onClose();
  };

  // Update the handleFieldChange function to capture the latest state value

  const handleFieldChange = (field, value) => {
    // Update form data with the new value
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      // Clear any existing timer when the user types
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set a new timer for auto-save after 2 seconds of inactivity
      // Use the UPDATED data in the timer callback
      saveTimerRef.current = setTimeout(() => {
        handleSubmitWithData(updatedData);
      }, 2000);

      return updatedData;
    });
  };

  // Add a new helper function that accepts the current form data
  const handleSubmitWithData = (currentFormData) => {
    // Prevent duplicate save calls
    if (isSaving) return;

    try {
      setIsSaving(true);
      // Join firstName and lastName before sending to API
      const fullName =
        `${currentFormData.firstName} ${currentFormData.lastName}`.trim();

      fetch(`http://159.203.58.60:5000/realtor/${realtor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName, // Send the combined name to maintain API compatibility
          rewardsAddress: currentFormData.rewardsAddress,
          rewardsCity: currentFormData.rewardsCity,
          rewardsPostalCode: currentFormData.rewardsPostalCode,
          brokerageInfo: {
            brokerageName: currentFormData.brokerageName,
            brokerageAddress: currentFormData.brokerageAddress,
            brokerageCity: currentFormData.brokerageCity,
            brokeragePostalCode: currentFormData.brokeragePostalCode,
            brokeragePhone: currentFormData.brokeragePhone,
            brokerageEmail: currentFormData.brokerageEmail,
            licenseNumber: currentFormData.licenseNumber,
          },
        }),
      })
        .then((response) => {
          if (response.ok) {
            // Show success notification
            setSaveSuccess(true);

            // Fade in animation
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
          } else {
            setFeedback({ message: "Failed to update profile", type: "error" });
          }
        })
        .catch((error) => {
          console.error("Profile update error:", error);
          setFeedback({ message: "Error updating profile", type: "error" });
        })
        .finally(() => {
          setIsSaving(false);
        });
    } catch (error) {
      console.error("Profile update error:", error);
      setFeedback({ message: "Error updating profile", type: "error" });
      setIsSaving(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setEmailError("");
      const response = await fetch(
        "http://159.203.58.60:5000/otp/email/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );

      const data = await response.json();

      if (data.message === "OTP sent successfully") {
        setEmailOtp("");
        setCountdown(60); // Start 60 second countdown
      } else {
        setEmailError("Failed to resend code. Please try again.");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setEmailError("Failed to resend verification code.");
    }
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setEmailError("");
  };

  // Populate form with existing data
  useEffect(() => {
    if (realtor) {
      // Split name into firstName and lastName
      const nameParts = realtor.name ? realtor.name.split(" ") : ["", ""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Fetch shareable link when the component mounts
      fetchShareableLink();

      setFormData({
        firstName: firstName,
        lastName: lastName,
        phone: realtor.phone || "",
        email: realtor.email || "",
        rewardsAddress: realtor.rewardsAddress || realtor.location || "",
        rewardsCity: realtor.rewardsCity || "",
        rewardsPostalCode: realtor.rewardsPostalCode || "",
        brokerageName: realtor.brokerageInfo?.brokerageName || "",
        brokerageAddress: realtor.brokerageInfo?.brokerageAddress || "",
        brokerageCity: realtor.brokerageInfo?.brokerageCity || "",
        brokeragePostalCode: realtor.brokerageInfo?.brokeragePostalCode || "",
        brokeragePhone: realtor.brokerageInfo?.brokeragePhone || "",
        brokerageEmail: realtor.brokerageInfo?.brokerageEmail || "",
        licenseNumber: realtor.brokerageInfo?.licenseNumber || "",
      });
    }
  }, [realtor]);

  // Add useEffect for countdown timer if it doesn't exist already
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

  // Update the existing handleSubmit function
  const handleSubmit = async () => {
    // Prevent duplicate save calls
    if (isSaving) return;

    try {
      setIsSaving(true);
      // Join firstName and lastName before sending to API
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName, // Send the combined name to maintain API compatibility
            rewardsAddress: formData.rewardsAddress,
            rewardsCity: formData.rewardsCity,
            rewardsPostalCode: formData.rewardsPostalCode,
            brokerageInfo: {
              brokerageName: formData.brokerageName,
              brokerageAddress: formData.brokerageAddress,
              brokerageCity: formData.brokerageCity,
              brokeragePostalCode: formData.brokeragePostalCode,
              brokeragePhone: formData.brokeragePhone,
              brokerageEmail: formData.brokerageEmail,
              licenseNumber: formData.licenseNumber,
            },
          }),
        }
      );

      if (response.ok) {
        // Show success notification
        setSaveSuccess(true);
        setFeedback({
          message: "Profile updated successfully!",
          type: "success",
        });

        // Fade in animation
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
      } else {
        setFeedback({ message: "Failed to update profile", type: "error" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setFeedback({ message: "Error updating profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor._id}/updatepassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Password updated successfully!",
          type: "success",
        });
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsPasswordModalOpen(false);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update password");
      }
    } catch (error) {
      setError("Error updating password");
    }
  };

  const handleProfilePicture = async () => {
    Alert.alert("Change Profile Picture", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () => pickImage("camera"),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImage("gallery"),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const pickImage = async (source) => {
    try {
      let result;
      const options = {
        mediaTypes: "Images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      };

      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "We need camera permissions to make this work!"
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "We need gallery permissions to make this work!"
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        const asset = result.assets[0];
        const formData = new FormData();
        const fileType = asset.uri.split(".").pop() || "jpg";

        formData.append("profilePicture", {
          uri: asset.uri,
          type: `image/${fileType}`,
          name: `profile-picture.${fileType}`,
        });

        const response = await fetch(
          `http://159.203.58.60:5000/realtor/profilepic/${realtor._id}`,
          {
            method: "POST",
            body: formData,
            // Do NOT set the "Content-Type" header manually!
          }
        );

        if (response.ok) {
          setFeedback({
            message: "Profile picture updated successfully!",
            type: "success",
          });
          // Optionally refresh context to get the new image
        } else {
          setFeedback({
            message: "Failed to update profile picture",
            type: "error",
          });
        }
      }
    } catch (error) {
      setFeedback({
        message: "Error updating profile picture",
        type: "error",
      });
      console.error("Profile pic upload error:", error);
    }
  };
  const handleLogout = async () => {
    console.log("Logging out...");
    setFeedback({ message: "", type: "" });
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      setFeedback({
        message: "Error logging out",
        type: "error",
      });
    }
  };
  const copyInviteCode = () => {
    if (realtor?.inviteCode) {
      Clipboard.setString(realtor.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const copyShareableLink = () => {
    if (shareableLink) {
      Clipboard.setString(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Add swipe gesture handling
  const panY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(translateY, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(translateY, {
    toValue: Dimensions.get("window").height,
    duration: 200,
    useNativeDriver: true,
  });

  // If no realtor data yet
  if (!realtor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      {/* Header: Avatar, Name, Info - Updated to match Figma Android design */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePicture}>
          {realtor.profilePicture ? (
            <Image
              source={{
                uri: `http://159.203.58.60:5000/realtor/profilepic/${realtor._id}`,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {formData.firstName
                  ? formData.firstName.charAt(0).toUpperCase()
                  : "R"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.realtorName}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>
      </View>
      {/* Feedback Messages */}
      {feedback.message ? (
        <View
          style={[
            styles.feedbackBox,
            feedback.type === "success" ? styles.successBox : styles.errorBox,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === "success"
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}
      {/* Personal Info (Disabled fields for name, email, phone, location) */}
      <View style={styles.section}>
        <Text style={styles.sectionSubTitle}>
          Keep your personal info up-to-date
        </Text>
        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: COLORS.silver }]}
            value={formData.firstName}
            placeholder="First Name"
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: COLORS.silver }]}
            value={formData.lastName}
            editable={false}
            placeholder="Last Name"
          />
        </View>
        <View style={styles.formGroup}>
          <View style={styles.emailContainer}>
            <TextInput
              placeholder="Email"
              style={[styles.emailInput, { backgroundColor: COLORS.silver }]}
              value={formData.email}
              editable={false}
            />
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={handleEmailChangeStart}
            >
              <Text style={styles.changeEmailText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: COLORS.silver }]}
            value={formData.phone}
            editable={false}
            placeholder="Phone"
          />
        </View>
        <Text style={styles.sectionSubTitle}>Send my rewards to:</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.rewardsAddress}
            placeholder="Address"
            onChangeText={(text) => handleFieldChange("rewardsAddress", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.rewardsCity}
            placeholder="City"
            onChangeText={(text) => handleFieldChange("rewardsCity", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.rewardsPostalCode}
            placeholder="Postal Code"
            onChangeText={(text) =>
              handleFieldChange("rewardsPostalCode", text)
            }
          />
        </View>
      </View>
      {/* Brokerage Info (Editable) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Brokerage Information</Text>
        <Text style={styles.sectionSubTitle}>
          Make sure thing info is complete and up to date
        </Text>
        <View style={styles.formGroup}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: "#E4E4E4", borderColor: "#707070" },
            ]}
            value={"RECO ID - " + formData.licenseNumber}
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.brokerageName}
            placeholder="Brokerage Name"
            onChangeText={(text) => handleFieldChange("brokerageName", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            placeholder="Brokerage Address"
            value={formData.brokerageAddress}
            onChangeText={(text) => handleFieldChange("brokerageAddress", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.brokerageCity}
            placeholder="Brokerage City"
            onChangeText={(text) => handleFieldChange("brokerageCity", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            placeholder="Brokerage Postal Code"
            style={styles.input}
            value={formData.brokeragePostalCode}
            onChangeText={(text) =>
              handleFieldChange("brokeragePostalCode", text)
            }
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.brokeragePhone}
            placeholder="Brokerage Phone"
            onChangeText={(text) => handleFieldChange("brokeragePhone", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.brokerageEmail}
            placeholder="Brokerage Email"
            keyboardType="email-address"
            onChangeText={(text) => handleFieldChange("brokerageEmail", text)}
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
      {/* Notification Preferences (Push Notifications) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        {/* Client Accept */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Client Accept</Text>
          <TouchableOpacity
            onPress={() => toggleNotificationPref("clientAccept")}
            style={[
              styles.toggleSwitch,
              notificationPrefs.clientAccept && styles.toggleSwitchOn,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                notificationPrefs.clientAccept && styles.toggleThumbOn,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Client Pre-approval */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Client Pre-approval</Text>
          <TouchableOpacity
            onPress={() => toggleNotificationPref("clientPreApproval")}
            style={[
              styles.toggleSwitch,
              notificationPrefs.clientPreApproval && styles.toggleSwitchOn,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                notificationPrefs.clientPreApproval && styles.toggleThumbOn,
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
              notificationPrefs.marketingNotifications && styles.toggleSwitchOn,
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email</Text>
        <Text style={styles.sectionSubTitle}>
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
                notificationPrefs.termsOfServiceEmails && styles.toggleThumbOn,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Client Pre-approval Emails */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Client Pre-approval</Text>
          <TouchableOpacity
            onPress={() => toggleNotificationPref("clientPreApprovalEmails")}
            style={[
              styles.toggleSwitch,
              notificationPrefs.clientPreApprovalEmails &&
                styles.toggleSwitchOn,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                notificationPrefs.clientPreApprovalEmails &&
                  styles.toggleThumbOn,
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Code</Text>
        {/* Invite Code Section - Added for realtor invites */}
        {realtor?.inviteCode && (
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Your Invite Code:</Text>
            <View style={styles.inviteCodeWrapper}>
              <Text style={styles.inviteCode}>{realtor.inviteCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyInviteCode}
                activeOpacity={0.7}
              >
                <Text style={styles.copyButtonText}>
                  {codeCopied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inviteCodeHint}>
              Share this code with clients and realtors to earn rewards
            </Text>
            {shareableLink && (
              <View style={styles.shareableLinkContainer}>
                <Text style={styles.shareableLinkLabel}>
                  Shareable Referral Link:
                </Text>
                <View style={styles.shareableLinkWrapper}>
                  <Text
                    style={styles.shareableLink}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {shareableLink}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={copyShareableLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyButtonText}>
                      {linkCopied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.inviteCodeHint}>
                  Share this link with potential clients for easy referrals
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      {/* Password Management */}
      <View>
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setIsPasswordModalOpen(true)}
        >
          <Text style={styles.changePasswordButtonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* Password Modal */}
      <Modal visible={isPasswordModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={passwordForm.oldPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, oldPassword: text })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={passwordForm.newPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, newPassword: text })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={passwordForm.confirmPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: text })
                }
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalButtonText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.gray }]}
                onPress={() => {
                  setIsPasswordModalOpen(false);
                  setError("");
                  setPasswordForm({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Email Change Modal - New addition */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <Text style={styles.modalTitle}>
              {emailChangeStep === 1
                ? "Change Email Address"
                : emailChangeStep === 2
                ? "Verify Your Email"
                : "Email Updated!"}
            </Text>

            {!emailChangeSuccess && (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleEmailModalClose}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            )}

            {/* Error Message */}
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Step 1: Enter New Email */}
            {emailChangeStep === 1 && (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter your new email address below. We'll send a verification
                  code to this address.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Email Address"
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
                <Text style={styles.modalSubtitle}>
                  We've sent a verification code to {newEmail}. Enter it below
                  to verify your email address.
                </Text>
                <Text style={styles.pasteInstruction}>
                  Paste your 6-digit code in the field - it will handle full
                  codes automatically
                </Text>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  placeholder="Enter verification code"
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
            )}

            {/* Step 3: Success */}
            {emailChangeStep === 3 && (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={styles.successText}>
                  Email successfully updated!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Auto-save Success Notification */}
      {saveSuccess && (
        <Animated.View
          style={[styles.autoSaveNotification, { opacity: fadeAnim }]}
        >
          <Text style={styles.autoSaveText}>Changes saved!</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* Container for everything */
  container: {
    backgroundColor: "#F6F6F6",
    flex: 1, // Changed from width: "100%" to flex: 1
    paddingVertical: 100,
  },

  /* Header area with avatar and name */
  header: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
    flex: 1,
    paddingHorizontal: 16,
    height: 172,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 50, // Make it circular per design
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 32,
    borderRadius: 50,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 50, // Make it circular per design
    marginRight: 20,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  realtorName: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
  },

  /* Feedback box for success/error messages */
  feedbackBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: COLORS.noticeContainer,
  },
  errorBox: {
    backgroundColor: COLORS.coloredBackgroundFill,
  },
  feedbackText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  successText: {
    color: COLORS.green,
  },
  errorText: {
    color: COLORS.red,
  } /* Section wrapper */,
  section: {
    marginBottom: 32,
    backgroundColor: COLORS.white,
    padding: 16,
    gap: 8,
    borderRadius: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 2, height: 0 }, // Center shadow for all 4 sides
    shadowRadius: 4,
    elevation: 4, // For Android
  },
  sectionTitle: {
    alignSelf: "center",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 16,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: "500", // Adding quotes around the fontWeight value
    lineHeight: 14, // Changed from "100%" to a numeric value
    alignSelf: "center",
    fontFamily: "Futura",
    color: "#1D2327",
    marginBottom: 16,
    marginTop: 8,
  },

  /* Form groups */
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
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
    height: 48,
  },
  /* Save changes button */
  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  /* Password Management */
  changePasswordButton: {
    borderRadius: 50,
    borderColor: COLORS.green,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: "center",
  },
  changePasswordButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  /* Logout Button */
  logoutButton: {
    marginTop: 16,
    borderRadius: 50,
    borderColor: COLORS.green,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
  },

  /* Modal overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignSelf: "stretch", // Changed from width: "100%" to alignSelf: "stretch"
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  modalButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
  },

  /* Swipe handle */
  swipeHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  /* Close button */
  closeButton: {
    position: "absolute",
    right: 16,
    top: 48,
    width: 48,
    borderRadius: 50,
    backgroundColor: COLORS.silver,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.black,
    fontWeight: "bold",
    fontFamily: "Futura",
    lineHeight: 48,
  },

  /* Loading fallback */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  } /* Invite Code Section */,
  inviteCodeContainer: {
    backgroundColor: COLORS.coloredBackgroundFill,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 8,
  },
  inviteCodeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "Futura",
    fontSize: 14,
  },
  inviteCodeHint: {
    fontSize: 12,
    color: COLORS.slate,
    fontFamily: "Futura",
    fontStyle: "italic",
    marginBottom: 16,
  },

  /* Shareable Link Section */
  shareableLinkContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  shareableLinkLabel: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 8,
  },
  shareableLinkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  shareableLink: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.green,
    marginRight: 16,
  },

  /* Email Change Modal */
  successMessageContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.green,
    textAlign: "center",
    marginBottom: 16,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginRight: 16,
    height: 48,
  },
  changeEmailButton: {
    borderColor: COLORS.green,
    borderWidth: 2,
    borderRadius: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,

    justifyContent: "center",
    alignItems: "center",
  },
  changeEmailText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  pasteInstruction: {
    fontSize: 12,
    color: COLORS.green,
    fontFamily: "Futura",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  modalCloseButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.black,
    fontFamily: "Futura",
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.slate,
    marginBottom: 24,
  },
  fullWidthButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    alignSelf: "stretch", // Changed from width: "100%" to alignSelf: "stretch"
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
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
  resendButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: COLORS.green,
    fontWeight: "bold",
    fontFamily: "Futura",
    fontSize: 14,
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successIconText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  successText: {
    fontSize: 20,
    color: COLORS.black,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  /* Notification Toggle Styles */
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
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    marginBottom: 16,
  },

  autoSaveNotification: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.green,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
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
  autoSaveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
});
