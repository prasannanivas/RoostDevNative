import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/common/Button";
import Logo from "../components/Logo";
import Svg, { Path } from "react-native-svg";

const COLORS = {
  blue: "#3B7EA1",
  red: "#C8102E",
  white: "#FFFFFF",
  black: "#1D2327",
};

const BrokerIntroScreen = ({ brokerName, brokerImage, onContinue }) => {
  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current; // Start at center
  const brokerPosition = useRef(new Animated.Value(0)).current; // Start at center (stacked behind logo)
  const brokerOpacity = useRef(new Animated.Value(1)).current; // Start visible

  // Text animations
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitlePosition = useRef(new Animated.Value(-20)).current; // Start 20px up and right
  const instructionsOpacity = useRef(new Animated.Value(0)).current;
  const instructionsPosition = useRef(new Animated.Value(20)).current; // Start 20px down and right

  // Star animations - 4 stars going to corners
  const star1Opacity = useRef(new Animated.Value(1)).current; // Top-left star
  const star1X = useRef(new Animated.Value(0)).current;
  const star1Y = useRef(new Animated.Value(0)).current;

  const star2Opacity = useRef(new Animated.Value(1)).current; // Top-right star
  const star2X = useRef(new Animated.Value(0)).current;
  const star2Y = useRef(new Animated.Value(0)).current;

  const star3Opacity = useRef(new Animated.Value(1)).current; // Bottom-left star
  const star3X = useRef(new Animated.Value(0)).current;
  const star3Y = useRef(new Animated.Value(0)).current;

  const star4Opacity = useRef(new Animated.Value(1)).current; // Bottom-right star
  const star4X = useRef(new Animated.Value(0)).current;
  const star4Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations after a brief delay
    setTimeout(() => {
      Animated.parallel([
        // Move logo circle to the left
        Animated.timing(logoPosition, {
          toValue: -65, // Move 65px to the left from center
          duration: 800,
          useNativeDriver: true,
        }),
        // Move broker image to the right
        Animated.timing(brokerPosition, {
          toValue: 65, // Move 65px to the right from center
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade in and move subtitle
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(subtitlePosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade in and move instructions
        Animated.timing(instructionsOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(instructionsPosition, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Star 1 - Top-left corner
        Animated.timing(star1X, {
          toValue: -150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star1Y, {
          toValue: -150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star1Opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Star 2 - Top-right corner
        Animated.timing(star2X, {
          toValue: 150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star2Y, {
          toValue: -150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star2Opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Star 3 - Bottom-left corner
        Animated.timing(star3X, {
          toValue: -150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star3Y, {
          toValue: 150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star3Opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Star 4 - Bottom-right corner
        Animated.timing(star4X, {
          toValue: 150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star4Y, {
          toValue: 150,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(star4Opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300); // Small delay before starting animations
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Meet {brokerName}!</Text>

        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              transform: [
                { translateY: subtitlePosition },
                { translateX: subtitlePosition },
              ],
            },
          ]}
        >
          You will be able to chat and share with {brokerName} in the app
        </Animated.Text>

        <View style={styles.imagesContainer}>
          {/* Star 1 - Top-left */}
          <Animated.View
            style={[
              styles.star,
              {
                opacity: star1Opacity,
                transform: [{ translateX: star1X }, { translateY: star1Y }],
              },
            ]}
          >
            <Ionicons name="star" size={48} color={COLORS.white} />
          </Animated.View>

          {/* Star 2 - Top-right */}
          <Animated.View
            style={[
              styles.star,
              {
                opacity: star2Opacity,
                transform: [{ translateX: star2X }, { translateY: star2Y }],
              },
            ]}
          >
            <Ionicons name="star" size={48} color={COLORS.white} />
          </Animated.View>

          {/* Star 3 - Bottom-left */}
          <Animated.View
            style={[
              styles.star,
              {
                opacity: star3Opacity,
                transform: [{ translateX: star3X }, { translateY: star3Y }],
              },
            ]}
          >
            <Ionicons name="star" size={48} color={COLORS.white} />
          </Animated.View>

          {/* Star 4 - Bottom-right */}
          <Animated.View
            style={[
              styles.star,
              {
                opacity: star4Opacity,
                transform: [{ translateX: star4X }, { translateY: star4Y }],
              },
            ]}
          >
            <Ionicons name="star" size={48} color={COLORS.white} />
          </Animated.View>

          <Animated.View
            style={[
              styles.logoCircle,
              {
                transform: [{ translateX: logoPosition }],
              },
            ]}
          >
            <Svg
              width="114"
              height="111"
              viewBox="0 0 114 111"
              fill="none"
              xmlns="http://www.w3.org/2000/Svg"
            >
              <Path
                d="M80.9133 34.8384L73.2443 48.4415C71.4753 41.1536 65.105 35.9358 57.4508 35.5168C41.3436 35.1277 34.64 35.7163 32.0134 36.4297C29.1076 41.0887 27.4219 46.6108 27.4219 52.5369C27.4219 69.163 56.995 105.204 56.995 105.204C56.995 105.204 86.5682 69.163 86.5682 52.5369C86.5682 45.9224 84.466 39.8067 80.9133 34.8384Z"
                fill="white"
              />
              <Path
                d="M57.98 57.7397C61.3439 57.7397 64.071 54.9637 64.071 51.5392C64.071 48.1148 61.3439 45.3387 57.98 45.3387C54.616 45.3387 51.8889 48.1148 51.8889 51.5392C51.8889 54.9637 54.616 57.7397 57.98 57.7397Z"
                fill="#8B1C41"
              />
              <Path
                d="M74.0235 78.541V64.2395H91.9585L75.7974 51.0404C74.7488 54.8066 70.5639 60.5082 67.7806 63.5461C58.5044 75.119 46.8613 79.1346 56.7256 86.8366C56.7256 86.8864 56.7158 86.9313 56.7158 86.9812C56.7158 92.5033 61.763 96.9828 67.9864 96.9828C74.2097 96.9828 79.257 92.5033 79.257 86.9812C79.257 83.4295 77.1646 80.3168 74.0235 78.546V78.541Z"
                fill="#8B1C41"
              />
              <Path
                d="M46.2978 24.4726C44.8767 25.0313 43.5144 25.7048 42.2109 26.468C47.0377 27.5255 52.1585 28.3186 52.1585 28.3186C49.8015 27.72 47.8708 26.2884 46.2978 24.4677V24.4726Z"
                fill="white"
              />
              <Path
                d="M63.091 29.2964C63.5418 28.0144 64.365 25.9991 65.6146 23.7344C64.6052 23.4201 63.5712 23.1657 62.5225 22.9662C62.4931 26.6426 63.091 29.2964 63.091 29.2964Z"
                fill="white"
              />
              <Path
                d="M73.4355 14.2117C69.873 17.0401 67.3346 20.6217 65.6146 23.7344C64.3602 25.9991 63.5418 28.0143 63.091 29.2963C63.091 29.2963 62.4932 26.6426 62.5226 22.9662C62.5618 18.4667 63.5418 12.4408 67.7316 7.83661C64.5611 5.21276 60.8271 3.53669 56.5197 3.83599C48.9586 4.36475 45.2393 12.0068 43.4213 20.0779C44.2102 21.6343 45.1658 23.1557 46.3027 24.4726C47.8756 26.2884 49.8064 27.725 52.1634 28.3236C52.1634 28.3236 47.0426 27.5305 42.2158 26.473C38.7807 28.4982 35.7818 31.1969 33.4002 34.4044C32.9151 35.0579 31.3127 37.123 29.676 41.0289C32.3026 40.3155 41.3485 35.1277 57.4557 35.5218C65.105 35.9408 71.4803 41.1586 73.2493 48.4465L80.9182 34.8434L81.0505 34.6089C81.0505 34.6089 78.5122 21.5096 73.4404 14.2167L73.4355 14.2117Z"
                fill="#8B1C41"
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              styles.brokerImageCircle,
              {
                transform: [{ translateX: brokerPosition }],
              },
            ]}
          >
            {brokerImage ? (
              <Image
                source={{ uri: brokerImage }}
                style={styles.brokerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {brokerName?.charAt(0) || "M"}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.instructions,
            {
              opacity: instructionsOpacity,
              transform: [
                { translateY: instructionsPosition },
                { translateX: instructionsPosition },
              ],
            },
          ]}
        >
          Just click the "HELP" button once you complete the application
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: "10",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.white,
    marginBottom: 40,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.white,
    marginBottom: 60,
    textAlign: "center",
    lineHeight: 28,
  },
  imagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 80,
    position: "relative",
    width: "100%",
    height: 150,
  },
  star: {
    position: "absolute",
    zIndex: 5,
  },
  starText: {
    fontSize: 48,
    color: COLORS.white,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: COLORS.white,
    position: "absolute",
    zIndex: 3,
  },
  brokerImageCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: COLORS.white,
    overflow: "hidden",
    position: "absolute",
    zIndex: 2,
  },
  brokerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.blue,
  },
  instructions: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButton: {
    width: "fit-content",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: "#377473",
  },
});

export default BrokerIntroScreen;
