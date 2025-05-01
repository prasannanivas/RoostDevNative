import React, { useState } from "react";
import axios from "axios";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInputMask } from "react-native-masked-text";

export default function SignUpDetailsScreen({ navigation, route }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [emailAlreadyExists] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return phone.replace(/\D/g, "").length === 10;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setPhoneError("");
      setEmailError("");

      if (!validatePhone(phone)) {
        setPhoneError("Please enter a valid 10-digit phone number");
        return;
      }

      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }

      navigation.navigate("Password", {
        firstName,
        lastName,
        phone: formattedPhone,
        email,
        isRealtor: route.params?.isRealtor,
      });
    } catch (error) {
      if (error.response?.data?.error?.includes("email_1 dup key")) {
        setEmailError("Email already exists");
      } else if (error.response?.data?.error?.includes("phone_1 dup key")) {
        setPhoneError("The phone number already exists please login.");
      } else {
        setPhoneError("An error occurred during signup.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <Text style={styles.brandTitle}>Roost</Text>
        <Text style={styles.heading}>Let’s get started!</Text>

        {isLoading && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#019B8E" />
          </View>
        )}

        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          placeholder="First Name"
          placeholderTextColor="#999999"
          value={firstName}
          onChangeText={setFirstName}
          editable={!isLoading}
        />
        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          placeholder="Last Name"
          placeholderTextColor="#999999"
          value={lastName}
          onChangeText={setLastName}
          editable={!isLoading}
        />

        <View style={styles.phoneContainer}>
          <Text style={styles.phonePrefix}>+1</Text>
          <TextInputMask
            type={"custom"}
            options={{
              mask: "(999) 999-9999",
            }}
            style={[styles.phoneInput, isLoading && styles.inputDisabled]}
            placeholder="Phone Number"
            placeholderTextColor="#999999"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setFormattedPhone("+1" + text.replace(/\D/g, ""));
            }}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          placeholder="Email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />

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
        {emailError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{emailError}</Text>
          </View>
        ) : null}
        {phoneError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{phoneError}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loginButtonText}> Loading...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Next</Text>
          )}
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
  },
  heading: {
    fontSize: 18,
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
  errorBox: {
    width: "100%",
    backgroundColor: "#FCEED2",
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
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#23231A",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {},
  loginButton: {
    backgroundColor: "#019B8E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    marginVertical: 20,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: "#f5f5f5",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 8,
    backgroundColor: "white",
  },
  phonePrefix: {
    paddingLeft: 15,
    paddingRight: 5,
    fontSize: 16,
    color: "#23231A",
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#23231A",
  },
});
