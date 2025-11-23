import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
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
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
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
        </Animated.View>
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
    position: "absolute",
    bottom: 20,
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
