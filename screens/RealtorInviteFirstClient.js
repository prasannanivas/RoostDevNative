import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../components/Logo";
import { COLORS } from "../styles";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useRealtor } from "../context/RealtorContext";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function RealtorInviteFirstClient() {
  const navigation = useNavigation();
  const { auth } = useAuth();
  const { realtorInfo, fetchLatestRealtor } = useRealtor();

  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleInputChange = (field, value) => {
    setClientData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleInviteClient = async () => {
    // Validate client data
    if (!clientData.firstName || !clientData.lastName) {
      Alert.alert(
        "Missing Information",
        "Please enter client's first and last name."
      );
      return;
    }

    if (!clientData.email && !clientData.phone) {
      Alert.alert(
        "Missing Contact Information",
        "Please provide either an email or phone number."
      );
      return;
    }

    setLoading(true);
    try {
      // Construct the API payload
      const payload = {
        referenceName: `${clientData.firstName} ${clientData.lastName}`.trim(),
        email: clientData.email,
        phone: clientData.phone,
        type: "Client",
      }; // Use the realtor ID from the context
      const realtorId = realtorInfo?.id || auth?.realtor?.id;
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtorId}/invite-client`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Refresh realtor data to include the newly invited client
        await fetchLatestRealtor();
        Alert.alert("Success", "Your client has been invited successfully!", [
          { text: "OK", onPress: () => handleNext() },
        ]);
      } else {
        throw new Error("Failed to invite client");
      }
    } catch (error) {
      console.error("Error inviting client:", error);
      Alert.alert(
        "Error",
        "There was a problem inviting your client. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleNext = () => {
    // Navigate to the main realtor home screen
    navigation.navigate("Home");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Logo */}
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />

        {/* Heading */}
        <Text style={styles.heading}>Invite your first client!</Text>

        {/* Subheading */}
        <Text style={styles.subheading}>
          This will invite your client to join the app, so you can start helping
          them find their perfect home.
        </Text>

        {/* Client Form */}
        <TextInput
          style={styles.input}
          placeholder="Client's First Name"
          value={clientData.firstName}
          onChangeText={(value) => handleInputChange("firstName", value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Client's Last Name"
          value={clientData.lastName}
          onChangeText={(value) => handleInputChange("lastName", value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Client's Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={clientData.email}
          onChangeText={(value) => handleInputChange("email", value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Client's Phone"
          keyboardType="phone-pad"
          value={clientData.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
        />

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            You can invite more later in the client tab, just click "add client"
            button.
          </Text>
          <View style={styles.iconContainer}>
            <Svg width="57" height="56" viewBox="0 0 57 56" fill="none">
              <Rect
                x="1.5"
                y="1"
                width="54"
                height="54"
                rx="27"
                fill="#F0913A"
              />
              <Path
                d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                stroke="#FDFDFD"
                strokeWidth="2"
              />
            </Svg>
          </View>
        </View>

        {/* Add Client Button */}
        <TouchableOpacity
          style={styles.addClientButton}
          onPress={handleInviteClient}
          disabled={loading}
        >
          <Text style={styles.addClientButtonText}>
            {loading ? "Adding..." : "Add client"}
          </Text>
        </TouchableOpacity>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Sending invitation...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
    alignItems: "center",
  },
  brandLogo: {
    marginBottom: 50,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: "center",
    color: "#1D2327",
  },
  subheading: {
    fontSize: 14,
    color: "#707070",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  input: {
    width: "100%",
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#707070",
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  disclaimerContainer: {
    backgroundColor: "#F0913A80",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    width: "100%",
  },
  iconContainer: {
    marginRight: 10,
    borderColor: COLORS.white,
    borderWidth: 2,
    borderRadius: 30,
    padding: 0,
  },
  disclaimerText: {
    color: "#707070",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    flex: 1,
  },
  addClientButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 334,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  addClientButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.green,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1D2327",
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 36,
    height: "15%",
  },
  backButton: {
    padding: 3,
    borderWidth: 2,
    borderRadius: 33,
    borderColor: COLORS.white,
    opacity: 0,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
