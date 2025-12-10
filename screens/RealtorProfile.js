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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { useRealtor } from "../context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Path } from "react-native-svg";
import {
  formatPhoneNumber,
  unFormatPhoneNumber,
} from "../utils/phoneFormatUtils";
import LogoutConfirmationModal from "../components/LogoutConfirmationModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import ChatModal from "../components/ChatModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import ChangeEmailModal from "../components/modals/ChangeEmailModal";
import { trimLeft, trimFull } from "../utils/stringUtils";
import AnimatedRadialBackground from "../components/AnimatedRadialBackground";

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
  coloredBackgroundFill: "rgba(55, 116, 115, 0.2)", // 10% green opacity
};

// Scroll Animation Thresholds
const SCROLL_ANIMATION = {
  START: 60,  // Animation starts at this scroll position
  END: 110,   // Animation completes at this scroll position
  HEADER_SWITCH: 100, // isScrolled state changes at this position
};

export default function RealtorProfile({ onClose, preloadedImage }) {
  const { realtorInfo, fetchRefreshData } = useRealtor();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const realtor = realtorInfo;
  const [imageWasUpdated, setImageWasUpdated] = useState(false);
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

  // Email change state
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);

  // Add scroll state for header transition
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollAnimation = useRef(new Animated.Value(0)).current;

  // Notification preferences - stored locally
  const [notificationPrefs, setNotificationPrefs] = useState({
    // Push notifications
    // Use nullish coalescing so an explicit false from backend is preserved
    clientAccept: realtor?.notificationPreferences?.clientAccept ?? true,
    clientPreApproval:
      realtor?.notificationPreferences?.clientPreApproval ?? true,
    marketingNotifications:
      realtor?.notificationPreferences?.marketingNotifications ?? true,

    // Email notifications
    clientAcceptEmails:
      realtor?.notificationPreferences?.clientAcceptEmails ?? true,
    clientPreApprovalEmails:
      realtor?.notificationPreferences?.clientPreApprovalEmails ?? true,
    marketingEmails: realtor?.notificationPreferences?.marketingEmails ?? true,
  });

  // Add these state variables at the top of your component with the other state declarations
  const saveTimerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile picture upload states
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [imageLoaded, setImageLoaded] = useState(false);
  const placeholderFadeAnim = useRef(new Animated.Value(1)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;

  // Field validation error states
  const [fieldErrors, setFieldErrors] = useState({
    brokeragePhone: false,
    brokerageEmail: false,
  });

  // Field-specific error messages
  const [fieldErrorMessages, setFieldErrorMessages] = useState({
    brokeragePhone: "",
    brokerageEmail: "",
  });

  // Animation for save success notification
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Toggle switch animations
  const toggleAnimations = useRef({
    clientAccept: new Animated.Value(
      realtor?.notificationPreferences?.clientAccept ?? true ? 1 : 0
    ),
    clientPreApproval: new Animated.Value(
      realtor?.notificationPreferences?.clientPreApproval ?? true ? 1 : 0
    ),
    marketingNotifications: new Animated.Value(
      realtor?.notificationPreferences?.marketingNotifications ?? true ? 1 : 0
    ),
    clientAcceptEmails: new Animated.Value(
      realtor?.notificationPreferences?.clientAcceptEmails ?? true ? 1 : 0
    ),
    clientPreApprovalEmails: new Animated.Value(
      realtor?.notificationPreferences?.clientPreApprovalEmails ?? true ? 1 : 0
    ),
    marketingEmails: new Animated.Value(
      realtor?.notificationPreferences?.marketingEmails ?? true ? 1 : 0
    ),
  }).current;

  // Validation functions
  const validateEmail = (email) => {
    if (!email || email.trim() === "") return true; // Empty is allowed
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") return true; // Empty is allowed
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");
    // Check if it's a valid North American phone number (10 or 11 digits)
    // 10 digits: (123) 456-7890 or 123-456-7890
    // 11 digits: +1 123 456 7890 or 1-123-456-7890 (must start with 1)
    return (
      digitsOnly.length === 10 ||
      (digitsOnly.length === 11 && digitsOnly.startsWith("1"))
    );
  };

  // Load notification preferences when component mounts
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const CloseButton = ({ onPress, style }) => {
    return (
      <TouchableOpacity
        style={[style, { zIndex: 9999 }]} // Keep high z-index to ensure it's on top
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
          <Circle cx="18.5" cy="18.5" r="18.5" fill="none" />
          <Path
            d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
            fill="#A9A9A9"
          />
        </Svg>
      </TouchableOpacity>
    );
  };

  // Load notification preferences from AsyncStorage
  const loadNotificationPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem(
        "realtorNotificationPreferences" + realtor._id
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
      // Save to backend
      console.log("Notification prefs", newPrefs);
      const response = await fetch(
        `https://signup.roostapp.io/notifications/preferences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            realtorId: realtor._id,
            notificationPrefs: newPrefs,
          }),
        }
      );

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "<no body>";
        }
        console.log(
          "Failed to save notification preferences to server:",
          errorText
        );
      } else {
        await AsyncStorage.setItem(
          "realtorNotificationPreferences" + realtor._id,
          JSON.stringify(newPrefs)
        );
      }
    } catch (error) {
      console.log("Error saving notification preferences:", error);
    }
  };

  // Toggle notification preferences
  const toggleNotificationPref = (key) => {
    const newValue = !notificationPrefs[key];
    const newPrefs = {
      ...notificationPrefs,
      [key]: newValue,
    };

    // Animate the toggle
    Animated.timing(toggleAnimations[key], {
      toValue: newValue ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();

    setNotificationPrefs(newPrefs);
    saveNotificationPreferences(newPrefs);
  };

  // Fetch shareable link
  const fetchShareableLink = async () => {
    if (!realtor?._id) return;

    try {
      const response = await fetch(
        `https://signup.roostapp.io/realtor/${realtor._id}/shareable-link`
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
    setShowEmailModal(true);
  };

  // Handle close with data refresh
  const handleClose = () => {
    // If profile has been modified, refresh the data
    if (realtor && realtor._id) {
      fetchRefreshData(realtor._id);
    }

    // Call the original onClose prop with imageWasUpdated flag
    if (onClose) onClose(imageWasUpdated);
  };

  // Update the handleFieldChange function to capture the latest state value

  const handleFieldChange = (field, value) => {
    // Check if the field that's being changed would now be valid
    if (field === "brokeragePhone") {
      const isValid = validatePhone(value);
      if (isValid && fieldErrors.brokeragePhone) {
        // Clear field error and feedback only when field becomes valid
        setFieldErrors((prev) => ({ ...prev, brokeragePhone: false }));
        setFieldErrorMessages((prev) => ({ ...prev, brokeragePhone: "" }));
        setFeedback({ message: "", type: "" });
      }
    }
    if (field === "brokerageEmail") {
      const isValid = validateEmail(value);
      if (isValid && fieldErrors.brokerageEmail) {
        // Clear field error and feedback only when field becomes valid
        setFieldErrors((prev) => ({ ...prev, brokerageEmail: false }));
        setFieldErrorMessages((prev) => ({ ...prev, brokerageEmail: "" }));
        setFeedback({ message: "", type: "" });
      }
    }

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

    // Validate brokerage phone and email before submitting
    const brokeragePhoneValid = validatePhone(currentFormData.brokeragePhone);
    const brokerageEmailValid = validateEmail(currentFormData.brokerageEmail);

    // Update field error states and messages
    setFieldErrors({
      brokeragePhone: !brokeragePhoneValid,
      brokerageEmail: !brokerageEmailValid,
    });

    setFieldErrorMessages({
      brokeragePhone: !brokeragePhoneValid
        ? "Please enter a valid phone number (10-11 digits)"
        : "",
      brokerageEmail: !brokerageEmailValid
        ? "Please enter a valid email address"
        : "",
    });

    if (!brokeragePhoneValid) {
      return;
    }

    if (!brokerageEmailValid) {
      return;
    }

    // Clear any previous error messages and field errors
    setFeedback({ message: "", type: "" });
    setFieldErrors({
      brokeragePhone: false,
      brokerageEmail: false,
    });
    setFieldErrorMessages({
      brokeragePhone: "",
      brokerageEmail: "",
    });

    try {
      setIsSaving(true);
      // Join firstName and lastName before sending to API
      const fullName =
        `${currentFormData.firstName} ${currentFormData.lastName}`.trim();

      fetch(`https://signup.roostapp.io/realtor/${realtor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName, // Send the combined name to maintain API compatibility
          phone: currentFormData.phone,
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
        "https://signup.roostapp.io/otp/email/generate",
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

  // Update the existing handleSubmit function
  const handleSubmit = async () => {
    // Prevent duplicate save calls
    if (isSaving) return;

    try {
      setIsSaving(true);
      // Join firstName and lastName before sending to API
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const response = await fetch(
        `https://signup.roostapp.io/realtor/${realtor._id}`,
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
  const handlePasswordChange = async (passwordData) => {
    try {
      const response = await fetch(
        `https://signup.roostapp.io/realtor/${realtor._id}/updatepassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Password updated successfully!",
          type: "success",
        });
        setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update password");
      }
    } catch (error) {
      throw new Error(error.message || "Error updating password");
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
      console.log(`Opening ${source}...`);
      let result;
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      };

      if (source === "camera") {
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert(
            "Permission Denied",
            "We need camera permissions to make this work!"
          );
          console.log("Camera permission denied");
          return;
        }
        console.log("Launching camera...");
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert(
            "Permission Denied",
            "We need gallery permissions to make this work!"
          );
          console.log("Media library permission denied");
          return;
        }
        console.log("Launching image picker...");
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      console.log("Image picker result:", JSON.stringify(result));
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("Selected image:", selectedAsset.uri);
        setSelectedImage(selectedAsset.uri);
        // Automatically upload the image
        await uploadProfilePicture(selectedAsset.uri);
      } else {
        console.log("No image selected or picker was canceled");
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert(
        "Error",
        "There was a problem selecting your image. Please try again."
      );
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    setUploadingProfilePic(true);
    try {
      console.log("Starting image upload process...");
      console.log("Image URI:", imageUri);

      // Compress the image to 1024x1024 max size with quality 0.8
      console.log("Compressing image...");
      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024, height: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log("Image compressed successfully");
      console.log("Compressed URI:", compressedImage.uri);

      // Create FormData for image upload
      const formData = new FormData();

      // Get file extension from the URI path
      const uriParts = compressedImage.uri.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileNameParts = fileName.split(".");
      const fileType = "jpg"; // Since we're forcing JPEG format in compression

      console.log("Detected file type:", fileType);

      formData.append("profilePicture", {
        uri: compressedImage.uri,
        type: `image/${fileType}`,
        name: `profile-picture.${fileType}`,
      });

      console.log("FormData created");
      console.log("Uploading to realtorId:", realtor._id);

      const uploadUrl = `https://signup.roostapp.io/realtor/profilepic/${realtor._id}`;
      console.log("Uploading to URL:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        // Do NOT set the "Content-Type" header manually!
      });

      console.log("Upload response status:", response.status);

      if (response.ok) {
        console.log("Profile picture uploaded successfully");
        setFeedback({
          message: "Profile picture updated successfully!",
          type: "success",
        });

        try {
          // Read the compressed file as base64 for local storage
          const base64Data = await FileSystem.readAsStringAsync(
            compressedImage.uri,
            { encoding: FileSystem.EncodingType.Base64 }
          );

          // Save to local storage with timestamp
          const imageData = {
            base64: base64Data,
            timestamp: Date.now(),
          };

          await AsyncStorage.setItem(
            `profileImage_${realtor._id}`,
            JSON.stringify(imageData)
          );

          console.log("Profile image saved to local storage");
        } catch (storageError) {
          console.error("Error saving image to local storage:", storageError);
        }

        // Refresh realtor data to include the new profile picture
        await fetchRefreshData(realtor._id);
        // Force image refresh by updating the cache-busting key
        setImageRefreshKey(Date.now());
        // Set flag that image was updated
        setImageWasUpdated(true);
        // Clear the selected image after successful upload
        setSelectedImage(null);
      } else {
        console.log("Server responded with status:", response.status);
        const errorData = await response.text();
        console.log("Error response:", errorData);
        setFeedback({
          message: "Failed to update profile picture",
          type: "error",
        });
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setFeedback({
        message: "Error updating profile picture",
        type: "error",
      });
      setSelectedImage(null);
    } finally {
      setUploadingProfilePic(false);
    }
  };
  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Show confirmation modal instead of direct logout
  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  // Actual logout logic
  const handleLogoutConfirmed = async () => {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : undefined}
    >
      {/* Success notification */}
      {saveSuccess && (
        <Animated.View style={[styles.saveNotification, { opacity: fadeAnim }]}>
          <Text style={styles.saveNotificationText}>Changes saved!</Text>
        </Animated.View>
      )}

      {/* Profile picture upload loading overlay */}
      {uploadingProfilePic && (
        <View style={styles.uploadLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.uploadLoadingText}>Uploading photo...</Text>
          <Text style={styles.uploadLoadingSubText}>
            Please wait while we process your image
          </Text>
        </View>
      )}

      {/* Close button */}

      {onClose && (
        <CloseButton onPress={handleClose} style={styles.closeButton} />
      )}

      <View style={styles.topMargin}></View>

      {/* Fixed Header: Avatar, Name, Info */}
      <Animated.View
        style={[
          styles.header,
          {
            position: "absolute",
            top: 63,
            left: 0,
            right: 0,
            zIndex: 100,
            borderTopRightRadius: 16,
            backgroundColor: scrollAnimation.interpolate({
              inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
              outputRange: [COLORS.background, COLORS.white],
              extrapolate: "clamp",
            }),
            height: scrollAnimation.interpolate({
              inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
              outputRange: [172, 84],
              extrapolate: "clamp",
            }),
            shadowOpacity: scrollAnimation.interpolate({
              inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
              outputRange: [0, 0.5],
              extrapolate: "clamp",
            }),
          },
          isScrolled && {
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [
                {
                  translateX: scrollAnimation.interpolate({
                    inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
                    outputRange: [0, -60],
                    extrapolate: "clamp",
                  }),
                },
                {
                  translateY: scrollAnimation.interpolate({
                    inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
                    outputRange: [0, -10],
                    extrapolate: "clamp",
                  }),
                },
                {
                  scale: scrollAnimation.interpolate({
                    inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
                    outputRange: [1, 0.5],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleProfilePicture}
            disabled={uploadingProfilePic}
          >
            <View style={{ position: "relative", width: 90, height: 90 }}>
              {/* Blue Circle Background - This will fade out */}
              <Animated.View
                style={[
                  styles.avatarPlaceholder,
                  uploadingProfilePic && styles.avatarUploading,
                  { opacity: placeholderFadeAnim, position: "absolute" },
                ]}
              >
                <Text style={styles.avatarInitial}>
                  {formData.firstName
                    ? formData.firstName.charAt(0).toUpperCase() +
                      formData.lastName.charAt(0).toUpperCase()
                    : "R"}
                </Text>
              </Animated.View>

              {/* Profile Image - This will fade in when loaded */}
              {(selectedImage || realtor.profilePicture || preloadedImage) && (
                <Animated.Image
                  source={
                    selectedImage
                      ? { uri: selectedImage }
                      : preloadedImage
                      ? preloadedImage // This will use the base64 data image
                      : {
                          uri: `https://signup.roostapp.io/realtor/profilepic/${realtor._id}?t=${imageRefreshKey}`,
                        }
                  }
                  style={[
                    styles.avatar,
                    {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 2,
                      opacity: imageFadeAnim,
                    },
                    uploadingProfilePic && styles.avatarUploading,
                  ]}
                  // Adding fadeDuration of 0 to make the image appear instantly if it's preloaded
                  fadeDuration={preloadedImage ? 0 : 300}
                  onLoad={() => {
                    setImageLoaded(true);
                    // Run parallel animations for a smooth transition
                    Animated.parallel([
                      // Fade out the placeholder
                      Animated.timing(placeholderFadeAnim, {
                        toValue: 0,
                        duration: 1300,
                        useNativeDriver: true,
                      }),
                      // Fade in the actual image
                      Animated.timing(imageFadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                />
              )}
              {uploadingProfilePic && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.green} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              top: scrollAnimation.interpolate({
                inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
                outputRange: [120, 60],
                extrapolate: "clamp",
              }),
            },
            isScrolled && {
              left: "40%",
              justifyContent: "center",
              alignItems: "left",
              height: 84,
              maxWidth: "45%",
              marginLeft: 8,
              top: 0,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.realtorName,
              {
                fontSize: scrollAnimation.interpolate({
                  inputRange: [SCROLL_ANIMATION.START, SCROLL_ANIMATION.END],
                  outputRange: [24, 16],
                  extrapolate: "clamp",
                }),
                textAlign: "left",
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {/* David Wrobel */}
            {formData.firstName} {formData.lastName}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
      <View
        style={{
          position: "absolute",
          width: "100%",
          top: 63,
          backgroundColor: COLORS.black,
          height: 16,
          zIndex: 50,
        }}
      ></View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ zIndex: 20 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 235 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollAnimation } } }],
          {
            useNativeDriver: false,
            listener: (event) => {
              const scrollY = event.nativeEvent.contentOffset.y;
              setIsScrolled(scrollY > SCROLL_ANIMATION.HEADER_SWITCH);
            },
          }
        )}
        scrollEventThrottle={16}
      >
        <AnimatedRadialBackground />
        <View style={styles.section}>
          <Text style={styles.sectionSubTitle2}>
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
              style={[styles.input, { backgroundColor: COLORS.white }]}
              value={formatPhoneNumber(formData.phone)}
              keyboardType="phone-pad"
              onChangeText={(text) =>
                handleFieldChange("phone", unFormatPhoneNumber(text))
              }
              editable={true}
              placeholder="Phone"
            />
          </View>
          <Text style={styles.sectionSubTitle2}>Send my rewards to:</Text>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={formData.rewardsAddress}
              placeholder="Address"
              onChangeText={(text) =>
                handleFieldChange("rewardsAddress", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "rewardsAddress",
                  trimFull(formData.rewardsAddress)
                )
              }
              returnKeyType="done"
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={formData.rewardsCity}
              placeholder="City"
              returnKeyType="done"
              onChangeText={(text) =>
                handleFieldChange("rewardsCity", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange("rewardsCity", trimFull(formData.rewardsCity))
              }
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={formData.rewardsPostalCode}
              placeholder="Postal Code"
              onChangeText={(text) =>
                handleFieldChange("rewardsPostalCode", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "rewardsPostalCode",
                  trimFull(formData.rewardsPostalCode)
                )
              }
            />
          </View>
        </View>
        {/* Chat Support Button */}
        <TouchableOpacity
          style={styles.fullWidthButton}
          onPress={() => setShowChatModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}> Support Chat </Text>
        </TouchableOpacity>
        {/* Brokerage Info (Editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brokerage Info</Text>
          <Text style={styles.sectionSubTitle}>
            Make sure thing info is complete and up to date
          </Text>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={formData.brokerageName}
              placeholder="Brokerage Name"
              onChangeText={(text) =>
                handleFieldChange("brokerageName", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokerageName",
                  trimFull(formData.brokerageName)
                )
              }
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="Brokerage Address"
              value={formData.brokerageAddress}
              onChangeText={(text) =>
                handleFieldChange("brokerageAddress", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokerageAddress",
                  trimFull(formData.brokerageAddress)
                )
              }
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={formData.brokerageCity}
              placeholder="Brokerage City"
              onChangeText={(text) =>
                handleFieldChange("brokerageCity", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokerageCity",
                  trimFull(formData.brokerageCity)
                )
              }
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              placeholder="Brokerage Postal Code"
              style={styles.input}
              value={formData.brokeragePostalCode}
              onChangeText={(text) =>
                handleFieldChange("brokeragePostalCode", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokeragePostalCode",
                  trimFull(formData.brokeragePostalCode)
                )
              }
            />
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={[
                styles.input,
                fieldErrors.brokeragePhone && styles.inputError,
              ]}
              value={formatPhoneNumber(formData.brokeragePhone)}
              placeholder="Brokerage Phone"
              keyboardType="phone-pad"
              onChangeText={(text) =>
                handleFieldChange("brokeragePhone", unFormatPhoneNumber(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokeragePhone",
                  trimFull(formData.brokeragePhone)
                )
              }
            />
            {fieldErrorMessages.brokeragePhone ? (
              <Text style={styles.fieldErrorText}>
                {fieldErrorMessages.brokeragePhone}
              </Text>
            ) : null}
          </View>
          <View style={styles.formGroup}>
            <TextInput
              style={[
                styles.input,
                fieldErrors.brokerageEmail && styles.inputError,
              ]}
              value={formData.brokerageEmail}
              placeholder="Brokerage Email"
              keyboardType="email-address"
              onChangeText={(text) =>
                handleFieldChange("brokerageEmail", trimLeft(text))
              }
              onBlur={() =>
                handleFieldChange(
                  "brokerageEmail",
                  trimFull(formData.brokerageEmail)
                )
              }
            />
            {fieldErrorMessages.brokerageEmail ? (
              <Text style={styles.fieldErrorText}>
                {fieldErrorMessages.brokerageEmail}
              </Text>
            ) : null}
          </View>
          {/* <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity> */}
        </View>
        <View
          style={[
            styles.section,
            { paddingHorizontal: 0, backgroundColor: "transparent" },
          ]}
        >
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
        {/* Notification Preferences (Push Notifications) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          {/* Client Accept */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Client Accept</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("clientAccept")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor: toggleAnimations.clientAccept.interpolate({
                      inputRange: [0, 1],
                      outputRange: [COLORS.gray, COLORS.green],
                    }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX: toggleAnimations.clientAccept.interpolate(
                            {
                              inputRange: [0, 1],
                              outputRange: [0, 28],
                            }
                          ),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Client Pre-approval */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Client Pre-approval</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("clientPreApproval")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      toggleAnimations.clientPreApproval.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.gray, COLORS.green],
                      }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX:
                            toggleAnimations.clientPreApproval.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 28],
                            }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Marketing Notifications */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Marketing Notifications</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("marketingNotifications")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      toggleAnimations.marketingNotifications.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.gray, COLORS.green],
                      }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX:
                            toggleAnimations.marketingNotifications.interpolate(
                              {
                                inputRange: [0, 1],
                                outputRange: [0, 28],
                              }
                            ),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Email Notifications Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email</Text>
          {/* <Text style={styles.sectionSubTitle}>
            Manage what emails you receive from us
          </Text> */}

          {/* Terms of Service Updates */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Client Accept</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("clientAcceptEmails")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      toggleAnimations.clientAcceptEmails.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.gray, COLORS.green],
                      }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX:
                            toggleAnimations.clientAcceptEmails.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 28],
                            }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Client Pre-approval Emails */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Client Pre-approval</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("clientPreApprovalEmails")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      toggleAnimations.clientPreApprovalEmails.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.gray, COLORS.green],
                      }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX:
                            toggleAnimations.clientPreApprovalEmails.interpolate(
                              {
                                inputRange: [0, 1],
                                outputRange: [0, 28],
                              }
                            ),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Marketing Emails */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Marketing Emails</Text>
            <TouchableOpacity
              onPress={() => toggleNotificationPref("marketingEmails")}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      toggleAnimations.marketingEmails.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.gray, COLORS.green],
                      }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        {
                          translateX:
                            toggleAnimations.marketingEmails.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 28],
                            }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Management */}
        <View>
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setIsPasswordModalOpen(true)}
          >
            <Text style={styles.changePasswordButtonText}>Change password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteButtonText}>Delete my account</Text>
          </TouchableOpacity>
          <LogoutConfirmationModal
            visible={showLogoutModal}
            onConfirm={handleLogoutConfirmed}
            onCancel={() => setShowLogoutModal(false)}
            COLORS={COLORS}
          />
        </View>
      </ScrollView>

      <DeleteAccountModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onDeleted={() => {
          setShowDeleteModal(false);
          if (onClose) onClose();
        }}
        type="realtor"
        id={realtor.id || realtor._id}
        COLORS={COLORS}
        onLogout={handleLogoutConfirmed}
      />

      {/* Password Modal */}
      <ChangePasswordModal
        visible={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
        userType="realtor"
      />
      {/* Email Change Modal */}
      <ChangeEmailModal
        visible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        userId={realtor._id}
        userType="realtor"
        currentFormData={formData}
        fetchRefreshData={fetchRefreshData}
        onSuccess={(newEmail) => {
          setFormData((prev) => ({ ...prev, email: newEmail }));
          setFeedback({
            message: "Email updated successfully!",
            type: "success",
          });
        }}
      />

      {/* Chat Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        userId={realtor?.id || realtor?._id}
        userName={realtor?.name || realtor?.firstName + " " + realtor?.lastName}
        userType="realtor"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* Container for everything */
  container: {
    backgroundColor: COLORS.black,
    flex: 1, // Changed from width: "100%" to flex: 1
  },

  topMargin: {
    width: "110%",
    height: 63, // Space for avatar and title
    backgroundColor: COLORS.black,
    position: "absolute",
    top: 0,
    zIndex: 999,
  },

  closeButton: {
    position: "absolute",
    top: 66,
    right: 16,
    width: 37,
    height: 37,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Ensure it's always on top
  },

  /* Header area with avatar and name */
  header: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 60,
    backgroundColor: COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 60, // Make it circular per design
    marginBottom: 16,
  },
  avatarUploading: {
    opacity: 0.7,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 90,
    height: 90,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    marginBottom: 16,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.green,
    fontFamily: "Futura",
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    marginTop: 16 /* Add padding to account for the avatar container height */,
    paddingBottom: 120,
    zIndex: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  realtorName: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    textAlign: "center",
    color: COLORS.black,
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
    zIndex: 30, // Higher than ScrollView's zIndex: 20
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
    marginBottom: 16,
    backgroundColor: COLORS.white,
    padding: 24,
    marginHorizontal: 4,
    gap: 8,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 }, // 0px 0px offset
    shadowRadius: 4,
    elevation: 4, // For Android
  },
  sectionTitle: {
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: "500", // Adding quotes around the fontWeight value
    // lineHeight: 14, // Changed from "100%" to a numeric value
    alignSelf: "center",
    fontFamily: "Futura",
    color: "#707070",
    marginBottom: 8,
  },
  sectionSubTitle2: {
    fontSize: 14,
    fontWeight: "500", // Adding quotes around the fontWeight value
    lineHeight: 14, // Changed from "100%" to a numeric value
    alignSelf: "center",
    fontFamily: "Futura",
    color: "#1D2327",
    marginBottom: 4,
    marginTop: 8,
  },

  /* Form groups */
  formGroup: {
    marginBottom: 2,
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
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 42,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  inputError: {
    borderColor: COLORS.red,
    borderWidth: 2,
  },
  fieldErrorText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
    marginTop: 4,
    marginLeft: 4,
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
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 16,
  },
  changePasswordButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  /* Logout Button */
  logoutButton: {
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  deleteButton: {
    width: "100%",
    backgroundColor: COLORS.red,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 700,
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

  /* Loading fallback */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  } /* Invite Code Section */,
  inviteCodeContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.coloredBackgroundFill,
  },

  inviteCodeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  copyButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "Futura",
    fontSize: 12,
    fontWeight: 700,
  },
  inviteCodeHint: {
    fontSize: 12,
    color: COLORS.slate,
    alignSelf: "center",
    fontFamily: "Futura",
    fontStyle: "italic",
    marginBottom: 2,
  },

  /* Shareable Link Section */
  shareableLinkContainer: {
    marginTop: 16,
    paddingTop: 16,
  },
  inviteCodeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    fontFamily: "Futura",
    marginBottom: 2,
  },
  shareableLinkLabel: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "600",
    fontFamily: "Futura",
    marginBottom: 2,
  },
  shareableLinkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  shareableLink: {
    flex: 0.7,
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
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginRight: 16,
    minHeight: 42,
  },
  changeEmailButton: {
    borderColor: COLORS.green,
    borderWidth: 1,
    borderRadius: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  changeEmailText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: 700,
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
    borderRadius: 33,
    paddingVertical: 16,
    alignItems: "center",
    alignSelf: "stretch", // Changed from width: "100%" to alignSelf: "stretch"
    marginBottom: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
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
    letterSpacing: 8,
    marginBottom: 24,
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
    width: 52,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    justifyContent: "center",
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: COLORS.green,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: {
    marginLeft: 28,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    marginBottom: 16,
  },

  // Success notification (matches ClientProfile style)
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

  // Profile picture upload loading overlay
  uploadLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1000,
  },
  uploadLoadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.green,
    fontFamily: "Futura",
  },
  uploadLoadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.slate,
    fontFamily: "Futura",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
