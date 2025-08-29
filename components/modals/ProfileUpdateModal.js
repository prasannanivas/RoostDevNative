import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import ReactNativeModal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  green: "#377473",
  slate: "#707070",
  black: "#1D2327",
};

const ProfileUpdateModal = ({ isVisible, onClose, realtorId }) => {
  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(`profileChecked_${realtorId}`, "true");
      onClose();
    } catch (error) {
      console.error("Error saving profile check status:", error);
    }
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={{ margin: 20 }}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Is your profile up to date?</Text>
        <Text style={styles.modalText}>
          To send rewards or cash, we need the correct information on file. Tap
          your profile icon on the home screen to make updates.
        </Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ReactNativeModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "futura",
    marginBottom: 10,
    textAlign: "center",
    color: COLORS.black,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "futura",
    fontWeight: "600",
    marginBottom: 20,
    color: COLORS.slate,
  },
  continueButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 33,
    width: "100%",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ProfileUpdateModal;
