import React, { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
} from "react-native";
import LottieView from "lottie-react-native";
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

export default function SignupSuccessScreen({
  navigation,
  route,
  setIsLoading,
}) {
  // Debug log route params and state
  useEffect(() => {
    console.log("SignupSuccess route params:", route?.params);
    console.log("SignupSuccess route:", route);
    const navState = navigation.getState();
    console.log("SignupSuccess navigation state:", navState);

    // Log all route params to see what's available
    navState.routes.forEach((route, index) => {
      console.log(`Route ${index} (${route.name}):`, route.params);
    });
  }, [route, navigation]);

  // Get isRealtor from route params or try to get it from navigation state
  const { isRealtor: paramIsRealtor } = route?.params || {};
  const navigationState = navigation.getState();

  // Try to find isRealtor from any of the previous routes
  let routeIsRealtor = false;
  for (const navRoute of navigationState?.routes || []) {
    if (navRoute.params?.isRealtor !== undefined) {
      routeIsRealtor = navRoute.params.isRealtor;
      console.log(
        `Found isRealtor=${routeIsRealtor} in route ${navRoute.name}`
      );
      break;
    }
    // Also check for accountType
    if (navRoute.params?.accountType) {
      routeIsRealtor = navRoute.params.accountType === "realtor";
      console.log(
        `Found accountType=${navRoute.params.accountType} in route ${navRoute.name}, isRealtor=${routeIsRealtor}`
      );
      break;
    }
  }

  // Use the first available value, defaulting to false
  const isRealtor = paramIsRealtor ?? routeIsRealtor ?? false;

  console.log(`Final isRealtor value: ${isRealtor}`);

  // Track ActiveCampaign conversion
  useEffect(() => {
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

  const handleTutorial = (videoId) => {
    let videoUrl = "";
    // For clients
    if (!isRealtor) {
      switch (videoId) {
        case "mortgage":
          videoUrl = "https://roostapp.io/Video6";
          break;
        case "preapproval":
          videoUrl = "https://roostapp.io/Video7";
          break;
        case "help":
          videoUrl = "https://roostapp.io/Video5";
          break;
        case "process":
          videoUrl = "https://roostapp.io/Video1";
          break;
      }
    } else {
      // For realtors
      switch (videoId) {
        case "addClients":
          videoUrl = "https://roostapp.io/Video1";
          break;
        case "maximize":
          videoUrl = "https://roostapp.io/Video2";
          break;
        case "rewards":
          videoUrl = "https://roostapp.io/Video3";
          break;
        case "seeRewards":
          videoUrl = "https://roostapp.io/Video4";
          break;
      }
    }

    if (videoUrl) {
      Linking.openURL(videoUrl);
    }
  };

  const handleGetStarted = () => {
    navigation.navigate("Home");
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
            width={112}
            height={39}
            variant="black"
            style={styles.brandLogo}
          />
          {/* Heading */}
          <Text style={styles.heading}>All signed up!</Text>
          {/* Celebration Animation */}
          <LottieView
            source={require("../assets/celebration.json")}
            autoPlay
            loop={false}
            style={styles.confettiIcon}
          />
          {/* Subheading
          <Text style={styles.subheading}>Before you start</Text>
          <Text style={styles.subheadingsub}>
            you can watch a few tutorials
          </Text>
          {/* Tutorial Buttons */}
          {/* {!isRealtor ? (
            // Client tutorial buttons
            <>
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("help")}
              >
                <Text style={styles.tutorialButtonText}>
                  What if I need help?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("mortgage")}
              >
                <Text style={styles.tutorialButtonText}>
                  What is the process of getting a mortgage?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("preapproval")}
              >
                <Text style={styles.tutorialButtonText}>
                  How quickly can I get pre-approved?
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Realtor tutorial buttons
            <>
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("addClients")}
              >
                <Text style={styles.tutorialButtonText}>
                  How do I add clients?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("maximize")}
              >
                <Text style={styles.tutorialButtonText}>
                  How to maximize Roost?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("rewards")}
              >
                <Text style={styles.tutorialButtonText}>
                  How do rewards work?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => handleTutorial("seeRewards")}
              >
                <Text style={styles.tutorialButtonText}>
                  Where can I see my rewards?
                </Text>
              </TouchableOpacity>
            </>
          )}  */}
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
