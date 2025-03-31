import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import ConfettiIcon from "../assets/confetti.png"; // Example if you have a custom asset

export default function WelcomeRealtorScreen() {
  const handleTutorial = (topic) => {
    console.log("Navigate to tutorial topic:", topic);
    // TODO: Implement actual navigation or linking logic
  };

  const handleGetStarted = () => {
    console.log("Let me get started!");
    // TODO: Navigate to the main app or next screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Heading */}
        <Text style={styles.heading}>All signed up!</Text>

        {/* Confetti / Party Popper Icon */}
        {/* Replace Ionicons with a custom image if you have one: 
            <Image source={ConfettiIcon} style={styles.confettiIcon} />
        */}
        <Ionicons
          name="wine"
          size={164}
          color="#FF0000"
          style={styles.confettiIcon}
        />

        {/* Subheading */}
        <Text style={styles.subheading}>
          Before you start{"\n"}You can watch a few tutorials
        </Text>

        {/* Tutorial Buttons */}
        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={() => handleTutorial("rewards")}
        >
          <Text style={styles.tutorialButtonText}>How do rewards work?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={() => handleTutorial("maximize")}
        >
          <Text style={styles.tutorialButtonText}>How to maximize Roost</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={() => handleTutorial("help")}
        >
          <Text style={styles.tutorialButtonText}>What if I need help?</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Let me get started!</Text>
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
    color: "#23231A",
    marginBottom: 30,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 20,
  },
  confettiIcon: {
    marginBottom: 20,
    width: 164,
    height: 164,
  },
  subheading: {
    fontSize: 16,
    color: "#23231A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },

  // Tutorial Buttons
  tutorialButton: {
    width: "100%",
    borderColor: "#019B8E",
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  tutorialButtonText: {
    color: "#019B8E",
    fontSize: 16,
    fontWeight: "600",
  },

  // Bottom Container & Button
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  getStartedButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  getStartedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
