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
          */}{" "}
          <Ionicons
            name="wine"
            size={100} // reduced from 164
            color={COLORS.green}
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
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 96, // Added extra padding for bottom button
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 24, // H1 size
    fontWeight: "bold", // H1 weight
    color: COLORS.black,
    marginBottom: 24,
    fontFamily: "Futura",
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  confettiIcon: {
    marginBottom: 16,
    width: 100,
    height: 100,
  },
  subheading: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    marginTop: 16,
    fontFamily: "Futura",
  },
  // Tutorial Buttons
  tutorialButton: {
    width: "100%",
    borderColor: COLORS.green,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  tutorialButtonText: {
    color: COLORS.green,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  // Bottom Container & Button
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    padding: 16,
    backgroundColor: COLORS.white,
    width: "100%",
  },
  getStartedButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    minHeight: 48,
  },
  getStartedButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    textAlign: "center",
    fontFamily: "Futura",
  },
});
