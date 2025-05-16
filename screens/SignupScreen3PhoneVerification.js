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

export default function PhoneVerificationScreen({ navigation, route }) {
  // Get user data from previous screen
  const userData = route.params || {};

  // Determine if we're verifying phone or email
  const verifyMethod = userData.phone ? "phone" : "email";
  const contactValue = userData.phone || userData.email;

  // Store each digit in a separate array element - updated to 6 digits
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [otpSent, setOtpSent] = useState(false);

  // Refs to each TextInput so we can focus the next one automatically
  const inputRefs = useRef([]);

  // First useEffect for sending OTP - runs only once on component mount
  useEffect(() => {
    // Only send OTP email once when the component first loads
    if (verifyMethod === "email" && !otpSent) {
      generateEmailOTP();
    } else {
      // For phone, we're just bypassing actual OTP verification for now
      setOtpSent(true);
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
    // Only take the first character if user types multiple
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
        "http://44.202.249.124:5000/otp/email/generate",
        {
          email: userData.email,
        }
      );

      console.log("Email OTP response:", response.data);

      if (response?.data?.message === "OTP sent successfully") {
        setOtpSent(true);
        Alert.alert("OTP Sent", `Verification code sent to ${userData.email}`);
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
      if (verifyMethod === "email") {
        generateEmailOTP();
      } else {
        // For phone, we're just bypassing actual OTP verification for now
        Alert.alert(
          "Code Resent",
          `Verification code resent to ${userData.phone}`
        );
      }
      setCountdown(60);
    }
  };

  const verifyEmailOTP = async (otp) => {
    try {
      const response = await axios.post(
        "http://44.202.249.124:5000/otp/email/verify",
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

  const registerUser = async () => {
    try {
      const endpoint = userData.isRealtor
        ? "http://44.202.249.124:5000/realtor/signup"
        : "http://44.202.249.124:5000/client/signup";

      const payload = {
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone || "",
        email: userData.email || "",
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
        setError("Registration failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setError(
        `Registration failed: ${error.response?.data?.error || "Unknown error"}`
      );
      setIsLoading(false);
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
      }

      let verificationSuccess = true;

      // For email, verify OTP
      if (verifyMethod === "email") {
        verificationSuccess = await verifyEmailOTP(code);
        if (!verificationSuccess) {
          setError("Invalid verification code. Please try again.");
          setIsLoading(false);
          return;
        }
      }
      // For phone, we're accepting any code for now

      // If verification successful, register the user
      if (verificationSuccess) {
        await registerUser();
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setError("Verification failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getHeadingText = () => {
    return verifyMethod === "phone"
      ? "Verify your phone number"
      : "Verify your email address";
  };

  const getSubheadingText = () => {
    return verifyMethod === "phone"
      ? "We just sent you a text message, please enter the number below"
      : `We just sent a verification code to ${userData.email}, please enter it below`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Heading */}
        <Text style={styles.heading}>{getHeadingText()}</Text>

        {/* Subheading */}
        <Text style={styles.subheading}>{getSubheadingText()}</Text>

        {isLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#019B8E" />
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
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>

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
              ? `Send message again in ${countdown} seconds`
              : "Send message again"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.verificationNote}>
          Note: For phone verification, any 6-digit code is accepted at the
          moment
        </Text>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    color: "#23231A",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    color: "#23231A",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  spinnerContainer: {
    marginVertical: 20,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    width: "80%",
    backgroundColor: "#FCEED2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#23231A",
    lineHeight: 20,
  },

  // Code boxes
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  codeBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    fontSize: 18,
    color: "#23231A",
    textAlign: "center",
  },

  // Resend button
  resendButton: {
    borderWidth: 2,
    borderColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resendButtonDisabled: {
    borderColor: "#C4C4C4",
  },
  resendButtonText: {
    color: "#019B8E",
    fontWeight: "600",
    fontSize: 14,
  },
  resendButtonTextDisabled: {
    color: "#C4C4C4",
  },
  verificationNote: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 10,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#23231A",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
