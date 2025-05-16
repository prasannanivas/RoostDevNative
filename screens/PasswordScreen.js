import React, { useState, useEffect } from "react";
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
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
      if (inviteCodeRequired && !inviteCode.trim()) {
        setPasswordError("Please enter an invite code to continue");
        return;
      }

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

      console.log(
        "Password validated, proceeding to verification screen with user data:",
        { ...finalUserData, password: "***" }
      );

      // Add a small delay to ensure the loading state is visible
      setTimeout(() => {
        // Navigate to phone verification with all user data including password
        navigation.navigate("PhoneVerification", finalUserData);

        // Reset loading state if navigation fails
        setIsLoading(false);
      }, 300);
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
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.container}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>Secure your account</Text>
            {/* Display invitation message if available */}
            {invitedBy ? (
              <View style={styles.inviteBox}>
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
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
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
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    style={styles.enhancedInput}
                    placeholder="Enter Invite Code"
                    placeholderTextColor="#999999"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="none"
                    autoComplete="off"
                    textContentType="none"
                    autoCorrect={false}
                    spellCheck={false}
                    keyboardType="default"
                  />
                </View>
              </View>
            )}
            {passwordError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
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
