import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Logo from "../components/Logo";
import AnimatedDropdown from "../components/common/AnimatedDropdown";
import Svg, { Path } from "react-native-svg";

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

const PasswordScreen = React.forwardRef(
  ({ navigation, route, setBottomBarLoading }, ref) => {
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

    // Update the loading state of the bottom bar when local loading state changes
    useEffect(() => {
      if (setBottomBarLoading) {
        setBottomBarLoading(isLoading);
      }
    }, [isLoading, setBottomBarLoading]); // Expose validate method to parent via ref
    React.useImperativeHandle(ref, () => ({
      validate: async () => {
        try {
          // Use the existing handleContinue function for validation
          return await handleContinue();
        } catch (error) {
          console.error("Error in password validation:", error);
          setPasswordError("An error occurred. Please try again.");
          return false;
        }
      },
    }));

    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };

    const registerUser = async (userData) => {
      try {
        const endpoint = userData.isRealtor
          ? "https://signup.roostapp.io/realtor/signup"
          : "https://signup.roostapp.io/client/signup";

        const payload = {
          name: `${userData.firstName} ${userData.lastName}`,
          phone: userData.phone || "", // Keep phone in payload if provided
          email: userData.email,
          password: userData.password,
        };

        // Add RECO ID if it exists
        if (userData.recoId) {
          payload.brokerageInfo = {
            licenseNumber: userData.recoId,
          };
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
          setPasswordError("");
          setPasswordError("Registration failed. Please try again.");

          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
        }
        return true;
      } catch (error) {
        console.error("Error registering user:", error);

        setPasswordError("");
        // Clear previous error before setting new one
        setPasswordError(
          `Registration failed: ${
            error.response?.data?.error || "Unknown error"
          }`
        );

        setIsLoading(false);
        if (setBottomBarLoading) setBottomBarLoading(false);
        return false;
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
          // For TextInputMask components
          else if (
            nextInput.current.getElement &&
            nextInput.current.getElement()
          ) {
            nextInput.current.getElement().focus();
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
          setPasswordError("");
          // Clear previous error before setting new one
          setPasswordError(
            "The Password should be at 8 characters long including a number and an uppercase letter"
          );
          return false;
        }

        if (!hasNumber || !hasUpperCase) {
          setPasswordError("");
          // Clear previous error before setting new one
          setPasswordError(
            "The Password should be at 8 characters long including a number and an uppercase letter"
          );
          return false;
        }

        if (password !== confirmPassword) {
          setPasswordError("");
          // Clear previous error before setting new one
          setPasswordError("Passwords do not match");
          return false;
        }

        // Check invite code if required

        setIsLoading(true);
        if (setBottomBarLoading) setBottomBarLoading(true);

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
        return await registerUser(finalUserData);
      } catch (error) {
        console.error("Error in password screen:", error);
        setPasswordError("An error occurred. Please try again.");
        setIsLoading(false);
        if (setBottomBarLoading) setBottomBarLoading(false);
        return false;
      }
    };

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
        >
          {/* Logo */}
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            accessible={true}
          >
            <Text style={styles.heading}>Secure your account</Text>
            {/* Display invitation message if available */}

            <View style={styles.inputContainer}>
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
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color={COLORS.slate}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
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
                returnKeyType={inviteCodeRequired ? "next" : "done"}
                onSubmitEditing={() => {
                  if (inviteCodeRequired) {
                    focusNextInput(inviteCodeRef);
                  } else {
                    dismissKeyboard();
                  }
                }}
                blurOnSubmit={!inviteCodeRequired}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessible={true}
                accessibilityLabel={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                accessibilityRole="button"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color={COLORS.slate}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInstruction}>
              <Text style={styles.passwordInstructionText}>
                The password should be 8 characters long including a number and
                upper case
              </Text>
            </View>

            {/* Ask for Invite Code if needed */}
            {inviteCodeRequired && (
              <View style={styles.inviteCodeSection}>
                <View
                  style={styles.inviteCodeMessage}
                  accessible={true}
                  accessibilityLabel="Invite code information"
                >
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color={COLORS.slate}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.inviteCodeText}>
                    Enter invite code (optional). You can sign up without one,
                    but it helps us connect you with realtors you know on Roost.
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inviteCodeRef}
                    style={styles.input}
                    placeholder="Invite Code"
                    placeholderTextColor={COLORS.gray}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={10} // Adjust based on your actual invite code length
                    accessible={true}
                    accessibilityLabel="Invite code input (optional)"
                    returnKeyType="done"
                    onSubmitEditing={() => dismissKeyboard()}
                  />
                </View>
              </View>
            )}
            <AnimatedDropdown
              visible={!!passwordError}
              style={!!passwordError ? styles.errorBox : {}}
              maxHeight={100}
              contentKey={passwordError}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="Password error message"
              >
                {passwordError}
              </Text>
            </AnimatedDropdown>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  brandLogo: {
    marginBottom: 32,
    alignSelf: "center",
    marginTop: 64,
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 32,
    fontFamily: "Futura",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    position: "relative", // For positioning the eye icon
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
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
    padding: 10,
  },
  passwordInstruction: {
    fontSize: 14, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.black,
    backgroundColor: "#3774734D",
    marginTop: 4,
    marginBottom: 16,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    fontFamily: "Futura",
    textAlign: "center",
  },
  inviteCodeSection: {
    width: "100%",
    marginTop: 24,
  },
  passwordInstructionText: {
    fontSize: 14, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.black,

    alignSelf: "center",
    fontFamily: "Futura",
  },
  inviteCodeMessage: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2, // Align icon with first line of text
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.slate,
    fontFamily: "Futura",
  },
  errorBox: {
    backgroundColor: "#F0913A80", // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: "#707070",
    fontFamily: "Futura",
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

export default PasswordScreen;
