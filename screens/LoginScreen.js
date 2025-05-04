import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

/**
 * Approximated color palette from your screenshot.
 * Replace with exact values from Figma if available.
 */
const COLORS = {
  background: "#FFFFFF",
  textDark: "#23231A", // Dark text color (titles, normal text)
  inputBorder: "#9C9C9C", // Input border color
  teal: "#019B8E", // Primary button color (Log In)
  red: "#F04D4D", // Realtor button color
  footerBackground: "#23231A", // Dark footer background
  footerText: "#FFFFFF", // Footer text color
};

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try client login first
      let response = await fetch("http://54.89.183.155:5000/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      let data = await response.json();

      // If client login fails, try realtor login
      if (!data.client) {
        response = await fetch("http://54.89.183.155:5000/realtor/login", {
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
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Reset Password */}
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.resetPasswordText}>RESET PASSWORD</Text>
        </TouchableOpacity>

        {/* Log In Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Prompt */}
        <Text style={styles.signUpPrompt}>
          Don’t have an Account? Sign Up for Free
        </Text>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer (dark background) */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          By logging in, you agree to Roost’s{" "}
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
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 30,
    color: COLORS.textDark,
    // For exact match, use a custom font if your Figma uses one.
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: COLORS.textDark,
  },
  resetPasswordText: {
    alignSelf: "flex-end",
    color: COLORS.textDark,
    marginBottom: 20,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: COLORS.teal,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.red,
    marginBottom: 10,
    textAlign: "center",
  },
  signUpPrompt: {
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 10,
  },
  signUpButton: {
    width: "100%",
    height: 50,
    borderColor: COLORS.teal,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "transparent",
  },
  signUpButtonText: {
    color: COLORS.teal,
    fontSize: 16,
    fontWeight: "600",
  },
  realtorButton: {
    width: "100%",
    height: 50,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  realtorButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footerContainer: {
    backgroundColor: COLORS.footerBackground,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.footerText,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#A4E3DB", // Lighter teal for links, adjust if needed
    textDecorationLine: "underline",
  },
});
