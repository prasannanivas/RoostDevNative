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
          This will contact your client to join the app, so that you can get
          started finding them their perfect place
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
          <View style={styles.iconContainer}>
            <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.disclaimerText}>
            You can invite more later in the client tab, just click "add client"
            button
          </Text>
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
          <Ionicons name="arrow-back-circle" size={36} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1D2327",
  },
  subheading: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  disclaimerContainer: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  iconContainer: {
    marginRight: 10,
  },
  disclaimerText: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },
  addClientButton: {
    backgroundColor: COLORS.green,
    borderRadius: 100,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  addClientButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  },
  backButton: {
    padding: 4,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
