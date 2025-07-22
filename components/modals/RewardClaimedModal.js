import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Design System Colors
const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#1D2327",
  gray: "#666666",
  lightGray: "#CCCCCC",
  silver: "#F6F6F6",
  white: "#FFFFFF",
};

export default function RewardClaimedModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={24} color="#999" />
          </TouchableOpacity>

          <Text style={styles.title}>Congratulations</Text>

          <Image
            source={require("../../assets/signupSuccess.png")}
            style={styles.confettiIcon}
            resizeMode="contain"
          />

          <Text style={styles.message}>
            We will be sending your reward in the next few days. You should
            receive an email follow up once it's sent out
          </Text>

          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray,
    borderRadius: 50,
    zIndex: 1,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 20,
    textAlign: "center",
  },
  confettiIcon: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.black,
    marginBottom: 24,
    textAlign: "center",
  },
  okButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 33,
    alignItems: "center",
  },
  okButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
});
