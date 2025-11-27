import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Svg, { Circle, Path } from "react-native-svg";

const PurchaseDetailsModal = ({
  client,
  onClose,
  onConfirm,
  visible = true,
}) => {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        onClose();
      }, 50);
    });
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleConfirm = async () => {
    if (!address || !city || !postalCode || !amount) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    const clientId = client?.inviteeId;
    if (!clientId) {
      Alert.alert("Error", "Client information is missing");
      return;
    }

    setSubmitting(true);

    try {
      // Call the API to request paperwork
      await axios.post(
        `https://signup.roostapp.io/admin/client/${clientId}/request-paperwork`
      );

      // Also pass the purchase details if needed
      const purchaseDetails = {
        address,
        city,
        postalCode,
        amount,
      };

      Alert.alert(
        "Success",
        "Purchase details submitted! We will start preparing the paperwork."
      );

      // Animate out before calling onConfirm
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          onConfirm(purchaseDetails);
        }, 50);
      });
    } catch (error) {
      console.error("Failed to request paperwork:", error);
      Alert.alert(
        "Error",
        "Could not submit purchase details. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardContainer}
      keyboardVerticalOffset={Platform.OS === "ios" ? -48 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
            <Circle cx="18.5" cy="18.5" r="18.5" fill="#ffffff" />
            <Path
              d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
              fill="#A9A9A9"
            />
          </Svg>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Container */}
          <View style={styles.headerContainer}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>
                {getInitials(client?.referenceName)}
              </Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.clientName}>{client?.referenceName}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Details about the purchase</Text>
          </View>

          {/* Input Fields */}
          <TextInput
            style={styles.inputField}
            placeholder="Address"
            placeholderTextColor="#4D4D4D"
            value={address}
            onChangeText={setAddress}
          />

          <TextInput
            style={styles.inputField}
            placeholder="City"
            placeholderTextColor="#4D4D4D"
            value={city}
            onChangeText={setCity}
          />

          <TextInput
            style={styles.inputField}
            placeholder="Postal code"
            placeholderTextColor="#4D4D4D"
            value={postalCode}
            onChangeText={setPostalCode}
          />

          <TextInput
            style={styles.inputField}
            placeholder="Amount"
            placeholderTextColor="#4D4D4D"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            <Text style={styles.confirmButtonText}>
              {submitting ? "Submitting..." : "Confirm & continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  modalContainer: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    width: 370,
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    position: "relative",
    marginBottom: 48,
    alignSelf: "center",
    maxHeight: "90%",
    zIndex: 2,
  },
  scrollContent: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    paddingBottom: 16,
  },
  closeButton: {
    position: "absolute",
    width: 42,
    height: 42,
    right: 10,
    top: 10,
    zIndex: 7,
  },
  closeButtonCircle: {
    width: 42,
    height: 42,
    backgroundColor: "#F4F4F4",
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    gap: 16,
    width: 338,
    height: 49,
    alignSelf: "stretch",
    zIndex: 0,
  },
  initialsCircle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: 49,
    height: 49,
    backgroundColor: "#4D4D4D",
    borderRadius: 45,
  },
  initialsText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 27,
    textAlign: "center",
    color: "#FDFDFD",
  },
  nameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 0,
    gap: 8,
    flex: 1,
    height: 21,
  },
  clientName: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 21,
    color: "#1D2327",
    alignSelf: "stretch",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    gap: 16,
    width: 338,
    height: 49,
    alignSelf: "stretch",
    zIndex: 1,
  },
  title: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    color: "#1D2327",
    alignSelf: "stretch",
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 16,
    width: 338,
    height: 42,
    backgroundColor: "#FDFDFD",
    borderWidth: 1,
    borderColor: "#707070",
    borderRadius: 8,
    alignSelf: "stretch",
    fontFamily: "Futura",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 19,
    color: "#4D4D4D",
  },
  confirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 24,
    width: 338,
    height: 43,
    backgroundColor: "#F0913A",
    borderRadius: 999,
    alignSelf: "stretch",
  },
  confirmButtonText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    color: "#FDFDFD",
  },
});

export default PurchaseDetailsModal;
