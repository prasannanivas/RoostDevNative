import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../components/Logo";
import AnimatedDropdown from "../components/common/AnimatedDropdown";

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

const EmailVerificationScreen = React.forwardRef(
  ({ navigation, route, setBottomBarLoading }, ref) => {
    // Get user data from previous screen
    const userData = route.params || {};

    // Debug userData to make sure we have email
    useEffect(() => {
      console.log(
        "EmailVerificationScreen userData:",
        JSON.stringify(userData)
      );
      if (!userData.email) {
        console.warn("WARNING: No email in userData - verification will fail!");
      }
    }, [userData]);

    // Store each digit in a separate array element - 6 digits for email verification
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(60);
    const [otpSent, setOtpSent] = useState(false);

    // Refs to each TextInput so we can focus the next one automatically
    const inputRefs = useRef([]); // First useEffect for sending OTP - runs when component mounts or if userData changes
    useEffect(() => {
      // Send OTP email once when the component first loads
      if (!otpSent && userData && userData.email) {
        console.log("Sending initial OTP for:", userData.email);
        generateEmailOTP();
      } else if (!userData?.email) {
        console.error("Cannot send OTP - missing email address");
        setError(
          "Email address is missing. Please go back and complete the previous step."
        );
      }
    }, [userData?.email]); // Re-run if email changes

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

    // Update the loading state of the bottom bar when local loading state changes
    useEffect(() => {
      if (setBottomBarLoading) {
        setBottomBarLoading(isLoading);
      }
    }, [isLoading, setBottomBarLoading]); // Expose validate method to parent via ref
    React.useImperativeHandle(ref, () => ({
      validate: async () => {
        try {
          setError("");

          // First, check if we have the required userData
          if (!userData || !userData.email) {
            setError(
              "Email address is missing. Please go back and complete the previous step."
            );
            console.error(
              "Missing email in userData during validation",
              userData
            );
            return false;
          }

          const code = digits.join("");

          if (code.length !== 6) {
            setError("Please enter the complete 6-digit verification code");
            return false;
          }

          setIsLoading(true);
          console.log(`Validating OTP for ${userData.email}:`, code);

          // Verify OTP first
          const success = await verifyEmailOTP(code);
          setIsLoading(false);

          if (!success) {
            setError("Invalid verification code. Please try again.");
            return false;
          }

          return true;
        } catch (error) {
          console.error("Error validating OTP:", error);
          setError("An error occurred. Please try again.");
          setIsLoading(false);
          return false;
        }
      },
    }));

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
          const nextEmptyIndex = updatedDigits.findIndex((d) => !d);
          if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
            inputRefs.current[nextEmptyIndex].focus();
          } else {
            inputRefs.current[5].focus();
          }
        }
      } else {
        // Normal single digit input handling
        if (text.match(/^\d?$/)) {
          // Only allow single digit or empty string
          const newDigits = [...digits];
          newDigits[index] = text;
          setDigits(newDigits);

          // If a digit was entered (not cleared) and this isn't the last input, move focus to next input
          if (text !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
          }
        }
      }
    };

    const handleBackspace = (key, index) => {
      if (key === "Backspace" && index > 0 && digits[index] === "") {
        inputRefs.current[index - 1].focus();
      }
    };

    const clearAllDigits = () => {
      setDigits(["", "", "", "", "", ""]);
      // Focus the first input after clearing
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    };

    const handleBack = () => {
      navigation.goBack();
    };
    const generateEmailOTP = async () => {
      try {
        // Only send OTP if we have an email
        if (userData && userData.email) {
          console.log("Generating OTP for email:", userData.email);

          try {
            const response = await axios.post(
              "https://signup.roostapp.io/otp/email/generate",
              {
                email: userData.email,
              }
            );
            console.log("OTP generated response:", response.data);

            if (response?.data?.message === "OTP sent successfully") {
              setOtpSent(true);
              // Reset any previous errors
              setError("");
            } else {
              console.error("OTP generation failed:", response.data);
              setError("Failed to send verification code. Please try again.");
            }
          } catch (apiError) {
            console.error("API Error generating OTP:", apiError);
            console.error("Error response:", apiError.response?.data);
            setError(
              apiError.response?.data?.error ||
                "Failed to send verification code"
            );
            Alert.alert(
              "Error",
              apiError.response?.data?.error ||
                "Failed to send verification code. Please try again."
            );
          }
        } else {
          console.error("No email provided for OTP generation", userData);
          setError(
            "No email address available for verification. Please go back and enter your email."
          );
          Alert.alert("Error", "No email provided for verification");
        }
      } catch (error) {
        console.error("Error generating email OTP:", error);
        setError("An error occurred. Please try again.");
        Alert.alert(
          "Error",
          "Failed to send verification code. Please try again."
        );
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
        // Log the values being sent for verification
        console.log("Verifying OTP with:", {
          email: userData.email,
          otp: otp,
          fullUserData: JSON.stringify(userData),
        });

        // Check if email exists before sending the request
        if (!userData.email) {
          console.error("Email is missing from userData");
          setError(
            "Email address is missing. Please go back and complete previous steps."
          );
          return false;
        }

        // Make the API request with proper payload
        const response = await axios.post(
          "https://signup.roostapp.io/otp/email/verify",
          {
            email: userData.email,
            otp,
          }
        );

        console.log("OTP verification response:", response.data);
        return response.data && response.data.success;
      } catch (error) {
        // Enhanced error logging
        console.error("Error verifying email OTP:", error);
        console.error("Error response:", error.response?.data);

        // Set specific error message if we have one from the server
        if (error.response?.data?.error) {
          setError(error.response.data.error);
        }

        return false;
      }
    };
    const handleVerify = async (validateOnly = false) => {
      try {
        setIsLoading(true);
        if (setBottomBarLoading) setBottomBarLoading(true);

        setError("");
        const code = digits.join("");

        if (code.length !== 6) {
          setError("Please enter the complete 6-digit verification code");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        const success = await verifyEmailOTP(code);

        if (success) {
          console.log("OTP verified successfully");
          // Only navigate if not just validating
          if (!validateOnly) {
            navigation.navigate("Password", userData);
          }
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return true;
        } else {
          setError("Invalid verification code. Please try again.");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        setError("An error occurred. Please try again.");
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
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
              We just sent a verification code to {userData.email}. Please enter
              it below to continue.
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
            <AnimatedDropdown
              visible={!!error}
              style={!!error ? styles.errorBox : {}}
              maxHeight={100}
              contentKey={error}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="Verification error"
              >
                {error}
              </Text>
            </AnimatedDropdown>
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
  scrollView: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  brandLogo: {
    marginBottom: 64,
    alignSelf: "center",
    marginTop: 32,
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  subheading: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 32,
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
  resendButtonTextDisabled: { color: COLORS.gray },
});

// Export the wrapped component with forwardRef
export default EmailVerificationScreen;
