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

export default function SignupSuccessScreen({ navigation }) {
  const handleTutorial = (topic) => {
    console.log("Navigate to tutorial topic:", topic);
    // TODO: Implement actual navigation or linking logic
  };

  const handleGetStarted = () => {
    navigation.navigate("Home"); // Using screen name instead of "/"
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          showsVerticalScrollIndicator={true}
        >
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
            size={100} // reduced from 164
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

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedButtonText}>Let me get started!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 90, // Added extra padding for bottom button
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#23231A",
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 15,
  },
  confettiIcon: {
    marginBottom: 15,
    width: 100,
    height: 100,
  },
  subheading: {
    fontSize: 14,
    color: "#23231A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  // Tutorial Buttons
  tutorialButton: {
    width: "100%",
    borderColor: "#019B8E",
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  tutorialButtonText: {
    color: "#019B8E",
    fontSize: 14,
    fontWeight: "600",
  },
  // Bottom Container & Button
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 16,
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  getStartedButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    minHeight: 48,
  },
  getStartedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
