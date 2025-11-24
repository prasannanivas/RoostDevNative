import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import * as Contacts from "expo-contacts";

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

const InviteClientModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  isMultiple,
  setIsMultiple,
  handleInviteClient,
  pickContact,
  handlePickInviteFile,
  handleMultipleInvites,
  isLoading,
  multiInviteLoading,
  selectedInviteFile,
  multiInviteFeedback,
  fieldErrors,
  setFieldErrors,
  formatPhoneNumber,
  unFormatPhoneNumber,
  trimLeft,
  trimFull,
}) => {
  const lastNameInputRef = useRef();
  const emailInputRef = useRef();
  const phoneInputRef = useRef();

  // Animation values
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const [modalReady, setModalReady] = useState(false);
  const [internalVisible, setInternalVisible] = useState(false);

  // Handle close with animation
  const handleClose = () => {
    setInternalVisible(false);
  };

  // Sync internal visible state with prop
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
    }
  }, [visible]);

  useEffect(() => {
    if (internalVisible) {
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
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Set modal as ready after animation completes
        setModalReady(true);
      });
    } else if (visible) {
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
        // Call onClose after animation completes
        onClose();
      });
    }
  }, [internalVisible]);

  // Check if the form is valid to enable the button
  const isFormValid =
    formData.firstName &&
    formData.firstName.trim() !== "" &&
    (formData.email?.trim() || formData.phone?.trim());

  return (
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
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                <Circle cx="18.5" cy="18.5" r="18.5" fill="#ffffffff" />
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
              <Text style={styles.title}>Add Client</Text>
            </View>
          </View>

          {/* Select from contacts button */}
          <TouchableOpacity
            style={styles.selectContactsButton}
            onPress={pickContact}
          >
            <Text style={styles.selectContactsText}>
              Select from contacts list
            </Text>
          </TouchableOpacity>

          {/* Form Content */}
          <ScrollView
            style={styles.formContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <TextInput
              style={styles.inputField}
              placeholder="First Name"
              placeholderTextColor={COLORS.slate}
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: trimLeft(text) });
                if (fieldErrors.firstName)
                  setFieldErrors({
                    ...fieldErrors,
                    firstName: "",
                  });
              }}
              onBlur={() =>
                setFormData({
                  ...formData,
                  firstName: trimFull(formData.firstName),
                })
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
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: trimLeft(text) })
              }
              onBlur={() =>
                setFormData({
                  ...formData,
                  lastName: trimFull(formData.lastName),
                })
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
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: trimLeft(text) });
                if (fieldErrors.emailPhone)
                  setFieldErrors({
                    ...fieldErrors,
                    emailPhone: "",
                  });
              }}
              onBlur={() =>
                setFormData({
                  ...formData,
                  email: trimFull(formData.email),
                })
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
              value={formatPhoneNumber(formData.phone)}
              onChangeText={(text) => {
                setFormData({
                  ...formData,
                  phone: unFormatPhoneNumber(trimLeft(text)),
                });
                if (fieldErrors.emailPhone)
                  setFieldErrors({
                    ...fieldErrors,
                    emailPhone: "",
                  });
              }}
              onBlur={() =>
                setFormData({
                  ...formData,
                  phone: unFormatPhoneNumber(trimFull(formData.phone)),
                })
              }
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            {(fieldErrors.emailPhone || fieldErrors.firstName) && (
              <View style={styles.errorContainer}>
                {fieldErrors.emailPhone && (
                  <Text style={styles.errorText}>
                    * {fieldErrors.emailPhone}
                  </Text>
                )}
                {fieldErrors.firstName && (
                  <Text style={styles.errorText}>
                    * {fieldErrors.firstName}
                  </Text>
                )}
              </View>
            )}

            {/* Send Invite Button */}
            <TouchableOpacity
              style={[
                styles.sendInviteButton,
                !isFormValid && styles.sendInviteButtonDisabled,
              ]}
              onPress={handleInviteClient}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text
                  style={[
                    styles.sendInviteButtonText,
                    !isFormValid && styles.sendInviteButtonDisabledText,
                  ]}
                >
                  Send invite
                </Text>
              )}
            </TouchableOpacity>

            {/* Multiple Invite Section */}
            <View style={styles.multipleInviteSection}>
              <Text style={styles.multipleInviteTitle}>Multiple Invite</Text>
              <Text style={styles.multipleInviteText}>
                You can always email a file (Excel or .CSV) to us at{" "}
                <Text style={styles.emailBold}>files@inbound.roostapp.io</Text>{" "}
                and we can take care of it for you
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
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
    borderColor: COLORS.gray,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
    letterSpacing: 0.5,
  },
  selectContactsButton: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#377473",
    alignItems: "center",
  },
  selectContactsText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.green,
    fontFamily: "Futura",
  },
  formContent: {
    paddingHorizontal: 24,
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
  errorContainer: {
    marginBottom: 12,
  },
  errorText: {
    fontWeight: "600",
    color: COLORS.red,
    marginBottom: 4,
    marginLeft: 4,
    fontSize: 13,
    fontFamily: "Futura",
  },
  sendInviteButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  sendInviteButtonDisabled: {
    backgroundColor: COLORS.disabledGray,
  },
  sendInviteButtonDisabledText: {
    color: "#797979",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  sendInviteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  multipleInviteSection: {
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  multipleInviteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#707070",
    marginBottom: 12,
    fontFamily: "Futura",
  },
  multipleInviteText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#707070",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Futura",
  },
  emailBold: {
    fontWeight: "700",
  },
});

export default InviteClientModal;
