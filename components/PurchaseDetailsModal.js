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

const PurchaseDetailsModal = ({ client, onClose, onConfirm }) => {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, []);

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

      // Call the onConfirm callback with purchase details
      onConfirm(purchaseDetails);
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
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonCircle}>
            <Ionicons name="close" size={24} color="#797979" />
          </View>
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
