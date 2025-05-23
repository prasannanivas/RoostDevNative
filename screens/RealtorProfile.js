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
  PanResponder,
  Animated,
  Dimensions,
  Clipboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRealtor } from "../context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

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

  // Add these state variables at the top of your component with the other state declarations
  const saveTimerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch shareable link
  const fetchShareableLink = async () => {
    if (!realtor?._id) return;

    try {
      const response = await fetch(
        `http://44.202.249.124:5000/realtor/${realtor._id}/shareable-link`
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
        "http://44.202.249.124:5000/presignup/email",
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
        "http://44.202.249.124:5000/otp/email/generate",
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
        "http://44.202.249.124:5000/otp/email/verify",
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
          `http://44.202.249.124:5000/realtor/${realtor._id}`,
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
      const fullName = `${currentFormData.firstName} ${currentFormData.lastName}`.trim();

      fetch(
        `http://44.202.249.124:5000/realtor/${realtor._id}`,
        {
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
        }
      )
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
        "http://44.202.249.124:5000/otp/email/generate",
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
        `http://44.202.249.124:5000/realtor/${realtor._id}`,
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
        `http://44.202.249.124:5000/realtor/${realtor._id}/updatepassword`,
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
          `http://44.202.249.124:5000/realtor/profilepic/${realtor._id}`,
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
        routes: [{ name: "Login" }],
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dy > 50) {
          closeAnim.start(() => {
            handleClose(); // Use handleClose instead of onClose
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

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
      {/* Add swipe handle at the top */}
      <View {...panResponder.panHandlers}>
        <View style={styles.swipeHandle} />
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Header: Avatar, Name, Info */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePicture}>
          {realtor.profilePicture ? (
            <Image
              source={{
                uri: `http://44.202.249.124:5000/realtor/profilepic/${realtor._id}`,
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
          <Text style={styles.infoSubtitle}>
            Keep your personal info up to date
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
        <Text style={styles.sectionTitle}>Personal Information</Text>
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
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.firstName}
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.lastName}
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email:</Text>
          <View style={styles.emailContainer}>
            <TextInput
              style={[styles.emailInput, { backgroundColor: "#F0F0F0" }]}
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
          <Text style={styles.label}>Phone:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.phone}
            editable={false}
          />
        </View>
        <Text style={styles.sectionSubTitle}>Send my rewards to:</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address:</Text>
          <TextInput
            style={styles.input}
            value={formData.rewardsAddress}
            onChangeText={(text) => handleFieldChange("rewardsAddress", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>City:</Text>
          <TextInput
            style={styles.input}
            value={formData.rewardsCity}
            onChangeText={(text) => handleFieldChange("rewardsCity", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Postal Code:</Text>
          <TextInput
            style={styles.input}
            value={formData.rewardsPostalCode}
            onChangeText={(text) =>
              handleFieldChange("rewardsPostalCode", text)
            }
          />
        </View>
      </View>

      {/* Brokerage Info (Editable) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Brokerage Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Name:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageName}
            onChangeText={(text) => handleFieldChange("brokerageName", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Address:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageAddress}
            onChangeText={(text) => handleFieldChange("brokerageAddress", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage City:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageCity}
            onChangeText={(text) => handleFieldChange("brokerageCity", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Postal Code:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokeragePostalCode}
            onChangeText={(text) =>
              handleFieldChange("brokeragePostalCode", text)
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Phone:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokeragePhone}
            onChangeText={(text) => handleFieldChange("brokeragePhone", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Email:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageEmail}
            keyboardType="email-address"
            onChangeText={(text) => handleFieldChange("brokerageEmail", text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>RECO ID:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.licenseNumber}
            editable={false}
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Password Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Management</Text>
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setIsPasswordModalOpen(true)}
        >
          <Text style={styles.changePasswordButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
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
                style={[styles.modalButton, { backgroundColor: "#999" }]}
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
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  placeholder="Enter verification code"
                  keyboardType="numeric"
                  value={emailOtp}
                  onChangeText={(text) => setEmailOtp(text)}
                  maxLength={6}
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
    padding: 20,
    backgroundColor: "#FFFFFF",
    width: "90%",
  },

  /* Header area with avatar and name */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#999999",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerTextContainer: {
    flex: 1,
  },
  realtorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#23231A",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#666666",
  },

  /* Feedback box for success/error messages */
  feedbackBox: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  successBox: {
    backgroundColor: "#d4edda",
  },
  errorBox: {
    backgroundColor: "#f8d7da",
  },
  feedbackText: {
    textAlign: "center",
    fontSize: 14,
  },
  successText: {
    color: "#155724",
  },
  errorText: {
    color: "#721c24",
  },

  /* Section wrapper */
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  sectionSubTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#019B8E",
    marginBottom: 12,
    marginTop: 5,
  },

  /* Form groups */
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#23231A",
  },

  /* Save changes button */
  saveButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Password Management */
  changePasswordButton: {
    backgroundColor: "#F04D4D",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  changePasswordButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Logout Button */
  logoutButton: {
    backgroundColor: "#F04D4D",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Modal overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "100%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Swipe handle */
  swipeHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  /* Close button */
  closeButton: {
    position: "absolute",
    right: 15,
    top: 45, // Increased top padding for better accessibility
    width: 36, // Increased touch target size
    height: 36, // Increased touch target size
    borderRadius: 18,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    elevation: 3, // Add elevation for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButtonText: {
    fontSize: 18, // Slightly larger text
    color: "#333333",
    fontWeight: "600",
    lineHeight: 36, // Match the height for vertical centering
  },

  /* Loading fallback */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  /* Invite Code Section */
  inviteCodeContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: "#23231A",
    fontWeight: "600",
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
    color: "#019B8E",
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: "#019B8E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  inviteCodeHint: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 15,
  },

  /* Shareable Link Section */
  shareableLinkContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  shareableLinkLabel: {
    fontSize: 14,
    color: "#23231A",
    fontWeight: "600",
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
    color: "#019B8E",
    marginRight: 10,
  },

  /* Email Change Modal */
  successMessageContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  successMessage: {
    fontSize: 16,
    color: "#155724",
    textAlign: "center",
    marginBottom: 15,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#23231A",
    marginRight: 10,
  },
  changeEmailButton: {
    backgroundColor: "#019B8E",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changeEmailText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalCloseButton: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  modalCloseText: {
    fontSize: 24,
    color: "#23231A",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  fullWidthButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 20,
  },
  resendButton: {
    marginTop: 15,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: "#019B8E",
    fontWeight: "600",
    fontSize: 14,
  },
  resendButtonTextDisabled: {
    color: "#999999",
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  successIconText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },
  successText: {
    fontSize: 18,
    color: "#23231A",
    fontWeight: "600",
  },
  errorText: {
    color: "#F04D4D",
    fontSize: 14,
    marginBottom: 10,
  },

  autoSaveNotification: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#019B8E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  autoSaveText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
