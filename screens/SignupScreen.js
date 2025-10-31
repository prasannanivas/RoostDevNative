import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../components/Logo";
import AnimatedDropdown from "../components/common/AnimatedDropdown";
import {} from "react-native-web";

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

const AccountTypeScreen = React.forwardRef(
  ({ navigation, setBottomBarLoading, onExitToLogin }, ref) => {
    const [accountType, setAccountType] = useState("mortgage"); // Default selection
    const [recoId, setRecoId] = useState("");
    const [recoError, setRecoError] = useState(false);

    // Expose validate method to parent via ref
    React.useImperativeHandle(ref, () => ({
      validate: () => {
        // Validate RECO ID if a realtor account is selected
        if (accountType === "realtor") {
          if (!validateRecoId()) {
            return false;
          }
        }

        // Pass account type to next screen
        navigation.setParams({ accountType, recoId });

        return true;
      },
    }));

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
    // We've moved the handleNext function to useImperativeHandle
    // so it can be called by the parent component via ref

    const handleLogin = () => {
      // If parent provided an exit handler (best path), use it
      if (typeof onExitToLogin === "function") {
        onExitToLogin();
        return;
      }
      // Otherwise, attempt safe parent-first navigation
      const parent = navigation?.getParent?.();
      if (parent?.canGoBack?.()) {
        try {
          parent.goBack();
          return;
        } catch (_) {}
      }
      try {
        parent?.navigate?.("Home");
        return;
      } catch (_) {}
      try {
        navigation.navigate("Login");
        return;
      } catch (_) {}
      if (navigation?.canGoBack?.()) navigation.goBack();
    };

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
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
                <AnimatedDropdown
                  visible={recoError}
                  style={styles.recoErrorContainer}
                >
                  <Text style={styles.recoErrorText}>
                    You have not entered a valid RECO ID, each new account is
                    verified to make sure that the agent is valid
                  </Text>
                </AnimatedDropdown>
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
              By signing up, you agree to Roost's{" "}
              <Text
                style={styles.linkText}
                onPress={() => {
                  Linking.openURL("https://roostapp.io/terms-of-service");
                }}
                accessibilityRole="link"
              >
                Terms of Use
              </Text>{" "}
              and{" "}
              <Text
                style={styles.linkText}
                onPress={() => {
                  Linking.openURL("https://roostapp.io/privacy");
                }}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
              . By providing your email & phone number, you consent to receive
              communications from Roost. You can opt-out anytime.
            </Text>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
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
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Futura",
  },

  /* Pill Buttons */
  pillContainer: {
    marginBottom: 24,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 50,
    paddingVertical: 13,
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
    fontSize: 12, // H3 size
    fontWeight: "700", // H3 weight (medium)
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
    backgroundColor: "#F0913A80", // Using notice container background with 25% opacity
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  recoErrorText: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: "#707070",
    fontFamily: "Futura",
  },

  alreadyHaveAccount: {
    fontSize: 12, // P size
    fontWeight: 500, // P weight
    color: "#1D2327",
    marginBottom: 24,
    fontFamily: "Futura",
  },
  loginLink: {
    fontSize: 12, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    textDecorationLine: "underline",
    fontFamily: "Futura",
  },
  footerText: {
    fontSize: 12, // Sub-p size
    fontWeight: 500, // Sub-p weight
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
});

// Export the wrapped component with forwardRef
export default AccountTypeScreen;
