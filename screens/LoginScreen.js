import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Linking,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "../components/Logo";
import { StatusBar } from "expo-status-bar";
import {
  isBiometricAvailable,
  getStoredAccounts,
  authenticateBiometric,
  getCredential,
  saveCredential,
} from "../utils/biometricUtils";
import QuickBiometricLoginModal from "../components/QuickBiometricLoginModal";
import { Ionicons } from "@expo/vector-icons";

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

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState([]); // [{identifier, role}]
  const [bioChecking, setBioChecking] = useState(true);
  const [bioError, setBioError] = useState(null);
  const [showQuickLoginModal, setShowQuickLoginModal] = useState(false);
  const [supportedBioTypes, setSupportedBioTypes] = useState([]); // numeric codes from expo-local-authentication

  // Create refs for form inputs
  const passwordInputRef = useRef(null);
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // REFACTORED: handleLogin now accepts options object to avoid relying on async state when using biometrics
  const handleLogin = async (opts = {}) => {
    // Backward compatibility if boolean passed (old signature skipBiometricPrompt)
    if (typeof opts === "boolean") {
      opts = { skipPrompt: opts };
    }
    const {
      identifier = email,
      secret = password,
      skipPrompt = false,
      roleHint, // optional 'client' | 'realtor'
    } = opts;

    if (!identifier || !secret) {
      setError("Email and password required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decide order based on role hint to reduce one failing request
      const order =
        roleHint === "realtor" ? ["realtor", "client"] : ["client", "realtor"];
      let data = null;
      let role = null;

      for (const kind of order) {
        try {
          const endpoint = kind === "client" ? "client/login" : "realtor/login";
          const resp = await fetch(`https://signup.roostapp.io/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password: secret }),
          });
          const json = await resp.json();
          if (
            (kind === "client" && json.client) ||
            (kind === "realtor" && json.realtor)
          ) {
            data = json;
            role = kind;
            break;
          }
        } catch (inner) {
          console.warn("Auth attempt failed for", kind, inner);
        }
      }

      if (data) {
        console.log("Login successful (role=" + role + ")");
        console.log("AccessToken:", data.accessToken);
        console.log("RefreshToken:", data.refreshToken);
        // Persist tokens for later use (unlimited expiry as requested)
        try {
          if (data.accessToken) {
            await AsyncStorage.setItem("accessToken", data.accessToken);
          }
          if (data.refreshToken) {
            await AsyncStorage.setItem("refreshToken", data.refreshToken);
          }
        } catch (e) {
          console.warn("Failed to persist tokens", e);
        }

        await login(data);
        navigation.navigate("Home");
        // Only prompt to save when this was a manual credential login AND biometrics supported AND not already saved
        const alreadyStored = storedAccounts.some(
          (a) => a.identifier === identifier.toLowerCase()
        );
        if (
          bioSupported &&
          !skipPrompt &&
          identifier === email &&
          !alreadyStored
        ) {
          Alert.alert(
            "Enable Quick Login",
            "Would you like to use Face ID / Fingerprint for future logins?",
            [
              { text: "Not Now", style: "cancel" },
              {
                text: "Enable",
                onPress: async () => {
                  // Attempt to derive a friendly display name from returned login data
                  // 'data' may contain client or realtor object based on role
                  let displayName = undefined;
                  const id =
                    role === "client" ? data.client?.id : data.realtor?.id;
                  try {
                    if (role === "client" && data?.client) {
                      displayName =
                        data.client.name ||
                        data.client.fullName ||
                        data.client.firstName;
                    } else if (role === "realtor" && data?.realtor) {
                      displayName =
                        data.realtor.name ||
                        data.realtor.fullName ||
                        data.realtor.firstName;
                    }
                  } catch (_) {}
                  // Fallbacks
                  if (!displayName) {
                    displayName =
                      role === "realtor"
                        ? "Realtor Account"
                        : role === "client"
                        ? "Client Account"
                        : "Account";
                  }
                  const ok = await saveCredential({
                    id,
                    identifier,
                    password: secret,
                    role,
                    displayName,
                    biometricType: undefined, // will be set on first biometric usage if desired
                  });
                  if (ok) {
                    const accounts = await getStoredAccounts();
                    setStoredAccounts(accounts);
                  }
                },
              },
            ]
          );
        }
      } else {
        setError("Check the account information you entered and try again.");
      }
    } catch (e) {
      console.error("Login error", e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("SignupStack");
  };

  const handleResetPassword = () => {
    // Navigate to the password reset screen
    navigation.navigate("PasswordReset");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const avail = await isBiometricAvailable();
      if (!mounted) return;
      if (avail.available) {
        setBioSupported(true);
        if (Array.isArray(avail.types)) setSupportedBioTypes(avail.types);
        const accounts = await getStoredAccounts();
        if (mounted) setStoredAccounts(accounts);
        // don't open modal here; wait for accounts to be applied in state
      } else {
        setBioError(avail.reason || "Biometric unavailable");
      }
      setBioChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Open quick-login modal only after storedAccounts is populated and biometrics supported.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!bioSupported) return;
      // wait for storedAccounts to settle (small tick)
      await new Promise((r) => setTimeout(r, 80));
      if (!active) return;
      if (storedAccounts && storedAccounts.length > 0) {
        // Ensure any open keyboard (e.g., password field) is dismissed before opening modal
        Keyboard.dismiss();
        setShowQuickLoginModal(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [bioSupported, storedAccounts]);

  const openQuickModalIfNeeded = (accounts) => {
    if (bioSupported && accounts.length > 0) {
      setShowQuickLoginModal(true);
    }
  };

  const handleBiometricAuthenticated = async (cred) => {
    await handleLogin({
      identifier: cred.identifier,
      secret: cred.password,
      skipPrompt: true,
      roleHint: cred.role,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 0.8 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 4 : undefined}
      >
        {/* Brand Logo */}
        <Logo
          width={120}
          height={42}
          variant="black"
          style={styles.brandLogo}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          style={styles.scrollView}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
        >
          {/* Error Message */}
          {error && (
            <Text
              style={styles.errorText}
              accessible={true}
              accessibilityLabel={`Error: ${error}`}
            >
              {error}
            </Text>
          )}
          {/* Email Input */}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email input"
            returnKeyType="next"
            onSubmitEditing={() => focusNextInput(passwordInputRef)}
            blurOnSubmit={false}
          />
          {/* Password Input */}
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            autoComplete="password"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Password input"
            returnKeyType="done"
            onSubmitEditing={() => dismissKeyboard()}
          />
          {/* Reset Password */}
          <TouchableOpacity
            onPress={handleResetPassword}
            accessible={true}
            accessibilityLabel="Reset password"
            accessibilityRole="button"
            style={styles.resetPasswordButton}
          >
            <Text style={styles.resetPasswordText}>RESET PASSWORD</Text>
          </TouchableOpacity>
          {/* Log In Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={() => handleLogin({ skipPrompt: false })}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Log in"
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
          {/* Biometric quick-login trigger (shows Face / Finger / Lock based on supported types) */}
          {bioSupported && storedAccounts.length > 0 && (
            <TouchableOpacity
              style={styles.fingerprintButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowQuickLoginModal(true);
              }}
              accessibilityLabel="Open biometric quick login"
              accessibilityRole="button"
            >
              <Ionicons
                name={
                  Array.isArray(supportedBioTypes) &&
                  supportedBioTypes.includes(2)
                    ? "person-circle-outline"
                    : Array.isArray(supportedBioTypes) &&
                      supportedBioTypes.includes(1)
                    ? "finger-print"
                    : "lock-closed"
                }
                size={28}
                color={COLORS.green}
                style={{ opacity: loading ? 0.6 : 1 }}
              />
              <Text style={styles.fingerprintLabel}>Quick Login</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Sign Up Section moved to bottom above footer */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpPrompt}>
          Don't have An Account? Sign Up for Free
        </Text>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          accessible={true}
          accessibilityLabel="Sign up for a new account"
          accessibilityRole="button"
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Footer (dark background) */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          By logging in, you agree to Roost's{" "}
          <Text
            style={styles.linkText}
            onPress={() => {
              Linking.openURL("https://roostapp.io/terms-of-service");
            }}
            accessibilityRole="link"
          >
            Terms of Use
          </Text>{" "}
          and{" "}
          <Text
            style={styles.linkText}
            onPress={() => {
              Linking.openURL("https://roostapp.io/privacy");
            }}
            accessibilityRole="link"
          >
            Privacy&nbsp;Policy
          </Text>
          .
        </Text>
        <Text style={styles.footerText}>
          By providing your email & phone number, you consent to receive
          communications from Roost. You can opt-out anytime.
        </Text>
      </View>

      <QuickBiometricLoginModal
        visible={
          showQuickLoginModal && bioSupported && storedAccounts.length > 0
        }
        accounts={storedAccounts}
        onClose={() => setShowQuickLoginModal(false)}
        onAuthenticated={handleBiometricAuthenticated}
        prefillEmail={setEmail}
        supportedTypes={supportedBioTypes}
        onUsePassword={() => {
          // ensure modal closed state already triggered; focus password after small delay
          if (passwordInputRef.current) {
            try {
              passwordInputRef.current.focus();
            } catch (e) {}
          }
        }}
        onForgotPassword={handleResetPassword}
        onRegister={handleSignUp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    height: "85%",
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  brandLogo: {
    marginBottom: 32,
    alignSelf: "center",
    marginTop: 64,
    backgroundColor: COLORS.background, // Ensure logo has a background color
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
    fontWeight: "500", // Changed to 500 for regular placeholder text
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },

  resetPasswordButton: {
    alignSelf: "flex-end",
  },
  resetPasswordText: {
    alignSelf: "flex-end",
    color: COLORS.slate,
    marginBottom: 24,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  loginButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.green,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: 700, // H3 weight (medium)
    fontFamily: "Futura",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  fingerprintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  fingerprintLabel: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  errorText: {
    color: COLORS.red,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  signUpContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    alignItems: "center",
  },
  signUpPrompt: {
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    color: COLORS.slate,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  signUpButton: {
    borderColor: COLORS.green,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: 334,
    borderWidth: 2,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  signUpButtonText: {
    color: COLORS.green,
    fontSize: 12, // H3 size
    fontWeight: 700, // H3 weight
    fontFamily: "Futura",
  },
  realtorButton: {
    width: "100%",
    height: 48,
    backgroundColor: COLORS.red,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  realtorButtonText: {
    color: COLORS.white,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  footerContainer: {
    height: 120,
    position: "absolute",
    alignItems: "center",
    width: "100%",
    bottom: 0,
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12, // Sub-p size
    fontWeight: 500, // Sub-p weight
    color: COLORS.gray,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 15,
    fontFamily: "Futura",
  },
  linkText: {
    color: COLORS.gray,
    textDecorationLine: "underline",
  },
});
