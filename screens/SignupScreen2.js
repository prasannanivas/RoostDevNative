import React, { useState, useRef } from "react";
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
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInputMask } from "react-native-masked-text";

export default function SignUpDetailsScreen({ navigation, route }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitedBy, setInvitedBy] = useState(null);

  const validateEmail = (email) => {
    if (email === "contact@davidwrobel.com") return true; // Allow test email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return phone.replace(/\D/g, "").length === 10;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const checkEmailOrPhoneExists = async () => {
    // Bypass check for test email
    if (
      email === "contact@davidwrobel.com" ||
      email === "d.prasannanivas@gmail.com"
    ) {
      return { existingAccount: false, inviteInfo: null };
    }

    try {
      let existingAccount = false;
      let inviteInfo = null;

      // If email is provided, check if it exists
      if (email) {
        try {
          const response = await axios.post(
            "http://44.202.249.124:5000/presignup/email",
            {
              email: email,
            }
          );

          console.log("Email check response:", response.data);

          // Check if response contains invitedBy information
          if (response.data && response.data.invitedBy) {
            inviteInfo = response.data.invitedBy;
            console.log("Found invite info via email:", inviteInfo);
          }
          // If we reach here, email doesn't exist
        } catch (error) {
          // If we get an error response, the email already exists
          if (error.response?.data?.error) {
            setEmailError(
              error.response.data.error ||
                "This email is already registered. Please use a different email."
            );
            existingAccount = true;
          }
        }
      }

      // If phone is provided, check if it exists
      if (phone) {
        try {
          const response = await axios.post(
            "http://44.202.249.124:5000/presignup/phone",
            {
              phone: formattedPhone,
            }
          );

          console.log("Phone check response:", response.data);

          // Check if response contains invitedBy information
          if (response.data && response.data.invitedBy && !inviteInfo) {
            inviteInfo = response.data.invitedBy;
            console.log("Found invite info via phone:", inviteInfo);
          }
          // If we reach here, phone doesn't exist
        } catch (error) {
          // If we get an error response, the phone already exists
          if (error.response?.data?.error) {
            setPhoneError(
              error.response.data.error ||
                "This phone number is already registered. Please use a different number."
            );
            existingAccount = true;
          }
        }
      }

      // Save invitedBy information if available
      if (inviteInfo) {
        setInvitedBy(inviteInfo);
      }

      return { existingAccount, inviteInfo }; // Return both values
    } catch (error) {
      console.error("Error checking email/phone:", error);
      Alert.alert(
        "Error",
        "Could not verify account information. Please try again."
      );
      return { existingAccount: true, inviteInfo: null }; // Return error state
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setPhoneError("");
      setEmailError("");
      setFirstNameError("");
      setLastNameError("");

      if (!firstName.trim()) {
        setFirstNameError("First name is required");
        setIsLoading(false);
        return;
      }

      if (!lastName.trim()) {
        setLastNameError("Last name is required");
        setIsLoading(false);
        return;
      }

      // Either phone or email is required, not both
      if (!phone && !email) {
        setEmailError("Either phone number or email is required");
        setPhoneError("Either phone number or email is required");
        setIsLoading(false);
        return;
      }

      // Validate phone if provided
      if (phone && !validatePhone(phone)) {
        setPhoneError("Please enter a valid 10-digit phone number");
        setIsLoading(false);
        return;
      }

      // Validate email if provided
      if (email && !validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Check if email or phone already exists
      const { existingAccount, inviteInfo } = await checkEmailOrPhoneExists();
      if (existingAccount) {
        setIsLoading(false);
        return;
      }

      console.log(
        "Navigating to password screen with invite info:",
        inviteInfo || invitedBy
      );

      // If no errors, proceed to next screen
      // Use the directly returned inviteInfo instead of relying on the state update
      navigation.navigate("Password", {
        firstName,
        lastName,
        phone: phone ? formattedPhone : null,
        email: email || null,
        isRealtor: route.params?.accountType === "realtor",
        recoId: route.params?.recoId,
        invitedBy: inviteInfo || invitedBy, // Use the one we just received or fall back to state
      });
    } catch (error) {
      console.error("Error in signup process:", error);
      Alert.alert(
        "Error",
        "An error occurred during signup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Create refs for form inputs to enable focus management
  const lastNameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  // Handle input submission and focus next field
  const focusNextInput = (nextInput) => {
    // Safe focus method that handles TextInputMask and normal TextInput
    if (nextInput && nextInput.current) {
      try {
        // For TextInput components
        if (typeof nextInput.current.focus === "function") {
          nextInput.current.focus();
        }
        // For TextInputMask components which might have a different structure
        else if (
          nextInput.current.getElement &&
          typeof nextInput.current.getElement === "function"
        ) {
          const element = nextInput.current.getElement();
          if (element && typeof element.focus === "function") {
            element.focus();
          }
        }
      } catch (error) {
        console.log("Error focusing input:", error);
      }
    }
  };

  // Dismiss keyboard when submission is complete
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
          <Text style={styles.brandTitle}>Roost</Text>
          <Text style={styles.heading}>Let's get started!</Text>
          <Text style={styles.noteText}>
            Only one contact method is required (phone or email)
          </Text>
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
            accessible={true}
            accessibilityLabel="First Name input"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(lastNameInputRef)}
            blurOnSubmit={false}
          />
          {firstNameError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="First name error"
            >
              <Text style={styles.errorText}>{firstNameError}</Text>
            </View>
          ) : null}
          <TextInput
            ref={lastNameInputRef}
            style={[styles.input, isLoading && styles.inputDisabled]}
            placeholder="Last Name"
            placeholderTextColor="#999999"
            value={lastName}
            onChangeText={setLastName}
            accessible={true}
            accessibilityLabel="Last Name input"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(phoneInputRef)}
            blurOnSubmit={false}
          />
          {lastNameError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Last name error"
            >
              <Text style={styles.errorText}>{lastNameError}</Text>
            </View>
          ) : null}
          <View style={styles.phoneContainer}>
            <Text style={styles.phonePrefix}>+1</Text>
            <TextInputMask
              ref={phoneInputRef}
              type={"custom"}
              options={{
                mask: "(999) 999-9999",
              }}
              style={[styles.phoneInput, isLoading && styles.inputDisabled]}
              placeholder="Phone Number (Optional if email provided)"
              placeholderTextColor="#999999"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setFormattedPhone("+1" + text.replace(/\D/g, ""));
                if (text) setEmailError("");
              }}
              keyboardType="phone-pad"
              accessible={true}
              accessibilityLabel="Phone Number input"
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => dismissKeyboard()}
              blurOnSubmit={true}
            />
          </View>
          <TextInput
            ref={emailInputRef}
            style={[styles.input, isLoading && styles.inputDisabled]}
            placeholder="Email (Optional if phone provided)"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (text) setPhoneError("");
            }}
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email input"
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={dismissKeyboard}
          />
          {emailError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Email error"
            >
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
          {phoneError ? (
            <View
              style={styles.errorBox}
              accessible={true}
              accessibilityLabel="Phone error"
            >
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel="Next step"
          accessibilityRole="button"
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
    marginBottom: 10,
  },
  noteText: {
    fontSize: 14,
    color: "#019B8E",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
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
