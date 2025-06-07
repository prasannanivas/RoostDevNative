import React, { useState } from "react";
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

export default function AccountTypeScreen({ navigation }) {
  const [accountType, setAccountType] = useState("mortgage"); // Default selection
  const [recoId, setRecoId] = useState("");
  const [recoError, setRecoError] = useState(false);

  // Switch between mortgage or realtor
  const handleSelect = (type) => {
    setAccountType(type);
    // Reset RECO-related fields if user switches away
    if (type !== "realtor") {
      setRecoId("");
      setRecoError(false);
    }
  };

  // Simple validation example
  const validateRecoId = () => {
    const recoRegex = /^\d{7}$/;
    if (!recoRegex.test(recoId)) {
      setRecoError(true);
      return false;
    }
    setRecoError(false);
    return true;
  };

  const handleNext = () => {
    if (accountType === "realtor") {
      if (!validateRecoId()) {
        return;
      }
    }
    navigation.navigate("Details", { accountType, recoId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Prompt */}
        <Text style={styles.heading}>
          What type of account are you sign up for?
        </Text>

        {/* Pill Buttons */}
        <View style={styles.pillContainer}>
          {/* Mortgage Pill */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              accountType === "mortgage"
                ? styles.pillSelected
                : styles.pillUnselected,
            ]}
            onPress={() => handleSelect("mortgage")}
            activeOpacity={0.8}
          >
            {accountType === "mortgage" && (
              <Ionicons
                name="checkmark"
                size={16}
                color="#FFFFFF"
                style={styles.checkIcon}
              />
            )}
            <Text
              style={[
                styles.pillText,
                accountType === "mortgage"
                  ? styles.pillTextSelected
                  : styles.pillTextUnselected,
              ]}
            >
              Looking for a mortgage
            </Text>
          </TouchableOpacity>

          {/* Realtor Pill */}
          <TouchableOpacity
            style={[
              styles.pillButton,
              accountType === "realtor"
                ? styles.pillSelected
                : styles.pillUnselected,
            ]}
            onPress={() => handleSelect("realtor")}
            activeOpacity={0.8}
          >
            {accountType === "realtor" && (
              <Ionicons
                name="checkmark"
                size={16}
                color="#FFFFFF"
                style={styles.checkIcon}
              />
            )}
            <Text
              style={[
                styles.pillText,
                accountType === "realtor"
                  ? styles.pillTextSelected
                  : styles.pillTextUnselected,
              ]}
            >
              Realtor account
            </Text>
          </TouchableOpacity>
        </View>

        {/* RECO ID Input & Error - Only show if 'realtor' is selected */}
        {accountType === "realtor" && (
          <View style={{ width: "100%", marginBottom: 20 }}>
            {" "}
            <TextInput
              style={styles.recoInput}
              placeholder="Your RECO id number"
              placeholderTextColor={COLORS.gray}
              value={recoId}
              onChangeText={(text) =>
                text.match(/^\d{0,7}$/) ? setRecoId(text) : null
              }
              keyboardType="numeric"
              maxLength={7}
            />
            {recoError && (
              <View style={styles.recoErrorContainer}>
                <Text style={styles.recoErrorText}>
                  You have not entered a valid RECO ID, each new account is
                  verified to make sure that the agent is valid
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Already have an account? Log in here */}
        <Text style={styles.alreadyHaveAccount}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={handleLogin}>
            Log in here
          </Text>
        </Text>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          By signing up, you agree to Roost’s{" "}
          <Text style={styles.linkText}>Terms of Use</Text> and{" "}
          <Text style={styles.linkText}>Privacy Policy</Text>. By providing your
          email & phone number, you consent to receive communications from
          Roost. You can opt-out anytime.
        </Text>
      </ScrollView>

      {/* Bottom navigation bar */}
      <View style={styles.bottomBar}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backCircle} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
  container: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Futura",
  },

  /* Pill Buttons */
  pillContainer: {
    width: "100%",
    marginBottom: 24,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8, // Updated to match design system
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  pillSelected: {
    backgroundColor: COLORS.green, // Updated color
  },
  pillUnselected: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  checkIcon: {
    marginRight: 8,
  },
  pillText: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight (medium)
    fontFamily: "Futura",
  },
  pillTextSelected: {
    color: COLORS.white,
  },
  pillTextUnselected: {
    color: COLORS.green,
  },

  /* RECO ID Input & Error */
  recoInput: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  recoErrorContainer: {
    backgroundColor: COLORS.noticeContainerBg, // Using notice container background with 25% opacity
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  recoErrorText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },

  alreadyHaveAccount: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    marginBottom: 24,
    fontFamily: "Futura",
  },
  loginLink: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.green,
    textDecorationLine: "underline",
    fontFamily: "Futura",
  },
  footerText: {
    fontSize: 12, // Sub-p size
    fontWeight: "500", // Sub-p weight
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 18,
    marginHorizontal: 16,
    marginBottom: 48,
    fontFamily: "Futura",
  },
  linkText: {
    color: COLORS.green,
    textDecorationLine: "underline",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  backCircle: {
    width: 48,
    height: 48,
    borderRadius: 8, // Updated to match design system
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
});
