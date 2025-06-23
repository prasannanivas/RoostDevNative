import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
  Clipboard, // Add Clipboard import
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";

const COLORS = {
  primary: "#377473", // Updated to green color as specified
  secondary: "#333333",
  white: "#FDFDFD", // Updated to specified white color
  black: "#000000",
  gray: "#CCCCCC",
  lightGray: "#F5F5F5",
  error: "#F44336",
  success: "#25D366",
  info: "#2196F3",
};

/**
 * InviteRealtorModal - A reusable component for inviting new realtors
 * @param {Object} props
 * @param {boolean} props.visible - Controls the visibility of the modal
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Object} props.realtorInfo - Information about the current realtor (for invite links)
 * @param {string} props.realtorId - ID of the current realtor
 */
const InviteRealtorModal = ({ visible, onClose, realtorInfo, realtorId }) => {
  // State variables for the form
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState({ msg: "", type: "" });
  const [inviteLink, setInviteLink] = useState(""); // Store the invite link from API response
  const [copied, setCopied] = useState(false); // Add state for copy feedback

  // Function to handle inviting a realtor
  const handleInviteRealtor = async () => {
    setInviteLoading(true);
    setInviteFeedback({ msg: "", type: "" });
    setShowContactOptions(false);

    // Validate that either email or phone is provided
    if (!inviteData.email && !inviteData.phone) {
      setInviteFeedback({ msg: "Phone or Email required", type: "error" });
      setInviteLoading(false);
      return;
    }

    try {
      // Build the message text
      const inviteMessage = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients`;

      // Construct the API payload - keep the format the same by combining first and last name
      const payload = {
        referenceName: `${inviteData.firstName} ${inviteData.lastName}`.trim(),
        email: inviteData.email,
        phone: inviteData.phone,
        type: "Realtor",
      }; // Send the invite via the API - keep loading indicator showing
      const resp = await fetch(
        `http://159.203.58.60:5000/realtor/${realtorId}/invite-realtor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      // Handle the response and set feedback
      if (resp.ok) {
        const responseData = await resp.json();
        setInviteLink(
          responseData.inviteLink || "http://signup.roostapp.io/signup.html"
        ); // Set the invite link from response
        setInviteFeedback({ msg: "Realtor invited!", type: "success" });

        // Instead of automatically opening apps, show contact option icons
        setShowContactOptions(true);

        // Don't automatically close the form so the user can use the contact options
        // The user can manually close the form when they're done
      } else {
        setInviteFeedback({
          msg: "Failed – try again",
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setInviteFeedback({ msg: "Error occurred", type: "error" });
    } finally {
      // Always ensure the loading indicator is removed when complete
      setInviteLoading(false);
    }
  };
  // Handle opening WhatsApp
  const openWhatsApp = () => {
    // Use the invite link returned from the API response if available
    const signupLink =
      inviteLink ||
      `http://159.203.58.60:5000/signup.html?realtorCode=${
        realtorInfo?.inviteCode || "http://159.203.58.60:5000/signup.html"
      }`;

    const whatsappMessage = `Hey ${
      inviteData.firstName
    }, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients. Click here to get started: ${
      inviteLink || signupLink
    }`;
    const phone = inviteData.phone.replace(/[^0-9]/g, "");
    let whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(
      whatsappMessage
    )}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            "WhatsApp not installed",
            "Please install WhatsApp to use this feature",
            [{ text: "OK" }]
          );
        }
      })
      .catch((err) => console.error("Error opening WhatsApp:", err));
  };
  // Handle opening SMS
  const openSMS = () => {
    // Use the invite link returned from the API response if available
    const signupLink =
      inviteLink ||
      `http://159.203.58.60:5000/signup.html?realtorCode=${
        realtorInfo?.inviteCode || ""
      }`;

    const smsMessage = `Hey ${
      inviteData.firstName
    }, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients. Click here to get started: ${
      inviteLink || signupLink
    }`;
    const smsUrl = `sms:${inviteData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.openURL(smsUrl).catch((err) =>
      console.error("Error opening SMS:", err)
    );
  };
  // Handle opening Email
  const openEmail = () => {
    // Use the invite link returned from the API response if available
    const signupLink =
      inviteLink ||
      `http://159.203.58.60:5000/signup.html?realtorCode=${
        realtorInfo?.inviteCode || ""
      }`;

    const emailSubject = "Join Roost";
    const emailBody = `Hey ${inviteData.firstName},

I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients.

Click here to get started: ${inviteLink || signupLink}

Looking forward to working with you!`;

    const mailtoUrl = `mailto:${inviteData.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Error opening email:", err)
    );
  };
  // Reset the form when closing
  const handleClose = () => {
    setShowContactOptions(false);
    setInviteData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setInviteFeedback({ msg: "", type: "" });
    setInviteLink(""); // Reset the invite link
    onClose();
  };

  // Function to handle copying the link to clipboard
  const handleCopyLink = () => {
    // Use the invite link returned from the API response if available
    const linkToCopy =
      inviteLink ||
      `http://signup.roostapp.io/signup.html?realtorCode=${
        realtorInfo?.inviteCode || ""
      }`;

    Clipboard.setString(linkToCopy);
    setCopied(true);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Entypo name="cross" size={24} color="#999" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>REFER A REALTOR</Text>
          <Text style={styles.modalSubtitle}>
            Invite your Realtor friends to use Roost
          </Text>

          {inviteFeedback.msg ? (
            <Text
              style={[
                styles.feedbackMsg,
                inviteFeedback.type === "success"
                  ? styles.success
                  : styles.error,
              ]}
            >
              {inviteFeedback.msg}
            </Text>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inviteData.firstName}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  firstName: t,
                }))
              }
              placeholder="First Name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inviteData.lastName}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  lastName: t,
                }))
              }
              placeholder="Last Name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              value={inviteData.email}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  email: t,
                }))
              }
              placeholder="Email"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={inviteData.phone}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  phone: t,
                }))
              }
              placeholder="Phone"
              placeholderTextColor="#999"
            />
          </View>

          {showContactOptions && inviteFeedback.type === "success" ? (
            <View style={styles.contactOptions}>
              <Text style={styles.contactOptionsTitle}>Contact via:</Text>
              <View style={styles.contactIcons}>
                {inviteData.phone && (
                  <>
                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={openWhatsApp}
                    >
                      <MaterialCommunityIcons
                        name="whatsapp"
                        size={32}
                        color={COLORS.success}
                      />
                      <Text style={styles.contactIconText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={openSMS}
                    >
                      <MaterialIcons name="sms" size={32} color={COLORS.info} />
                      <Text style={styles.contactIconText}>SMS</Text>
                    </TouchableOpacity>
                  </>
                )}
                {inviteData.email && (
                  <TouchableOpacity
                    style={styles.contactIconBtn}
                    onPress={openEmail}
                  >
                    <Entypo name="mail" size={32} color={COLORS.error} />
                    <Text style={styles.contactIconText}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.sendInviteBtn}
                onPress={handleClose}
              >
                <Text style={styles.sendInviteBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.sendInviteBtn,
                  inviteLoading && styles.modalBtnDisabled,
                ]}
                disabled={inviteLoading}
                onPress={handleInviteRealtor}
              >
                {inviteLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.sendInviteBtnText}>Send Invite</Text>
                )}
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.shareLinkContainer}>
                <Text style={styles.shareLinkText}>
                  Share this link with them
                </Text>
                <Text style={styles.linkText}>
                  {inviteLink ||
                    "http://signup.roostapp.io/?realtorCode=" +
                      (realtorInfo?.inviteCode || "")}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.copyButtonText}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white, // Using the updated white color (#FDFDFD)
    borderRadius: 15,
    padding: 30,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5,
    textAlign: "center",
    fontFamily: "futura",
    color: COLORS.black,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    fontFamily: "futura",
    fontWeight: "500",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "futura",
    backgroundColor: COLORS.white,
  },
  feedbackMsg: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },
  success: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    color: "#388E3C",
  },
  error: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    color: "#D32F2F",
  },
  sendInviteBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  sendInviteBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "futura",
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  orText: {
    marginHorizontal: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  shareLinkContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  shareLinkText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "futura",
    color: COLORS.secondary,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
    fontWeight: 700,
    fontFamily: "futura",
    textAlign: "center",
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "futura",
  },
  contactOptions: {
    marginTop: 15,
    alignItems: "center",
  },
  contactOptionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  contactIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  contactIconBtn: {
    alignItems: "center",
    padding: 10,
  },
  contactIconText: {
    marginTop: 5,
    fontSize: 14,
  },
});

export default InviteRealtorModal;
