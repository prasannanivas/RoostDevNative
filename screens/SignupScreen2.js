import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Logo from "../components/Logo";
import AnimatedDropdown from "../components/common/AnimatedDropdown";

/**
 * Color palette from UX team design system
 */
const COLORS = {
  // Core colors
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070", // dark gray
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",

  // Opacity variations
  noticeContainerBg: "#37747340", // Green with 25% opacity
  coloredBgFill: "#3774731A", // Green with 10% opacity
};

const SignUpDetailsScreen = React.forwardRef(
  ({ navigation, route, setBottomBarLoading }, ref) => {
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

    // Update the loading state of the bottom bar when local loading state changes
    useEffect(() => {
      if (setBottomBarLoading) {
        setBottomBarLoading(isLoading);
      }
    }, [isLoading, setBottomBarLoading]);

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
              "https://signup.roostapp.io/presignup/email",
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
                error.response.data.error &&
                  error.response.data.error?.startsWith(
                    "Email already registered"
                  )
                  ? "This email address is already registered, please try and login. If you forgot your password click RESET PASSWORD or use a different email"
                  : error.response.data.error ||
                      "This email address is already registered, please try and login. If you forgot your password click RESET PASSWORD or use a different email."
              );
              existingAccount = true;
            }
          }
        }

        // If phone is provided, check if it exists
        if (phone) {
          try {
            const response = await axios.post(
              "https://signup.roostapp.io/presignup/phone",
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
    React.useImperativeHandle(ref, () => ({
      validate: async () => {
        try {
          // Call handleLogin directly for validation, capturing its return value
          const validationResult = await handleLogin();

          // Explicitly log the validation result to help with debugging
          console.log("SignupScreen2 validation result:", validationResult);

          // Return the explicit boolean result from handleLogin
          return validationResult === true;
        } catch (error) {
          console.error("Validation error in SignupScreen2:", error);
          return false;
        }
      },
    }));

    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };
    const handleLogin = async () => {
      try {
        setIsLoading(true);
        if (setBottomBarLoading) setBottomBarLoading(true);

        setPhoneError("");
        setEmailError("");
        setFirstNameError("");
        setLastNameError("");
        if (!firstName.trim()) {
          setFirstNameError("First name is required");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        if (!lastName.trim()) {
          setLastNameError("Last name is required");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        // Email is now required
        if (!email) {
          setEmailError("Email address is required for verification");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        // Validate email (required)
        if (!validateEmail(email)) {
          setEmailError("Please enter a valid email address");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        // Validate phone only if it's provided
        if (phone && !validatePhone(phone)) {
          setPhoneError("Please enter a valid 10-digit phone number");
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false;
        }

        // Check if email or phone already exists
        const { existingAccount, inviteInfo } = await checkEmailOrPhoneExists();

        if (existingAccount) {
          setIsLoading(false);
          if (setBottomBarLoading) setBottomBarLoading(false);
          return false; // Error messages are set in checkEmailOrPhoneExists
        }

        // If we got here, validation passed - prepare the data for next screen
        const userData = {
          ...route.params,
          firstName,
          lastName,
          phone: phone ? phone.replace(/\D/g, "") : "",
          email,
          isRealtor: route.params?.accountType === "realtor",
          recoId: route.params?.recoId,
          invitedBy: inviteInfo || invitedBy, // Remove non-digits
        };

        if (inviteInfo) {
          userData.invitedBy = inviteInfo;
          setInvitedBy(inviteInfo);
        }

        console.log("User data prepared for next screen:", userData);

        // Update route params for the next screen
        navigation.setParams(userData);

        // Only navigate if not called from validate method
        if (navigation && navigation.navigate) {
          navigation.navigate("EmailVerification", userData);
        }

        setIsLoading(false);
        if (setBottomBarLoading) setBottomBarLoading(false);

        return true;
      } catch (error) {
        console.error("Signup error:", error);
        Alert.alert("Error", "Something went wrong. Please try again later.");
        setIsLoading(false);
        if (setBottomBarLoading) setBottomBarLoading(false);
        return false;
      }
    };

    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <Logo
            width={120}
            height={42}
            variant="black"
            style={styles.brandLogo}
          />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            accessible={true}
          >
            <Text style={styles.heading}>Let's get started!</Text>
            {/* Update the note text to indicate email is required */}
            <Text style={styles.noteText}>
              Email is required for verification. Phone number is optional.
            </Text>
            {isLoading && (
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color={COLORS.green} />
              </View>
            )}

            {/* First Name Input */}
            <TextInput
              style={[styles.input, isLoading ? styles.inputDisabled : null]}
              placeholder="First Name"
              placeholderTextColor={COLORS.gray}
              value={firstName}
              onChangeText={setFirstName}
              accessible={true}
              accessibilityLabel="First name input (required)"
              editable={!isLoading}
              returnKeyType="next"
            />
            <AnimatedDropdown
              visible={!!firstNameError}
              style={!!firstNameError ? styles.errorBox : {}}
              maxHeight={100}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="First name error"
              >
                {firstNameError}
              </Text>
            </AnimatedDropdown>

            {/* Last Name Input */}
            <TextInput
              style={[styles.input, isLoading ? styles.inputDisabled : null]}
              placeholder="Last Name"
              placeholderTextColor={COLORS.gray}
              value={lastName}
              onChangeText={setLastName}
              accessible={true}
              accessibilityLabel="Last name input (required)"
              editable={!isLoading}
              returnKeyType="next"
            />
            <AnimatedDropdown
              visible={!!lastNameError}
              style={!!lastNameError ? styles.errorBox : {}}
              maxHeight={100}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="Last name error"
              >
                {lastNameError}
              </Text>
            </AnimatedDropdown>

            {/* Phone Number Input with formatting */}
            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>+1</Text>
              <TextInput
                style={[
                  styles.phoneInput,
                  isLoading ? styles.inputDisabled : null,
                ]}
                placeholder="(555) 555-5555"
                placeholderTextColor={COLORS.gray}
                value={phone}
                onChangeText={(text) => {
                  // Remove non-digit characters
                  const digits = text.replace(/\D/g, "");

                  // Limit to 10 digits
                  const limitedDigits = digits.slice(0, 10);

                  // Format as the user types: XXX-XXX-XXXX
                  let formattedText = limitedDigits;
                  if (limitedDigits.length > 3 && limitedDigits.length <= 6) {
                    formattedText = `${limitedDigits.slice(
                      0,
                      3
                    )}-${limitedDigits.slice(3)}`;
                  } else if (limitedDigits.length > 6) {
                    formattedText = `${limitedDigits.slice(
                      0,
                      3
                    )}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
                  }

                  setPhone(formattedText);

                  // Format for display using the (XXX) XXX-XXXX format
                  const formatted =
                    limitedDigits.length === 10
                      ? limitedDigits.replace(
                          /(\d{3})(\d{3})(\d{4})/,
                          "($1) $2-$3"
                        )
                      : "";
                  setFormattedPhone(formatted);
                }}
                keyboardType="phone-pad"
                accessible={true}
                accessibilityLabel="Phone number input (optional)"
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            {/* Email Input */}
            <TextInput
              style={[styles.input, isLoading ? styles.inputDisabled : null]}
              placeholder="Email"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessible={true}
              accessibilityLabel="Email input (required)" // Updated accessibility
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
            <AnimatedDropdown
              visible={!!emailError}
              style={!!emailError ? styles.errorBox : {}}
              maxHeight={100}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="Email error"
              >
                {emailError}
              </Text>
            </AnimatedDropdown>
            <AnimatedDropdown
              visible={!!phoneError}
              style={!!phoneError ? styles.errorBox : {}}
              maxHeight={100}
            >
              <Text
                style={styles.errorText}
                accessible={true}
                accessibilityLabel="Phone error"
              >
                {phoneError}
              </Text>
            </AnimatedDropdown>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogo: {
    marginBottom: 32,
    alignSelf: "center",
    marginTop: 64,
  },
  heading: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  noteText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.green,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Futura",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#F0DE3A40", // Using notice container background with 25% opacity
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: "#707070",
    lineHeight: 20,
    fontFamily: "Futura",
  },
  boldText: {
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    marginVertical: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: COLORS.silver,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  countryCode: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  phoneInput: {
    flex: 1,
    height: 48,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
});

// Export the wrapped component with forwardRef
export default SignUpDetailsScreen;
