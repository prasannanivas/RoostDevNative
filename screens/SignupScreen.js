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
    // Check if RECO ID meets your criteria
    if (!recoId || recoId.trim().length < 5) {
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
    navigation.navigate('Details', { accountType, recoId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
            <TextInput
              style={styles.recoInput}
              placeholder="Your RECO id number"
              placeholderTextColor="#999999"
              value={recoId}
              onChangeText={setRecoId}
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: 30,
  },

  /* Pill Buttons */
  pillContainer: {
    width: "100%",
    marginBottom: 20,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25, // Large borderRadius for "pill" shape
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  pillSelected: {
    backgroundColor: "#019B8E", // Fill color when selected
  },
  pillUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#019B8E",
  },
  checkIcon: {
    marginRight: 8,
  },
  pillText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
  pillTextUnselected: {
    color: "#019B8E",
  },

  /* RECO ID Input & Error */
  recoInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#23231A",
  },
  recoErrorContainer: {
    backgroundColor: "#FCEED2", // Light orange background
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  recoErrorText: {
    fontSize: 14,
    color: "#23231A",
  },

  alreadyHaveAccount: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 20,
  },
  loginLink: {
    fontSize: 14,
    color: "#019B8E",
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: 12,
    color: "#23231A",
    textAlign: "center",
    lineHeight: 18,
    marginHorizontal: 10,
    marginBottom: 40,
  },
  linkText: {
    color: "#019B8E",
    textDecorationLine: "underline",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#23231A",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
