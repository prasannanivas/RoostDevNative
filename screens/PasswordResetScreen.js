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
import { TextInputMask } from "react-native-masked-text";

export default function PasswordResetScreen({ navigation }) {
  // Screen stages
  const STAGES = {
    CONTACT_INFO: 0,
    OTP_VERIFICATION: 1,
    NEW_PASSWORD: 2,
  };

  // State variables
  const [stage, setStage] = useState(STAGES.CONTACT_INFO);
  const [contactMethod, setContactMethod] = useState("email"); // "email" or "phone"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
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

  const validatePhone = (phone) => {
    return phone.replace(/\D/g, "").length === 10;
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Handle OTP digit change
  const handleDigitChange = (text, index) => {
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

  // Find user by email or phone
  const findUser = async () => {
    try {
      setIsLoading(true);
      setError("");

      const identifier = contactMethod === "email" ? email : formattedPhone;

      const response = await axios.post(
        "http://44.202.249.124:5000/otp/password-reset/find-user",
        {
          identifier: identifier,
        }
      );

      console.log("Find user response:", response.data);

      if (response.data && response.data.userId) {
        setUserData(response.data);

        // Set the email and phone from response for later use
        if (response.data.email && !email) {
          setEmail(response.data.email);
        }

        if (response.data.phone && !formattedPhone) {
          setFormattedPhone(response.data.phone);
        }

        // Now generate OTP
        if (contactMethod === "email") {
          return generateEmailOTP();
        } else {
          return generatePhoneOTP();
        }
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
        Alert.alert("OTP Sent", `Verification code sent to ${email}`);
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

  // Handle phone OTP (mock implementation)
  const generatePhoneOTP = async () => {
    try {
      setError("");

      // Simulate OTP sending - in a real implementation, this would call your phone OTP endpoint
      setTimeout(() => {
        setOtpSent(true);
        setCountdown(60);
        Alert.alert("OTP Sent", `Verification code sent to ${formattedPhone}`);
        setStage(STAGES.OTP_VERIFICATION);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      setError("Error sending verification code. Please try again.");
      setIsLoading(false);
    }
  };

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
      if (contactMethod === "email") {
        generateEmailOTP();
      } else {
        generatePhoneOTP();
      }
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

      let verificationSuccess = true;

      if (contactMethod === "email") {
        verificationSuccess = await verifyEmailOTP(otpValue);
        if (!verificationSuccess) {
          setError("Invalid verification code. Please try again.");
          setIsLoading(false);
          return;
        }
      }
      // For phone, accept any code for now

      if (verificationSuccess) {
        setStage(STAGES.NEW_PASSWORD);
        setIsLoading(false);
      }
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

      if (response.data && response.data.success) {
        // Show success message and redirect to login page
        Alert.alert(
          "Password Reset Successful",
          "Your password has been reset successfully. Please login with your new password.",
          [
            {
              text: "Login Now",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
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

    if (contactMethod === "email") {
      if (!email) {
        setError("Please enter your email address");
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
    } else {
      if (!phone) {
        setError("Please enter your phone number");
        return;
      }

      if (!validatePhone(phone)) {
        setError("Please enter a valid 10-digit phone number");
        return;
      }
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
        Enter the email or phone number associated with your account
      </Text>

      {/* Toggle buttons for contact method */}
      <View style={styles.toggleContainer}>
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
      </View>

      {contactMethod === "email" ? (
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ) : (
        <View style={styles.phoneContainer}>
          <Text style={styles.phonePrefix}>+1</Text>
          <TextInputMask
            type={"custom"}
            options={{
              mask: "(999) 999-9999",
            }}
            style={styles.phoneInput}
            placeholder="Phone Number"
            placeholderTextColor="#999999"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setFormattedPhone("+1" + text.replace(/\D/g, ""));
            }}
            keyboardType="phone-pad"
          />
        </View>
      )}

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
      <Text style={styles.heading}>
        Verify Your {contactMethod === "email" ? "Email" : "Phone"}
      </Text>
      <Text style={styles.subheading}>
        We sent a verification code to{" "}
        {contactMethod === "email" ? email : formattedPhone}. Please enter it
        below.
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
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            autoFocus={index === 0}
            editable={!isLoading}
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

      {contactMethod === "phone" && (
        <Text style={styles.verificationNote}>
          Note: For phone verification, any 6-digit code is accepted at the
          moment
        </Text>
      )}
    </>
  );

  // Render New Password Stage
  const renderNewPasswordStage = () => (
    <>
      <Text style={styles.heading}>Create New Password</Text>
      <Text style={styles.subheading}>
        Please enter your new password below
      </Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#999999"
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#999999"
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

  // Main return with conditional rendering based on stage
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {isLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#019B8E" />
          </View>
        )}

        {/* Conditional rendering based on stage */}
        {stage === STAGES.CONTACT_INFO && renderContactInfoStage()}
        {stage === STAGES.OTP_VERIFICATION && renderOTPVerificationStage()}
        {stage === STAGES.NEW_PASSWORD && renderNewPasswordStage()}
      </ScrollView>

      {/* Bottom Bar */}
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
    flexGrow: 1,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    color: "#23231A",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 15,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#019B8E",
  },
  toggleButtonActive: {
    backgroundColor: "#019B8E",
  },
  toggleButtonText: {
    color: "#019B8E",
    fontWeight: "600",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#23231A",
    marginBottom: 20,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
  },
  phonePrefix: {
    paddingLeft: 15,
    paddingRight: 5,
    fontSize: 16,
    color: "#23231A",
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#23231A",
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 30,
  },
  codeBox: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    textAlign: "center",
    fontSize: 24,
    borderRadius: 8,
    fontSize: 18,
    color: "#23231A",
  },
  resendButton: {
    borderWidth: 2,
    borderColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "center",
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
  errorBox: {
    width: "100%",
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
  passwordRequirement: {
    fontSize: 13,
    color: "#666666",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: -10,
  },
  verificationNote: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 10,
  },
  spinnerContainer: {
    marginVertical: 20,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#23231A",
    justifyContent: "center",
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
