import React, { useState, useRef, useEffect } from "react";
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
  Clipboard,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  formatPhoneNumber,
  unFormatPhoneNumber,
} from "../../utils/phoneFormatUtils";
import { trimLeft, trimFull } from "../../utils/stringUtils";
import ShareOptionsModal from "./ShareOptionsModal";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  red: "#A20E0E",
  orange: "#F0913A",
  disabledGray: "#E8E8E8",
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
  const [showShareOptionsModal, setShowShareOptionsModal] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState({ msg: "", type: "" });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Refs for input navigation
  const lastNameInputRef = useRef();
  const emailInputRef = useRef();
  const phoneInputRef = useRef();

  // Handle modal visibility with delay to prevent conflicts on app start
  useEffect(() => {
    if (visible && !isClosing) {
      // Sequential animation: backdrop fades in, then modal slides up
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Set modal as ready after animation completes
        setModalReady(true);
      });
    } else if (isClosing) {
      // Closing animation: modal slides down, then backdrop fades out
      setModalReady(false);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 600,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset isClosing after animation completes
        setIsClosing(false);
      });
    }
  }, [visible, isClosing]);

  // Check if the form is valid to enable the button
  const isFormValid =
    inviteData.firstName &&
    inviteData.firstName.trim() !== "" &&
    (inviteData.email?.trim() || inviteData.phone?.trim());

  // Function to handle inviting a realtor
  const handleInviteRealtor = async () => {
    setInviteLoading(true);
    setInviteFeedback({ msg: "", type: "" });

    // Validate that either email or phone is provided
    if (
      (!inviteData.email && !inviteData.phone) ||
      inviteData.firstName.trim() === ""
    ) {
      setInviteFeedback({
        msg: `${
          inviteData.firstName.trim() === "" ? "First Name &" : ""
        } Phone or Email required`,
        type: "error",
      });
      setInviteLoading(false);
      return;
    }

    try {
      // Construct the API payload
      const payload = {
        referenceName: `${inviteData.firstName} ${inviteData.lastName}`.trim(),
        email: inviteData.email,
        phone: inviteData.phone,
        type: "Realtor",
      };

      // Send the invite via the API
      const resp = await fetch(
        `https://signup.roostapp.io/realtor/${realtorId}/invite-realtor`,
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
          responseData.inviteLink ||
            `http://signup.roostapp.io/?realtorCode=${realtorInfo?.inviteCode}&iv=r`
        );
        setInviteFeedback({ msg: "Realtor invited!", type: "success" });

        console.log("InviteRealtorModal - Realtor invited successfully!");
        console.log("InviteRealtorModal - inviteData:", inviteData);

        // Open the share options modal after a brief delay to ensure state update
        setTimeout(() => {
          console.log(
            "InviteRealtorModal - Setting showShareOptionsModal to true"
          );
          setShowShareOptionsModal(true);
        }, 300);
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
      setInviteLoading(false);
    }
  };
  // Handle opening SMS
  const openSMS = () => {
    const signupLink =
      inviteLink ||
      `https://signup.roostapp.io/?realtorCode=${
        realtorInfo?.inviteCode || ""
      }`;

    const smsMessage = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients. Click here to get started: ${signupLink}`;
    const smsUrl = `sms:${inviteData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.openURL(smsUrl).catch((err) =>
      console.error("Error opening SMS:", err)
    );
  };

  // Handle opening Email
  const openEmail = () => {
    const signupLink =
      inviteLink ||
      `https://signup.roostapp.io/?realtorCode=${
        realtorInfo?.inviteCode || ""
      }`;

    const emailSubject = "Join Roost";
    const emailBody = `Hey ${inviteData.firstName},

I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients.

Click here to get started: ${signupLink}

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
    setIsClosing(true);
    setShowShareOptionsModal(false);
    setInviteData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setInviteFeedback({ msg: "", type: "" });
    setInviteLink("");
    setCopied(false);

    // Delay onClose to allow animation to complete
    setTimeout(() => {
      onClose();
    }, 650); // Total animation time: 400 + 200 + 50ms buffer
  };

  // Handlers for share options modal
  const handlePersonalText = () => {
    openSMS();
    setShowShareOptionsModal(false);
    handleClose();
  };

  const handlePersonalEmail = () => {
    openEmail();
    setShowShareOptionsModal(false);
    handleClose();
  };

  const handleNoneOption = () => {
    handleClose();
  };

  console.log(
    "InviteRealtorModal Render - visible:",
    visible,
    "showShareOptionsModal:",
    showShareOptionsModal
  );

  return (
    <>
      {/* Main Invite Form Modal */}
      {!showShareOptionsModal && (
        <Modal
          visible={visible}
          animationType="none"
          transparent={true}
          onRequestClose={handleClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardContainer}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            enabled={modalReady}
          >
            <TouchableWithoutFeedback onPress={handleClose}>
              <Animated.View
                style={[styles.overlay, { opacity: backdropOpacity }]}
              />
            </TouchableWithoutFeedback>

            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: modalOpacity,
                },
              ]}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                    <Circle cx="18.5" cy="18.5" r="18.5" fill="#ffffff" />
                    <Path
                      d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                      fill="#A9A9A9"
                    />
                  </Svg>
                </TouchableOpacity>

                <View style={styles.titleRow}>
                  <View style={styles.iconContainer}>
                    <Svg width="56" height="56" viewBox="0 0 59 58" fill="none">
                      <Circle cx="29" cy="29" r="29" fill="#377473" />
                      <Path
                        d="M34.8181 39.909C34.8181 37.0974 31.3992 34.8181 27.1818 34.8181C22.9643 34.8181 19.5454 37.0974 19.5454 39.909M39.909 36.0908V32.2727M39.909 32.2727V28.4545M39.909 32.2727H36.0909M39.909 32.2727H43.7272M27.1818 30.9999C24.3701 30.9999 22.0909 28.7207 22.0909 25.909C22.0909 23.0974 24.3701 20.8181 27.1818 20.8181C29.9934 20.8181 32.2727 23.0974 32.2727 25.909C32.2727 28.7207 29.9934 30.9999 27.1818 30.9999Z"
                        stroke="#FDFDFD"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.title}>Invite Realtor</Text>
                </View>
                <Text style={styles.subTitle}>
                  Invite your Realtor friends to use Roost
                </Text>
              </View>

              {/* Form Content */}
              <ScrollView
                style={styles.formContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                {inviteFeedback.msg ? (
                  <View style={styles.feedbackContainer}>
                    <Text
                      style={[
                        styles.feedbackText,
                        inviteFeedback.type === "success"
                          ? styles.successText
                          : styles.errorText,
                      ]}
                    >
                      {inviteFeedback.msg}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.inputField}
                  placeholder="First Name"
                  placeholderTextColor={COLORS.slate}
                  value={inviteData.firstName}
                  onChangeText={(text) => {
                    setInviteFeedback({ msg: "", type: "" });
                    setInviteData((prev) => ({
                      ...prev,
                      firstName: trimLeft(text),
                    }));
                  }}
                  onBlur={() =>
                    setInviteData((prev) => ({
                      ...prev,
                      firstName: trimFull(prev.firstName),
                    }))
                  }
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                />

                <TextInput
                  ref={lastNameInputRef}
                  style={styles.inputField}
                  placeholder="Last Name"
                  placeholderTextColor={COLORS.slate}
                  value={inviteData.lastName}
                  onChangeText={(text) =>
                    setInviteData((prev) => ({
                      ...prev,
                      lastName: trimLeft(text),
                    }))
                  }
                  onBlur={() =>
                    setInviteData((prev) => ({
                      ...prev,
                      lastName: trimFull(prev.lastName),
                    }))
                  }
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />

                <TextInput
                  ref={emailInputRef}
                  style={styles.inputField}
                  placeholder="Email"
                  placeholderTextColor={COLORS.slate}
                  keyboardType="email-address"
                  value={inviteData.email}
                  onChangeText={(text) =>
                    setInviteData((prev) => ({
                      ...prev,
                      email: trimLeft(text),
                    }))
                  }
                  onBlur={() =>
                    setInviteData((prev) => ({
                      ...prev,
                      email: trimFull(prev.email),
                    }))
                  }
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                />

                <TextInput
                  ref={phoneInputRef}
                  style={styles.inputField}
                  placeholder="Phone"
                  placeholderTextColor={COLORS.slate}
                  keyboardType="phone-pad"
                  value={formatPhoneNumber(inviteData.phone)}
                  onChangeText={(text) =>
                    setInviteData((prev) => ({
                      ...prev,
                      phone: unFormatPhoneNumber(trimLeft(text)),
                    }))
                  }
                  onBlur={() =>
                    setInviteData((prev) => ({
                      ...prev,
                      phone: unFormatPhoneNumber(trimFull(prev.phone)),
                    }))
                  }
                  maxLength={14}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                {/* Send Invite Button */}
                <TouchableOpacity
                  style={[
                    styles.sendInviteButton,
                    !isFormValid && styles.sendInviteButtonDisabled,
                  ]}
                  onPress={handleInviteRealtor}
                  disabled={inviteLoading || !isFormValid}
                >
                  {inviteLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text
                      style={[
                        styles.sendInviteButtonText,
                        !isFormValid && { color: "#797979" },
                      ]}
                    >
                      Send invite
                    </Text>
                  )}
                </TouchableOpacity>

                <View
                  style={{
                    width: "100%",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={styles.orText}> OR </Text>
                </View>

                {/* Share Link Section */}
                <View style={styles.shareLinkSection}>
                  <Text style={styles.shareLinkTitle}>
                    Share this link with them
                  </Text>
                  <Text style={styles.shareLinkText}>
                    {inviteLink ||
                      `Roostapp.io/signup/${realtorInfo?.inviteCode || "..."}`}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => {
                      const linkToCopy =
                        inviteLink ||
                        `https://signup.roostapp.io/?realtorCode=${
                          realtorInfo?.inviteCode || ""
                        }`;
                      Clipboard.setString(linkToCopy);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <Text style={styles.copyButtonText}>
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Share Options Modal */}
      {showShareOptionsModal && (
        <ShareOptionsModal
          visible={showShareOptionsModal}
          onClose={handleClose}
          title="Realtor invite via"
          subtitle="We have sent an invite! However its always best to reach out directly. Sending a personalized message is simple just click one of the options below."
          hasPhone={!!inviteData.phone}
          hasEmail={!!inviteData.email}
          onPersonalText={handlePersonalText}
          onPersonalEmail={handlePersonalEmail}
          onSkip={handleNoneOption}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  orText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#707070",
    fontFamily: "Futura",
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    zIndex: 2,
  },
  header: {
    alignItems: "flex-start",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    height: 56,
    width: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#707070",
    marginTop: 16,
    fontFamily: "Futura",
    alignSelf: "center",
  },
  formContent: {
    paddingHorizontal: 24,
  },
  feedbackContainer: {
    marginBottom: 12,
  },
  feedbackText: {
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Futura",
  },
  successText: {
    backgroundColor: "rgba(55, 116, 115, 0.2)",
    color: COLORS.green,
  },
  errorText: {
    backgroundColor: "rgba(162, 14, 14, 0.2)",
    color: COLORS.red,
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    minHeight: 42,
    fontFamily: "Futura",
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  sendInviteButton: {
    backgroundColor: COLORS.green,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  sendInviteButtonDisabled: {
    backgroundColor: COLORS.disabledGray,
  },
  sendInviteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  shareLinkSection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  shareLinkTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    marginBottom: 8,
    fontFamily: "Futura",
    textAlign: "center",
  },
  shareLinkText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#707070",
    marginBottom: 16,
    fontFamily: "Futura",
    textAlign: "center",
  },
  copyButton: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    minWidth: 120,
  },
  copyButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
});

export default InviteRealtorModal;
