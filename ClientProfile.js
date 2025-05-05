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
  Switch,
  Image,
} from "react-native";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";

export default function ClientProfile({ onClose }) {
  const { user, logout } = useAuth(); // if needed
  const { clientInfo } = useClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Additional toggles for notifications
  const [documentReminders, setDocumentReminders] = useState(false);
  const [documentApprovals, setDocumentApprovals] = useState(false);

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

  useEffect(() => {
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
      // If your backend returns these booleans, set them here
      // setDocumentReminders(clientInfo.documentReminders || false);
      // setDocumentApprovals(clientInfo.documentApprovals || false);
    }
  }, [clientInfo]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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

  const handleSubmit = async () => {
    try {
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
        // documentReminders,
        // documentApprovals,
      };
      const response = await axios.put(
        `http://44.202.249.124:5000/client/${clientInfo.id}`,
        payload
      );
      if (response.status === 200) {
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Error updating profile"
      );
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
        `http://44.202.249.124:5000/client/${clientInfo.id}/updatepassword`,
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

  return (
    <View style={styles.container}>
      {/* Close Button in top-right corner */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
            />
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address</Text>
          <Text style={styles.cardSubtitle}>
            Make sure thing info is complete and up to date.
          </Text>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.firstName + " " + formData.lastName}
              editable={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => handleChange("address", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => handleChange("city", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={formData.postalCode}
              onChangeText={(text) => handleChange("postalCode", text)}
            />
          </View>
        </View>

        {/* Notifications Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Document Reminders</Text>
            <TouchableOpacity
              onPress={() => setDocumentReminders(!documentReminders)}
              style={[
                styles.toggleSwitch,
                documentReminders && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  documentReminders && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Document Approvals</Text>
            <TouchableOpacity
              onPress={() => setDocumentApprovals(!documentApprovals)}
              style={[
                styles.toggleSwitch,
                documentApprovals && styles.toggleSwitchOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  documentApprovals && styles.toggleThumbOn,
                ]}
              />
            </TouchableOpacity>
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
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              secureTextEntry
              value={passwordData.oldPassword}
              onChangeText={(text) =>
                handlePasswordInputChange("oldPassword", text)
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) =>
                handlePasswordInputChange("newPassword", text)
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
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
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#A9A9A9" }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Container for everything
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 15,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#000",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 20,
    color: "#FFFFFF",
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
  logoutSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  profileTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#23231A",
    marginBottom: 5,
  },
  profileSubtitle: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Card style
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 10,
  },

  // Form
  formGroup: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#23231A",
    marginBottom: 10,
  },

  // Toggles
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
    color: "#23231A",
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#C4C4C4",
    justifyContent: "center",
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: "#019B8E",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOn: {
    marginLeft: 20,
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  saveButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  passwordButton: {
    backgroundColor: "#F04D4D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  passwordButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
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
  modalInput: {
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#23231A",
    marginBottom: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorMessage: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});
