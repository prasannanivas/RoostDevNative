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
import Logo from "../components/Logo";
import { StatusBar } from "expo-status-bar";

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
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 0.8 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 4 : 0}
      >
        {/* Brand Logo */}
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          style={styles.scrollView}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
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
          {/* Email Input */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.slate}
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
          {/* Password Input */}
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.slate}
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
            style={styles.resetPasswordButton}
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
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Sign Up Section moved to bottom above footer */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpPrompt}>
          Don't have An Account? Sign Up for Free
        </Text>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          accessible={true}
          accessibilityLabel="Sign up for a new account"
          accessibilityRole="button"
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Footer (dark background) */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          By logging in, you agree to Roost's
          <Text style={styles.linkText}>Terms of Use</Text> and
          <Text style={styles.linkText}> Privacy Policy</Text>.
        </Text>
        <Text style={styles.footerText}>
          By providing your email & phone number, you consent to receive
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
  scrollView: {
    flex: 1,
  },
  container: {
    height: "85%",
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  brandLogo: {
    marginBottom: 32,
    alignSelf: "center",
    marginTop: 64,
    backgroundColor: COLORS.background, // Ensure logo has a background color
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.slate,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14, // P size
    fontWeight: "bold", // Changed to bold for thick placeholder text
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },

  resetPasswordButton: {
    alignSelf: "flex-end",
  },
  resetPasswordText: {
    alignSelf: "flex-end",
    color: COLORS.slate,
    marginBottom: 24,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  loginButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: 700, // H3 weight (medium)
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
  signUpContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    alignItems: "center",
  },
  signUpPrompt: {
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    color: COLORS.slate,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  signUpButton: {
    borderColor: COLORS.green,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: 334,
    borderWidth: 2,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  signUpButtonText: {
    color: COLORS.green,
    fontSize: 12, // H3 size
    fontWeight: 700, // H3 weight
    fontFamily: "Futura",
  },
  realtorButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.red,
    borderRadius: 50,
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
    height: 120,
    position: "absolute",
    alignItems: "center",
    width: "100%",
    bottom: 0,
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12, // Sub-p size
    fontWeight: 500, // Sub-p weight
    color: COLORS.gray,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 15,
    fontFamily: "Futura",
  },
  linkText: {
    color: COLORS.gray,
    textDecorationLine: "underline",
  },
});
