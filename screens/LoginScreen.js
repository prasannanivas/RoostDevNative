import React, { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useAuth } from "../context/AuthContext";

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

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create refs for form inputs
  const passwordInputRef = useRef(null);
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try client login first
      let response = await fetch("http://159.203.58.60:5000/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      let data = await response.json();

      // If client login fails, try realtor login
      if (!data.client) {
        response = await fetch("http://159.203.58.60:5000/realtor/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
        });
        data = await response.json();
      }

      if (data.client || data.realtor) {
        console.log("Login successful:", data);
        login(data);
        navigation.navigate("Home");
      } else {
        setError("Check the account information you entered and try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("SignupStack");
  };

  const handleResetPassword = () => {
    // Navigate to the password reset screen
    navigation.navigate("PasswordReset");
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
          {/* Brand Title */}
          <Text style={styles.brandTitle}>Roost</Text>
          {/* Error Message */}
          {error && (
            <Text
              style={styles.errorText}
              accessible={true}
              accessibilityLabel={`Error: ${error}`}
            >
              {error}
            </Text>
          )}
          {/* Email Input */}{" "}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email input"
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(passwordInputRef)}
            blurOnSubmit={false}
          />
          {/* Password Input */}{" "}
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            autoComplete="password"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Password input"
            returnKeyType="done"
            onSubmitEditing={() => dismissKeyboard()}
          />
          {/* Reset Password */}
          <TouchableOpacity
            onPress={handleResetPassword}
            accessible={true}
            accessibilityLabel="Reset password"
            accessibilityRole="button"
          >
            <Text style={styles.resetPasswordText}>RESET PASSWORD</Text>
          </TouchableOpacity>
          {/* Log In Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Log in"
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
          {/* Sign Up Prompt */}
          <Text style={styles.signUpPrompt}>
            Don't have an Account? Sign Up for Free
          </Text>
          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            accessible={true}
            accessibilityLabel="Sign up for a new account"
            accessibilityRole="button"
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer (dark background) */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          By logging in, you agree to Roost's{" "}
          <Text style={styles.linkText}>Terms of Use</Text> and{" "}
          <Text style={styles.linkText}>Privacy Policy</Text>.
        </Text>
        <Text style={styles.footerText}>
          By entering your email & phone number, you consent to receive
          communications from Roost. You can opt-out anytime.
        </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  brandTitle: {
    fontSize: 24, // H1 size
    fontWeight: "bold", // H1 weight
    marginBottom: 32,
    color: COLORS.black,
    fontFamily: "Futura", // Will fallback to system font if Futura not available
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
    fontWeight: "500", // P weight (medium)
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  resetPasswordText: {
    alignSelf: "flex-end",
    color: COLORS.slate,
    marginBottom: 24,
    textDecorationLine: "underline",
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  loginButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight (medium)
    fontFamily: "Futura",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.red,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  signUpPrompt: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  signUpButton: {
    width: "100%",
    height: 48,
    borderColor: COLORS.green,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    backgroundColor: "transparent",
  },
  signUpButtonText: {
    color: COLORS.green,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  realtorButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  realtorButtonText: {
    color: COLORS.white,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  footerContainer: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Futura",
  },
  linkText: {
    color: COLORS.green, // Using green for links instead of light teal
    textDecorationLine: "underline",
  },
});
