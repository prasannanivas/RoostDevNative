import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

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

export default function PasswordScreen({ navigation, route }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCodeRequired, setInviteCodeRequired] = useState(false);

  const { invitedBy } = route.params || {};

  useEffect(() => {
    // Check if invitation info is missing
    setInviteCodeRequired(!invitedBy);
  }, [invitedBy]);

  const handleBack = () => {
    navigation.goBack();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const registerUser = async (userData) => {
    try {
      const endpoint = userData.isRealtor
        ? "http://44.202.249.124:5000/realtor/signup"
        : "http://44.202.249.124:5000/client/signup";

      const payload = {
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone || "", // Keep phone in payload if provided
        email: userData.email,
        password: userData.password,
      };

      // Add RECO ID if it exists
      if (userData.recoId) {
        payload.recoId = userData.recoId;
      }

      // Add invite information if available
      if (userData.inviterId) {
        payload.inviterId = userData.inviterId;
      } else if (userData.inviterCode) {
        payload.inviterCode = userData.inviterCode;
      }

      const response = await axios.post(endpoint, payload);

      if (response.data) {
        navigation.navigate("Success");
      } else {
        setPasswordError("Registration failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setPasswordError(
        `Registration failed: ${error.response?.data?.error || "Unknown error"}`
      );
      setIsLoading(false);
    }
  };

  // Create refs for form inputs
  const confirmPasswordRef = useRef(null);
  const inviteCodeRef = useRef(null);
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

  const handleContinue = async () => {
    try {
      setPasswordError("");

      const hasNumber = /\d/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);

      if (password.length < 8) {
        setPasswordError(
          "The Password should be at 8 characters long including a number and an uppercase letter"
        );
        return;
      }

      if (!hasNumber || !hasUpperCase) {
        setPasswordError(
          "The Password should be at 8 characters long including a number and an uppercase letter"
        );
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }

      // Check invite code if required

      setIsLoading(true);
      // Get user data from previous screen
      const userData = route.params;

      // Add inviterCode to userData if manually entered
      const finalUserData = {
        ...userData,
        password,
      };

      if (inviteCodeRequired && inviteCode) {
        finalUserData.inviterCode = inviteCode;
      } else if (invitedBy) {
        finalUserData.inviterId = invitedBy.id;
      }
      console.log("Password validated, proceeding to register user:", {
        ...finalUserData,
        password: "***",
      });

      // Register the user after password validation
      await registerUser(finalUserData);
    } catch (error) {
      console.error("Error in password screen:", error);
      setPasswordError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
          <Text style={styles.heading}>Secure your account</Text>
          {/* Display invitation message if available */}
          {invitedBy ? (
            <View
              style={styles.inviteBox}
              accessible={true}
              accessibilityLabel="Invitation details"
            >
              <Text style={styles.inviteText}>
                You have been invited by{" "}
                <Text style={styles.inviterName}>{invitedBy.name}</Text>
              </Text>
            </View>
          ) : null}
          <View style={styles.inputContainer}>
            {" "}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="default"
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel="Password input"
              returnKeyType="next"
              onSubmitEditing={() => focusNextInput(confirmPasswordRef)}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              accessible={true}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              accessibilityRole="button"
            >
              {" "}
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={COLORS.slate}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            {" "}
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.gray}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textContentType="password"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="default"
              autoCapitalize="none"
              accessible={true}
              accessibilityLabel="Confirm password input"
              returnKeyType={!invitedBy ? "next" : "done"}
              onSubmitEditing={
                !invitedBy && inviteCodeRef
                  ? () => dismissKeyboard()
                  : dismissKeyboard
              }
              blurOnSubmit={invitedBy}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              accessible={true}
              accessibilityLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              accessibilityRole="button"
            >
              {" "}
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color={COLORS.slate}
              />
            </TouchableOpacity>
          </View>
          {!invitedBy && (
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeHeading}>
                Enter the invite code of your Realtor to continue
              </Text>
              <View style={styles.enhancedInputContainer}>
                {" "}
                <Ionicons
                  name="key"
                  size={22}
                  color={COLORS.green}
                  style={styles.inputIcon}
                />{" "}
                <TextInput
                  ref={inviteCodeRef}
                  style={styles.enhancedInput}
                  placeholder="Enter Invite Code"
                  placeholderTextColor={COLORS.gray}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCorrect={false}
                  spellCheck={false}
                  keyboardType="default"
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel="Invite code input"
                  returnKeyType="done"
                  onSubmitEditing={() => dismissKeyboard()}
                />
              </View>
            </View>
          )}
          {passwordError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Error message"
            >
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
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
          style={[styles.continueButton, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel="Continue to next step"
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
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
  container: {
    flex: 1,
    padding: 24,
    display: "flex",
    justifyContent: "center",
  },
  subHeading: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.slate,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  heading: {
    fontSize: 24, // H1 size
    textAlign: "center",
    fontWeight: "bold", // H1 weight
    color: COLORS.black,
    marginBottom: 32,
    fontFamily: "Futura",
  },
  inviteCodeContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.coloredBgFill, // Using colored background fill with 10% opacity
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  inviteCodeHeading: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.green,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Futura",
  },
  enhancedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 16,
  },
  enhancedInput: {
    flex: 1,
    height: 48,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  eyeIcon: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: COLORS.noticeContainerBg, // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  continueButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  inviteBox: {
    backgroundColor: COLORS.coloredBgFill, // Using colored background fill with 10% opacity
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inviteText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  inviterName: {
    fontWeight: "bold",
    color: COLORS.green,
  },
});
