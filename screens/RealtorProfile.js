import React, { useState, useEffect } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRealtor } from "../context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

export default function RealtorProfile() {
  const { realtorInfo } = useRealtor();
  const { logout } = useAuth();
  console.log(logout);
  const navigation = useNavigation();
  const realtor = realtorInfo; // If the context stores the realtor object here

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [error, setError] = useState("");

  // Main form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
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

  // Populate form with existing data
  useEffect(() => {
    if (realtor) {
      setFormData({
        name: realtor.name || "",
        phone: realtor.phone || "",
        email: realtor.email || "",
        location: realtor.location || "",
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
    if (!realtor?._id) return;

    try {
      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
        `http://54.89.183.155:5000/realtor/${realtor._id}/updatepassword`,
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
          `http://54.89.183.155:5000/realtor/profilepic/${realtor._id}`,
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

  // If no realtor data yet
  if (!realtor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header: Avatar, Name, Info */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePicture}>
          {realtor.profilePicture ? (
            <Image
              source={{
                uri: `http://54.89.183.155:5000/realtor/profilepic/${realtor._id}`,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {realtor.name ? realtor.name.charAt(0).toUpperCase() : "R"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.realtorName}>{realtor.name}</Text>
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.name}
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            value={formData.location}
            editable={false}
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
          <Text style={styles.label}>License Number:</Text>
          <TextInput
            style={styles.input}
            value={formData.licenseNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, licenseNumber: text })
            }
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

  /* Loading fallback */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
