import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
// import { Ionicons } from "@expo/vector-icons"; // No longer needed
import { Asset } from "expo-asset";
import Logo from "../components/Logo";

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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload image and track ActiveCampaign conversion
  useEffect(() => {
    // Preload the celebration image
    const preloadImages = async () => {
      try {
        // Create asset object from the image
        const asset = Asset.fromModule(require("../assets/signupSuccess.png"));
        // Download/load the image if it's not already cached
        await asset.downloadAsync();
        setImageLoaded(true);
      } catch (error) {
        console.error("Failed to preload image:", error);
        // Set loaded to true anyway so UI isn't blocked
        setImageLoaded(true);
      }
    };

    preloadImages();
    trackActiveCampaignConversion();
  }, []);

  // Function to track ActiveCampaign conversion
  const trackActiveCampaignConversion = async () => {
    try {
      // Set to false if opt-in required
      const trackConversionByDefault = true;

      // We can't directly use cookies in React Native, so we'll make a direct tracking call
      const trackcmp_email = "";
      const trackcmp_conversion = "%CONVERSION_ID%";
      const trackcmp_conversion_value = "";

      // Create the tracking URL
      const trackingUrl = `https://trackcmp.net/convert?actid=652720765&e=${encodeURIComponent(
        trackcmp_email
      )}&c=${trackcmp_conversion}&v=${trackcmp_conversion_value}&r=&u=${encodeURIComponent(
        "app://roost-realtor-signup-success"
      )}`;

      // For web (if this app can run on web)
      if (Platform.OS === "web") {
        // Create and append script element (similar to the original script)
        const script = document.createElement("script");
        script.async = true;
        script.src = trackingUrl;
        document.head.appendChild(script);
      } else {
        // For native platforms, make a background network request
        // This doesn't actually open the URL in a browser, just makes the request
        fetch(trackingUrl).catch((err) =>
          console.log("ActiveCampaign tracking error:", err)
        );
      }

      console.log("ActiveCampaign conversion tracked");
    } catch (error) {
      console.error("Failed to track ActiveCampaign conversion:", error);
    }
  };

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
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />
          {/* Heading */}
          <Text style={styles.heading}>All signed up!</Text>
          {/* Celebration Image with loading state */}
          {imageLoaded ? (
            <Image
              source={require("../assets/signupSuccess.png")}
              style={styles.confettiIcon}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.green} />
            </View>
          )}
          {/* Subheading */}
          <Text style={styles.subheading}>Before you start</Text>
          <Text style={styles.subheadingsub}>
            You can watch a few tutorials
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
  brandLogo: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 24, // H2 size
    fontWeight: 700, // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  confettiIcon: {
    marginBottom: 16,
    width: 120,
    height: 120,
    alignSelf: "center",
  },
  loaderContainer: {
    marginBottom: 16,
    width: 120,
    height: 120,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  subheading: {
    fontSize: 20, // P size
    fontWeight: 700, // P weight
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
    marginTop: 16,
    fontFamily: "Futura",
  },

  subheadingsub: {
    fontSize: 14, // P size
    fontWeight: 500, // P weight
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: "Futura",
  },
  // Tutorial Buttons
  tutorialButton: {
    width: "100%",
    borderColor: COLORS.green,
    borderWidth: 2,
    borderRadius: 50,
    paddingVertical: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  tutorialButtonText: {
    color: COLORS.green,
    fontSize: 12, // P size
    fontWeight: "700", // P weight
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
    borderRadius: 50,
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
