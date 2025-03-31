import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PhoneVerificationScreen() {
  // Store each digit in a separate array element
  const [digits, setDigits] = useState(["", "", "", "", ""]);

  // Refs to each TextInput so we can focus the next one automatically
  const inputRefs = useRef([]);

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

  const handleResend = () => {
    console.log("Resend code logic here");
    // You could trigger a timer or show a countdown to re-send
  };

  const handleVerify = () => {
    const code = digits.join("");
    console.log("Verification code entered:", code);
    // TODO: Verify the code with your backend or proceed to next step
  };

  const handleBack = () => {
    console.log("Back arrow pressed");
    // TODO: navigation.goBack() or close
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Heading */}
        <Text style={styles.heading}>Verify your phone number</Text>

        {/* Subheading */}
        <Text style={styles.subheading}>
          We just sent you a text message, please enter the number below
        </Text>

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
          style={styles.resendButton}
          onPress={handleResend}
          activeOpacity={0.8}
        >
          <Text style={styles.resendButtonText}>
            Send message again in 60 seconds
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backCircle} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify</Text>
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
    marginBottom: 30,
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
  },
  resendButtonText: {
    color: "#019B8E",
    fontWeight: "600",
    fontSize: 14,
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
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
