import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import Button from "../components/common/Button";
import BackButton from "../components/icons/BackButton";
import Logo from "../components/Logo";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  white: "#FDFDFD",
};

const PreQuestionnaireScreen = ({
  brokerName,
  onSelectOnline,
  onSelectCall,
  onBack,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleContinue = () => {
    if (selectedOption === "online") {
      onSelectOnline();
    } else if (selectedOption === "call") {
      onSelectCall();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />
        </View>

        <View style={styles.contentWrapper}>
          <Text style={styles.questionText}>
            Do you want to apply online or by phone?
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "online" && styles.selectedButton,
              ]}
              onPress={() => setSelectedOption("online")}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === "online" && styles.selectedText,
                ]}
              >
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "call" && styles.selectedButton,
              ]}
              onPress={() => setSelectedOption("call")}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === "call" && styles.selectedText,
                ]}
              >
                Schedule a call with {brokerName || "a mortgage broker"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fixed Footer */}
      {(Platform.OS === "ios" || true) && (
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              disabled={!selectedOption}
              style={
                selectedOption
                  ? styles.continueButton
                  : styles.continueButtonDisabled
              }
            />

            {onBack && (
              <Button
                Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
                onPress={onBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 63,
    justifyContent: "flex-start",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  brandLogo: {
    // Logo component will handle its own styling
    marginBottom: 16,
  },
  contentWrapper: {
    maxWidth: 500,
    minWidth: 310,
    alignSelf: "center",
    width: "100%",
    height: "100%",
    marginTop: "30%",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0,
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 24,
    textAlign: "left",
  },
  optionsContainer: {
    gap: 16,
    alignItems: "flex-start",
    width: "100%",
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: COLORS.background,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    gap: 10,
    alignItems: "center",
    width: "auto",
    alignSelf: "flex-start",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: COLORS.green,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  selectedText: {
    color: COLORS.white,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "15%",
    justifyContent: "center",
    backgroundColor: COLORS.black,
  },
  buttonContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    borderWidth: 0,
    backgroundColor: COLORS.black,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonDisabled: {
    backgroundColor: "#E8E8E8",
    color: COLORS.white,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 12,
  },
});

export default PreQuestionnaireScreen;
