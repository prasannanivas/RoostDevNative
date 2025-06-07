import React, { useState, useEffect } from "react";
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
// Keep the import for future use
import { TextInputMask } from "react-native-masked-text";

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

export default function PasswordResetScreen({ navigation }) {
  // Screen stages
  const STAGES = {
    CONTACT_INFO: 0,
    OTP_VERIFICATION: 1,
    NEW_PASSWORD: 2,
    SUCCESS: 3, // Add a new success stage
  };

  // State variables
  const [stage, setStage] = useState(STAGES.CONTACT_INFO);
  const [contactMethod, setContactMethod] = useState("email"); // Force to email only
  const [email, setEmail] = useState("");
  // Keep these states for future use
  // const [phone, setPhone] = useState("");
  // const [formattedPhone, setFormattedPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [otpSent, setOtpSent] = useState(false);

  // Store user data from API
  const [userData, setUserData] = useState(null);

  // Refs for OTP input fields
  const inputRefs = React.useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0 && otpSent) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, otpSent]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Keep phone validation for future use
  // const validatePhone = (phone) => {
  //   return phone.replace(/\D/g, "").length === 10;
  // };

  const validatePassword = (password) => {
    return password.length >= 8;
  };
  // Handle OTP digit change
  const handleDigitChange = (text, index) => {
    // Check if multiple characters were pasted
    if (text.length > 1) {
      // Handle paste operation - extract only numeric characters
      const pastedDigits = text.replace(/\D/g, "").slice(0, 6);

      // If it's a full 6-digit code, clear all fields and start from beginning
      if (pastedDigits.length === 6) {
        const newDigits = pastedDigits.split("");
        setOtp(newDigits);

        // Focus the last field to indicate completion
        if (inputRefs.current[5]) {
          inputRefs.current[5].focus();
        }
      } else {
        // If partial code, fill from current position
        const updatedOtp = [...otp];

        for (let i = 0; i < pastedDigits.length && index + i < 6; i++) {
          updatedOtp[index + i] = pastedDigits[i];
        }

        setOtp(updatedOtp);

        // Focus the next empty field or the last filled field
        const nextEmptyIndex = updatedOtp.findIndex(
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
    const updatedOtp = [...otp];
    updatedOtp[index] = newDigit;
    setOtp(updatedOtp);

    // Move to next input if digit entered
    if (newDigit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace in OTP input
  const handleBackspace = (key, index) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Find user by email only
  const findUser = async () => {
    try {
      setIsLoading(true);
      setError("");

      const identifier = email;

      const response = await axios.post(
        "http://44.202.249.124:5000/otp/password-reset/find-user",
        {
          identifier: identifier,
        }
      );

      console.log("Find user response:", response.data);

      if (response.data && response.data.userId) {
        setUserData(response.data);

        // Set the email from response for later use
        if (response.data.email && !email) {
          setEmail(response.data.email);
        }

        // Now generate Email OTP
        return generateEmailOTP();
      } else {
        setError("No account found with that information. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error finding user:", error);
      setError("Error finding account. Please try again.");
      setIsLoading(false);
    }
  };

  // Generate Email OTP
  const generateEmailOTP = async () => {
    try {
      setError("");

      const response = await axios.post(
        "http://44.202.249.124:5000/otp/email/generate",
        {
          email: email,
        }
      );

      console.log("Email OTP response:", response.data);

      if (response?.data?.message === "OTP sent successfully") {
        setOtpSent(true);
        setCountdown(60);

        setStage(STAGES.OTP_VERIFICATION);
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

  // Keep phone OTP function for future use
  // const generatePhoneOTP = async () => {
  //   try {
  //     setError("");
  //
  //     // Simulate OTP sending - in a real implementation, this would call your phone OTP endpoint
  //     setTimeout(() => {
  //       setOtpSent(true);
  //       setCountdown(60);
  //
  //       setStage(STAGES.OTP_VERIFICATION);
  //       setIsLoading(false);
  //     }, 1500);
  //   } catch (error) {
  //     console.error("Error sending phone OTP:", error);
  //     setError("Error sending verification code. Please try again.");
  //     setIsLoading(false);
  //   }
  // };

  // Verify Email OTP
  const verifyEmailOTP = async (otpValue) => {
    try {
      const response = await axios.post(
        "http://44.202.249.124:5000/otp/email/verify",
        {
          email: email,
          otp: otpValue,
        }
      );

      return response.data && response.data.success;
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      return false;
    }
  };

  // Handle resend OTP
  const handleResendOTP = () => {
    if (countdown === 0) {
      generateEmailOTP();
    }
  };

  // Handle verification of OTP
  const handleVerifyOTP = async () => {
    try {
      setIsLoading(true);
      setError("");

      const otpValue = otp.join("");

      if (otpValue.length !== 6) {
        setError("Please enter the complete 6-digit verification code");
        setIsLoading(false);
        return;
      }

      const verificationSuccess = await verifyEmailOTP(otpValue);
      if (!verificationSuccess) {
        setError("Invalid verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      setStage(STAGES.NEW_PASSWORD);
      setIsLoading(false);
    } catch (error) {
      console.error("Error during OTP verification:", error);
      setError("Verification failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle resetting password with the new API
  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!validatePassword(newPassword)) {
        setError("Password must be at least 8 characters long");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (!userData || !userData.userId || !userData.userType) {
        setError("User data is missing. Please try the process again.");
        setIsLoading(false);
        return;
      }

      // Call the password reset endpoint
      const response = await axios.post(
        "http://44.202.249.124:5000/otp/password-reset",
        {
          userId: userData.userId,
          newPassword: newPassword,
          userType: userData.userType,
        }
      );
      console.log("Password reset response:", response);

      if (response.status === 200) {
        // Instead of showing Alert, move to success stage
        setStage(STAGES.SUCCESS);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of contact info
  const handleContactInfoSubmit = () => {
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    findUser();
  };

  // Handle back navigation
  const handleBack = () => {
    if (stage === STAGES.OTP_VERIFICATION) {
      setStage(STAGES.CONTACT_INFO);
    } else if (stage === STAGES.NEW_PASSWORD) {
      setStage(STAGES.OTP_VERIFICATION);
    } else {
      navigation.goBack();
    }
  };

  // Render Contact Info Stage
  const renderContactInfoStage = () => (
    <>
      <Text style={styles.heading}>Reset Your Password</Text>
      <Text style={styles.subheading}>
        Enter the email address associated with your account
      </Text>
      {/* Comment out toggle buttons for contact method */}
      {/* <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            contactMethod === "email" && styles.toggleButtonActive,
          ]}
          onPress={() => setContactMethod("email")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              contactMethod === "email" && styles.toggleButtonTextActive,
            ]}
          >
            Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            contactMethod === "phone" && styles.toggleButtonActive,
          ]}
          onPress={() => setContactMethod("phone")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              contactMethod === "phone" && styles.toggleButtonTextActive,
            ]}
          >
            Phone
          </Text>
        </TouchableOpacity>
      </View> */}{" "}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={COLORS.gray}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {/* Comment out phone input */}
      {/* {contactMethod === "phone" && (
        <View style={styles.phoneContainer}>
          <Text style={styles.phonePrefix}>+1</Text>
          <TextInputMask
            type={"custom"}
            options={{
              mask: "(999) 999-9999",
            }}            style={styles.phoneInput}
            placeholder="Phone Number"
            placeholderTextColor={COLORS.gray}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setFormattedPhone("+1" + text.replace(/\D/g, ""));
            }}
            keyboardType="phone-pad"
          />
        </View>
      } */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </>
  );

  // Render OTP Verification Stage
  const renderOTPVerificationStage = () => (
    <>
      <Text style={styles.heading}>Verify Your Email</Text>
      <Text style={styles.subheading}>
        We sent a verification code to {email}. Please enter it below.
      </Text>
      {/* OTP Input Fields */}
      <View style={styles.codeRow}>
        {otp.map((digit, index) => (
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
      {/* Resend OTP Button */}
      <TouchableOpacity
        style={[
          styles.resendButton,
          countdown > 0 && styles.resendButtonDisabled,
        ]}
        onPress={handleResendOTP}
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
            ? `Resend code in ${countdown} seconds`
            : "Resend code"}
        </Text>
      </TouchableOpacity>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {/* Comment out phone verification note */}
      {/* {contactMethod === "phone" && (
        <Text style={styles.verificationNote}>
          Note: For phone verification, any 6-digit code is accepted at the
          moment
        </Text>
      )} */}
    </>
  );

  // Render New Password Stage
  const renderNewPasswordStage = () => (
    <>
      <Text style={styles.heading}>Create New Password</Text>
      <Text style={styles.subheading}>
        Please enter your new password below
      </Text>{" "}
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor={COLORS.gray}
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor={COLORS.gray}
        secureTextEntry={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <Text style={styles.passwordRequirement}>
        Password must be at least 8 characters long
      </Text>
    </>
  );

  // Add new function to render success stage
  const renderSuccessStage = () => (
    <>
      {" "}
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color={COLORS.green} />
        <Text style={styles.heading}>Password Reset Successful</Text>
        <Text style={styles.subheading}>
          Your password has been reset successfully. Please login with your new
          password.
        </Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.loginButtonText}>Login Now</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Main return with conditional rendering based on stage
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>{" "}
        {isLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        )}
        {/* Conditional rendering based on stage */}
        {stage === STAGES.CONTACT_INFO && renderContactInfoStage()}
        {stage === STAGES.OTP_VERIFICATION && renderOTPVerificationStage()}
        {stage === STAGES.NEW_PASSWORD && renderNewPasswordStage()}
        {stage === STAGES.SUCCESS && renderSuccessStage()}
      </ScrollView>

      {/* Bottom Bar - Hide on success screen */}
      {stage !== STAGES.SUCCESS && (
        <View style={styles.bottomBar}>
          {/* Back Arrow */}
          <TouchableOpacity style={styles.backCircle} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={() => {
              if (stage === STAGES.CONTACT_INFO) handleContactInfoSubmit();
              else if (stage === STAGES.OTP_VERIFICATION) handleVerifyOTP();
              else if (stage === STAGES.NEW_PASSWORD) handleResetPassword();
            }}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {stage === STAGES.NEW_PASSWORD ? "Reset Password" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexGrow: 1,
  },
  brandTitle: {
    fontSize: 24, // H1 size
    fontWeight: "bold", // H1 weight
    marginBottom: 32,
    color: COLORS.black,
    fontFamily: "Futura",
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Futura",
  },
  subheading: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Futura",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    width: "100%",
  },
  toggleButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.green,
  },
  toggleButtonText: {
    color: COLORS.green,
    fontWeight: "500", // P weight
    fontSize: 14, // P size
    fontFamily: "Futura",
  },
  toggleButtonTextActive: {
    color: COLORS.white,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  phonePrefix: {
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
  },
  codeBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    textAlign: "center",
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    borderRadius: 8,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  resendButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: "center",
    marginBottom: 24,
  },
  resendButtonDisabled: {
    borderColor: COLORS.gray,
  },
  resendButtonText: {
    color: COLORS.green,
    fontWeight: "bold", // H4 weight
    fontSize: 12, // H4 size
    fontFamily: "Futura",
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  },
  errorBox: {
    width: "100%",
    backgroundColor: COLORS.noticeContainerBg, // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    lineHeight: 20,
    fontFamily: "Futura",
  },
  passwordRequirement: {
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.slate,
    alignSelf: "flex-start",
    marginLeft: 16,
    marginTop: -16,
    fontFamily: "Futura",
  },
  verificationNote: {
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.slate,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 16,
    fontFamily: "Futura",
  },
  spinnerContainer: {
    marginVertical: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backCircle: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  // Add new styles
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loginButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
    width: "80%",
    alignItems: "center",
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
});
