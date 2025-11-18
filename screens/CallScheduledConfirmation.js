import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Logo from "../components/Logo";

const COLORS = {
  background: "#F6F6F6",
  black: "#1D2327",
  green: "#377473",
};

const CallScheduledConfirmation = ({
  brokerName,
  brokerImage,
  scheduledDay,
  scheduledTime,
  onContinue,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo
          width={183}
          height={158}
          variant="black"
          style={styles.brandLogo}
        />
      </View>

      <View style={styles.imageContainer}>
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
      </View>

      <Text style={styles.messageText}>You can expect a call from</Text>
      <Text style={styles.brokerNameText}>
        {brokerName} {scheduledDay} {scheduledTime}
      </Text>

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
    backgroundColor: COLORS.background,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  brandLogo: {
    // Logo component will handle its own styling
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 60,
    backgroundColor: "#E0E0E0",
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
    fontSize: 72,
    fontWeight: "700",
    fontFamily: "Futura",
    color: "#377473",
  },
  messageText: {
    fontSize: 18,
    fontWeight: "400",
    fontFamily: "Futura",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 8,
  },
  brokerNameText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.black,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 24,
    paddingHorizontal: 40,
    backgroundColor: COLORS.black,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 33,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
    color: "#FFFFFF",
  },
});

export default CallScheduledConfirmation;
