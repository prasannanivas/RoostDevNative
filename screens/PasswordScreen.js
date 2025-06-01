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
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999999"
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
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999999"
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
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {!invitedBy && (
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeHeading}>
                Enter the invite code of your Realtor to continue
              </Text>
              <View style={styles.enhancedInputContainer}>
                <Ionicons
                  name="key"
                  size={22}
                  color="#019B8E"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={inviteCodeRef}
                  style={styles.enhancedInput}
                  placeholder="Enter Invite Code"
                  placeholderTextColor="#999999"
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 20,
    display: "flex",
    justifyContent: "center",
  },
  subHeading: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 30,
  },
  inviteCodeContainer: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteCodeHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#019B8E",
    marginBottom: 10,
    textAlign: "center",
  },
  enhancedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#019B8E",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  enhancedInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#23231A",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#23231A",
  },
  eyeIcon: {
    padding: 10,
  },
  errorBox: {
    backgroundColor: "lightgreen",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#23231A",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#23231A",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  continueButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  inviteBox: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  inviteText: {
    fontSize: 16,
    color: "#23231A",
  },
  inviterName: {
    fontWeight: "600",
    color: "#019B8E",
  },
});
