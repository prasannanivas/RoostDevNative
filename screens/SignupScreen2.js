import React, { useState, useRef } from "react";
import axios from "axios";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInputMask } from "react-native-masked-text";
import Logo from "../components/Logo";

/**
 * Color palette from UX team design system
 */
const COLORS = {
  // Core colors
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070", // dark gray
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",

  // Opacity variations
  noticeContainerBg: "#37747340", // Green with 25% opacity
  coloredBgFill: "#3774731A", // Green with 10% opacity
};

export default function SignUpDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitedBy, setInvitedBy] = useState(null);

  const validateEmail = (email) => {
    if (email === "contact@davidwrobel.com") return true; // Allow test email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return phone.replace(/\D/g, "").length === 10;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const checkEmailOrPhoneExists = async () => {
    // Bypass check for test email
    if (
      email === "contact@davidwrobel.com" ||
      email === "d.prasannanivas@gmail.com"
    ) {
      return { existingAccount: false, inviteInfo: null };
    }

    try {
      let existingAccount = false;
      let inviteInfo = null;

      // If email is provided, check if it exists
      if (email) {
        try {
          const response = await axios.post(
            "http://159.203.58.60:5000/presignup/email",
            {
              email: email,
            }
          );

          console.log("Email check response:", response.data);

          // Check if response contains invitedBy information
          if (response.data && response.data.invitedBy) {
            inviteInfo = response.data.invitedBy;
            console.log("Found invite info via email:", inviteInfo);
          }
          // If we reach here, email doesn't exist
        } catch (error) {
          // If we get an error response, the email already exists
          if (error.response?.data?.error) {
            setEmailError(
              error.response.data.error ||
                "This email is already registered. Please use a different email."
            );
            existingAccount = true;
          }
        }
      }

      // If phone is provided, check if it exists
      if (phone) {
        try {
          const response = await axios.post(
            "http://159.203.58.60:5000/presignup/phone",
            {
              phone: formattedPhone,
            }
          );

          console.log("Phone check response:", response.data);

          // Check if response contains invitedBy information
          if (response.data && response.data.invitedBy && !inviteInfo) {
            inviteInfo = response.data.invitedBy;
            console.log("Found invite info via phone:", inviteInfo);
          }
          // If we reach here, phone doesn't exist
        } catch (error) {
          // If we get an error response, the phone already exists
          if (error.response?.data?.error) {
            setPhoneError(
              error.response.data.error ||
                "This phone number is already registered. Please use a different number."
            );
            existingAccount = true;
          }
        }
      }

      // Save invitedBy information if available
      if (inviteInfo) {
        setInvitedBy(inviteInfo);
      }

      return { existingAccount, inviteInfo }; // Return both values
    } catch (error) {
      console.error("Error checking email/phone:", error);
      Alert.alert(
        "Error",
        "Could not verify account information. Please try again."
      );
      return { existingAccount: true, inviteInfo: null }; // Return error state
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setPhoneError("");
      setEmailError("");
      setFirstNameError("");
      setLastNameError("");

      if (!firstName.trim()) {
        setFirstNameError("First name is required");
        setIsLoading(false);
        return;
      }

      if (!lastName.trim()) {
        setLastNameError("Last name is required");
        setIsLoading(false);
        return;
      }

      // Email is now required
      if (!email) {
        setEmailError("Email address is required for verification");
        setIsLoading(false);
        return;
      }

      // Validate email (required)
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Validate phone only if it's provided
      if (phone && !validatePhone(phone)) {
        setPhoneError("Please enter a valid 10-digit phone number");
        setIsLoading(false);
        return;
      }

      // Check if email or phone already exists
      const { existingAccount, inviteInfo } = await checkEmailOrPhoneExists();
      if (existingAccount) {
        setIsLoading(false);
        return;
      }
      console.log(
        "Navigating to email verification screen with invite info:",
        inviteInfo || invitedBy
      );

      // Navigate to email verification screen with email (required) and phone (optional)
      navigation.navigate("EmailVerification", {
        firstName,
        lastName,
        phone: phone ? formattedPhone : null, // Phone still passed if provided
        email: email, // Email is always provided now
        isRealtor: route.params?.accountType === "realtor",
        recoId: route.params?.recoId,
        invitedBy: inviteInfo || invitedBy,
      });
    } catch (error) {
      console.error("Error in signup process:", error);
      Alert.alert(
        "Error",
        "An error occurred during signup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Create refs for form inputs to enable focus management
  const lastNameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  // Handle input submission and focus next field
  const focusNextInput = (nextInput) => {
    // Safe focus method that handles TextInputMask and normal TextInput
    if (nextInput && nextInput.current) {
      try {
        // For TextInput components
        if (typeof nextInput.current.focus === "function") {
          nextInput.current.focus();
        }
        // For TextInputMask components which might have a different structure
        else if (
          nextInput.current.getElement &&
          typeof nextInput.current.getElement === "function"
        ) {
          const element = nextInput.current.getElement();
          if (element && typeof element.focus === "function") {
            element.focus();
          }
        }
      } catch (error) {
        console.log("Error focusing input:", error);
      }
    }
  };

  // Dismiss keyboard when submission is complete
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />
          <Text style={styles.heading}>Let's get started!</Text>
          {/* Update the note text to indicate email is required */}
          <Text style={styles.noteText}>
            Email is required for verification. Phone number is optional.
          </Text>
          {isLoading && (
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={COLORS.green} />
            </View>
          )}{" "}
          <TextInput
            style={[styles.input, isLoading && styles.inputDisabled]}
            placeholder="First Name"
            placeholderTextColor={COLORS.gray}
            value={firstName}
            onChangeText={setFirstName}
            accessible={true}
            accessibilityLabel="First Name input"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(lastNameInputRef)}
            blurOnSubmit={false}
          />
          {firstNameError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="First name error"
            >
              <Text style={styles.errorText}>{firstNameError}</Text>
            </View>
          ) : null}{" "}
          <TextInput
            ref={lastNameInputRef}
            style={[styles.input, isLoading && styles.inputDisabled]}
            placeholder="Last Name"
            placeholderTextColor={COLORS.gray}
            value={lastName}
            onChangeText={setLastName}
            accessible={true}
            accessibilityLabel="Last Name input"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(phoneInputRef)}
            blurOnSubmit={false}
          />
          {lastNameError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Last name error"
            >
              <Text style={styles.errorText}>{lastNameError}</Text>
            </View>
          ) : null}
          <View style={styles.phoneContainer}>
            <Text style={styles.phonePrefix}>+1</Text>
            <TextInputMask
              ref={phoneInputRef}
              type={"custom"}
              options={{
                mask: "(999) 999-9999",
              }}
              style={[styles.phoneInput, isLoading && styles.inputDisabled]}
              placeholder="Phone Number (Optional)" // Updated text
              placeholderTextColor={COLORS.gray}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setFormattedPhone("+1" + text.replace(/\D/g, ""));
                // Keep this line since phone is still being collected
                if (text) setEmailError("");
              }}
              keyboardType="phone-pad"
              accessible={true}
              accessibilityLabel="Phone Number input (optional)" // Updated accessibility
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => focusNextInput(emailInputRef)} // Focus email after phone
              blurOnSubmit={false}
            />
          </View>{" "}
          <TextInput
            ref={emailInputRef}
            style={[styles.input, isLoading && styles.inputDisabled]}
            placeholder="Email (Required)" // Updated text
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              // Keep this since we still collect phone
              if (text) setPhoneError("");
            }}
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email input (required)" // Updated accessibility
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={dismissKeyboard}
          />
          {emailError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Email error"
            >
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
          {phoneError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Phone error"
            >
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>{" "}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel="Next step"
          accessibilityRole="button"
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loginButtonText}> Loading...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    paddingBottom: 120, // Add padding to account for fixed footer
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  brandLogo: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  noteText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.green,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Futura",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  errorBox: {
    width: "100%",
    backgroundColor: COLORS.noticeContainerBg, // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    lineHeight: 20,
    fontFamily: "Futura",
  },
  boldText: {
    fontWeight: "bold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 24,
    minHeight: 120,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 50,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  loginButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50, // Made pill-shaped
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    marginVertical: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: COLORS.silver,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  phonePrefix: {
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
});
