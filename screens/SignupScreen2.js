import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpDetailsScreen({ navigation }) {
  // Example local state for the input fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // For demonstration, show this error box if an email is already registered
  // In a real app, you’d conditionally show this after checking with your backend
  const [emailAlreadyExists] = useState(false);

  const handleBack = () => {
    // Go back or close
    console.log("Back arrow pressed");
    // e.g., navigation.goBack();
  };

  const handleLogin = () => {
    // Navigate to login screen
    console.log("Back to login pressed");
    // e.g., navigation.navigate("LoginScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Title */}
        <Text style={styles.brandTitle}>Roost</Text>

        {/* Heading */}
        <Text style={styles.heading}>Let’s get started!</Text>

        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#999999"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#999999"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          placeholderTextColor="#999999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Warning Box (Shown if email is already registered) */}
        {emailAlreadyExists && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              This email address is already registered, please try and login. If
              you forgot your password click{" "}
              <Text style={styles.boldText}>REST PASSWORD</Text> or use a
              different email
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Back to login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Next</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    color: "#23231A",
    // If Figma uses a custom font or styling, load it via Expo's Font API
  },
  heading: {
    fontSize: 18, // Adjust to match Figma (some designs might use 20 or 22)
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#23231A",
  },

  // Warning box styling
  errorBox: {
    width: "100%",
    backgroundColor: "#FCEED2", // Light orange background
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#23231A",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#23231A", // Dark bar at the bottom
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    // No extra styling to keep the icon flush against the bar
  },
  loginButton: {
    backgroundColor: "#019B8E", // Teal brand color
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
