import React, { useRef, useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function EmailVerificationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  // Get user data from previous screen
  const userData = route.params || {};

  // Store each digit in a separate array element - 6 digits for email verification
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [otpSent, setOtpSent] = useState(false);

  // Refs to each TextInput so we can focus the next one automatically
  const inputRefs = useRef([]);

  // First useEffect for sending OTP - runs only once on component mount
  useEffect(() => {
    // Send OTP email once when the component first loads
    if (!otpSent) {
      generateEmailOTP();
    }
  }, []); // Empty dependency array to run only once

  // Second useEffect for countdown timer - depends on countdown value
  useEffect(() => {
    // Set up countdown timer
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);
  const handleDigitChange = (text, index) => {
    // Check if multiple characters were pasted
    if (text.length > 1) {
      // Handle paste operation - extract only numeric characters
      const pastedDigits = text.replace(/\D/g, "").slice(0, 6);

      // If it's a full 6-digit code, clear all fields and start from beginning
      if (pastedDigits.length === 6) {
        const newDigits = pastedDigits.split("");
        setDigits(newDigits);

        // Focus the last field to indicate completion
        if (inputRefs.current[5]) {
          inputRefs.current[5].focus();
        }
      } else {
        // If partial code, fill from current position
        const updatedDigits = [...digits];

        for (let i = 0; i < pastedDigits.length && index + i < 6; i++) {
          updatedDigits[index + i] = pastedDigits[i];
        }

        setDigits(updatedDigits);

        // Focus the next empty field or the last filled field
        const nextEmptyIndex = updatedDigits.findIndex(
          (digit, idx) => idx > index && !digit
        );
        const targetIndex =
          nextEmptyIndex !== -1
            ? nextEmptyIndex
            : Math.min(index + pastedDigits.length, 5);

        if (targetIndex < inputRefs.current.length) {
          inputRefs.current[targetIndex].focus();
        }
      }
      return;
    }

    // Handle single character input
    const newDigit = text.slice(0, 1);
    const updatedDigits = [...digits];
    updatedDigits[index] = newDigit;
    setDigits(updatedDigits);

    // If the user typed one character, move to the next input
    if (newDigit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (key, index) => {
    // If backspace on an empty box, focus the previous one
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const generateEmailOTP = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await axios.post(
        "http://159.203.58.60:5000/otp/email/generate",
        {
          email: userData.email,
        }
      );

      console.log("Email OTP response:", response.data);

      if (response?.data?.message === "OTP sent successfully") {
        setOtpSent(true);
      } else {
        setError("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      setError("Error sending verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      generateEmailOTP();
      setCountdown(60);
    }
  };

  const verifyEmailOTP = async (otp) => {
    try {
      const response = await axios.post(
        "http://159.203.58.60:5000/otp/email/verify",
        {
          email: userData.email,
          otp,
        }
      );

      return response.data && response.data.success;
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      return false;
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError("");
      const code = digits.join("");

      if (code.length !== 6) {
        setError("Please enter the complete 6-digit verification code");
        setIsLoading(false);
        return;
      } // Verify email OTP
      const verificationSuccess = await verifyEmailOTP(code);
      if (!verificationSuccess) {
        setError("Invalid verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      // If verification successful, navigate to password screen
      console.log("Email verified successfully, navigating to password screen");
      navigation.navigate("Password", userData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error during verification:", error);
      setError("Verification failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const clearAllDigits = () => {
    setDigits(["", "", "", "", "", ""]);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        bounces={false}
      >
        {/* Brand Title */}
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />
        {/* Heading */}
        <Text style={styles.heading}>Verify your email address</Text>
        {/* Subheading */}
        <Text style={styles.subheading}>
          We just sent a verification code to {userData.email}. Please enter it
          below to continue.
        </Text>
        {/* Paste instruction */}
        <Text style={styles.pasteInstruction}>
          Paste your 6-digit code in any field - it will fill all boxes
          automatically
        </Text>
        {isLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        )}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {/* Code Input Row */}
        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.codeBox}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleBackspace(nativeEvent.key, index)
              }
              onFocus={() => {
                // Select all text when focusing to make paste easier
                if (digit) {
                  inputRefs.current[index].setSelection(0, 1);
                }
              }}
              keyboardType="number-pad"
              maxLength={6} // Allow pasting up to 6 characters
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus={true}
            />
          ))}
        </View>
        {/* Clear button - only show if there are digits entered */}
        {digits.some((digit) => digit !== "") && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllDigits}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>Clear all</Text>
          </TouchableOpacity>
        )}
        {/* Resend Button */}
        <TouchableOpacity
          style={[
            styles.resendButton,
            countdown > 0 && styles.resendButtonDisabled,
          ]}
          onPress={handleResend}
          disabled={countdown > 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.resendButtonText,
              countdown > 0 && styles.resendButtonTextDisabled,
            ]}
          >
            {countdown > 0
              ? `Send code again in ${countdown} seconds`
              : "Send code again"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backCircle} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            isLoading && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? "Verifying..." : "Verify"}
          </Text>
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
  subheading: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: "Futura",
  },
  pasteInstruction: {
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.green,
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
    fontFamily: "Futura",
  },
  spinnerContainer: {
    marginVertical: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#F0913A80", // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: COLORS.black,
    lineHeight: 20,
    fontFamily: "Futura",
  },

  // Code boxes
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  codeBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.black,
    textAlign: "center",
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },

  // Clear button
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearButtonText: {
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    textAlign: "center",
    fontFamily: "Futura",
  },
  // Resend button
  resendButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  resendButtonDisabled: {
    borderColor: COLORS.gray,
  },
  resendButtonText: {
    color: COLORS.green,
    fontWeight: 700, // H4 weight
    fontSize: 12, // H4 size
    fontFamily: "Futura",
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  }, // Bottom bar
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
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 50, // Made pill-shaped
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  verifyButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50, // Made pill-shaped
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: 700, // H3 weight
    fontFamily: "Futura",
  },
});
