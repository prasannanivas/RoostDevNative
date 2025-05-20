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

export default function RealtorProfile({ realtor: propRealtor, onClose }) {
  const { realtorInfo } = useRealtor();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const realtor = propRealtor || realtorInfo;
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

  // Handle brokerage info update
  const handleSubmit = async () => {
    try {
      // Join firstName and lastName before sending to API      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

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

      console.log("Response status:", response.status);

      if (response.ok) {
        setFeedback({
          message: "Profile updated successfully!",
          type: "success",
        });
      } else {
        setFeedback({ message: "Failed to update profile", type: "error" });
      }
    } catch (error) {
      setFeedback({ message: "Error updating profile", type: "error" });
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
            if (onClose) onClose();
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
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
            </View>{" "}
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
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.email}
            editable={false}
          />
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
            onChangeText={(text) =>
              setFormData({ ...formData, rewardsAddress: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>City:</Text>
          <TextInput
            style={styles.input}
            value={formData.rewardsCity}
            onChangeText={(text) =>
              setFormData({ ...formData, rewardsCity: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Postal Code:</Text>
          <TextInput
            style={styles.input}
            value={formData.rewardsPostalCode}
            onChangeText={(text) =>
              setFormData({ ...formData, rewardsPostalCode: text })
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
            onChangeText={(text) =>
              setFormData({ ...formData, brokerageName: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Address:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageAddress}
            onChangeText={(text) =>
              setFormData({ ...formData, brokerageAddress: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage City:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageCity}
            onChangeText={(text) =>
              setFormData({ ...formData, brokerageCity: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Postal Code:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokeragePostalCode}
            onChangeText={(text) =>
              setFormData({ ...formData, brokeragePostalCode: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Phone:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokeragePhone}
            onChangeText={(text) =>
              setFormData({ ...formData, brokeragePhone: text })
            }
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brokerage Email:</Text>
          <TextInput
            style={styles.input}
            value={formData.brokerageEmail}
            keyboardType="email-address"
            onChangeText={(text) =>
              setFormData({ ...formData, brokerageEmail: text })
            }
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
});
