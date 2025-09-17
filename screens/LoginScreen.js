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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "../components/Logo";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { getAccounts, upsertAccount } from "../utils/accountStore";
import { authenticateBiometric, getCredential } from "../utils/biometricUtils";
import Svg, { Defs, Image, Pattern, Rect, Use } from "react-native-svg";

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
  const [accounts, setAccounts] = useState([]); // suggestions: {id, displayName, role, identifiers}
  const [idDropdownOpen, setIdDropdownOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false); // When true: only show saved user + Face ID + different account
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showSavedPassword, setShowSavedPassword] = useState(false); // Reveal password+login in saved-only mode

  // Create refs for form inputs
  const passwordInputRef = useRef(null);
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Choose a preferred identifier to use (email if present, else first)
  const pickPreferredIdentifier = (acc) => {
    const ids = Array.isArray(acc?.identifiers) ? acc.identifiers : [];
    const emailLike = ids.find((s) => typeof s === "string" && s.includes("@"));
    return emailLike || ids[0] || "";
  };

  const attemptFaceIdLogin = async (acc) => {
    try {
      // find a stored credential for any of the identifiers
      const ids = Array.isArray(acc?.identifiers) ? acc.identifiers : [];
      let cred = null;
      for (const idf of ids) {
        const c = await getCredential(idf);
        if (c && c.identifier && c.password) {
          cred = c;
          break;
        }
      }
      if (!cred) {
        Alert.alert(
          "Face ID not set up",
          "No saved biometric credential found for this account. Please use your password to sign in.",
          [
            {
              text: "Use Password",
              onPress: () => {
                const idToUse = pickPreferredIdentifier(acc);
                setEmail(idToUse);
                setIdDropdownOpen(false);
                setShowSavedOnly(true);
                setShowSavedPassword(true);
                setTimeout(() => focusNextInput(passwordInputRef), 50);
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      const prompt = `Sign in as ${acc.displayName || "User"}`;
      const res = await authenticateBiometric(prompt);
      if (res?.success) {
        await handleLogin({
          identifier: cred.identifier,
          secret: cred.password,
          skipPrompt: true,
          roleHint: cred.role,
        });
      } else if (res?.error) {
        Alert.alert("Authentication failed", res.error);
      }
    } catch (e) {
      console.warn("Face ID login error", e);
      Alert.alert("Authentication error", "Please try again.");
    }
  };

  const handleAccountSelection = (acc) => {
    // In saved-only mode, selecting just changes the selected account without prompting
    setIdDropdownOpen(false);
    setSelectedAccount(acc);
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

        // Update local identifier store keyed by backend ID to avoid duplicates
        try {
          const entity = role === "client" ? data.client : data.realtor;
          const id = entity?.id;
          const displayName =
            entity?.name || entity?.fullName || entity?.firstName || undefined;
          await upsertAccount({ id, role, displayName, identifier });
          const list = await getAccounts();
          setAccounts(list);
        } catch (e) {
          console.warn("Failed to update identifier suggestions", e);
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

  // Load saved identifiers for dropdown suggestions
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await getAccounts();
      if (mounted) {
        setAccounts(list);
        if (list && list.length > 0) {
          setSelectedAccount((prev) => prev || list[0]);
          setShowSavedOnly(true);
        } else {
          setSelectedAccount(null);
          setShowSavedOnly(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

          {showSavedOnly ? (
            <>
              {/* Saved Account Selector */}
              {selectedAccount && (
                <View style={styles.savedAccountContainer}>
                  <TouchableOpacity
                    style={styles.savedAccountSelector}
                    onPress={() =>
                      accounts.length > 1 && setIdDropdownOpen((v) => !v)
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Select saved account"
                  >
                    <Text style={styles.savedAccountText}>
                      {selectedAccount.displayName || "Account"}
                    </Text>
                    {accounts.length > 1 && (
                      <Ionicons
                        name={idDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={COLORS.slate}
                      />
                    )}
                  </TouchableOpacity>
                  {idDropdownOpen && accounts.length > 1 && (
                    <View style={styles.dropdownContainer}>
                      {accounts.map((item) => {
                        const roleLabel =
                          item.role === "realtor"
                            ? "Realtor"
                            : item.role === "client"
                            ? "Client"
                            : (item.role || "").toString();
                        const label = `${
                          item.displayName || "Account"
                        } (${roleLabel})`;
                        return (
                          <TouchableOpacity
                            key={String(item.id)}
                            style={styles.dropdownItem}
                            onPress={() => handleAccountSelection(item)}
                          >
                            <Text style={styles.dropdownItemText}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
              {/* Face ID Login Button (hidden when using password mode) */}
              {!showSavedPassword && (
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={() =>
                    selectedAccount && attemptFaceIdLogin(selectedAccount)
                  }
                  disabled={loading || !selectedAccount}
                  accessible={true}
                  accessibilityLabel="Log in with Face ID"
                  accessibilityRole="button"
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Authenticating..." : "Continue with Face ID  "}
                  </Text>
                  <Svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    xlinkHref="http://www.w3.org/1999/xlink"
                  >
                    <Rect
                      width="22"
                      height="22"
                      fill="url(#pattern0_2911_3412)"
                    />
                    <Defs>
                      <Pattern
                        id="pattern0_2911_3412"
                        patternContentUnits="objectBoundingBox"
                        width="1"
                        height="1"
                      >
                        <Use
                          xlinkHref="#image0_2911_3412"
                          transform="scale(0.0166667)"
                        />
                      </Pattern>
                      <Image
                        id="image0_2911_3412"
                        width="60"
                        height="60"
                        preserveAspectRatio="none"
                        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAAsTAAALEwEAmpwYAAACBklEQVR4nO2au04CQRSGp9HGhoJG8SEoraws1EIeQwz0NryDr2GnUV9BJSoUVlZixEvUxgvWn5kwRlgXw8wsy+x6vmQTwg7n/D+7WQ5zjlKCIAhChgFmgTrQBHqMpgOsTSD/uok9Cq3pFKhprb7JFoA249NNzOmPhjuL/C1g3ufKti2STcpw11LDBTDjkqhumegaWJ2A4TUT24Ytl0TNSJADfYurwABKwGFE64lLoI9IkJIKFGAxovXdJcgQKnC89eIbIGXEsC2I4bARw7YwXL9eq8Dx1ku/wumaI/EKKmmyplcIHqACPANPwEZa66YGcD/w0LhLa13wPwskvG5qIIbjEcMZNtwZp9KxMBx2pceYlY6F4XxUToR+qybNvzFMfAfhVeUV4jsIuyqv8LuD8BLiPvckOghv+srm2qyQR4Bl4FY/iYHGX71b06lsmNv9EVhRWYN+23KQG2AbKANz5iib9/S5QS6nIbjis+MAnOFOK229ynfHAVgCHhzM6s8spa1XRVVYB+jHKAA7wOcYRntmbcExl59eEjA8EKsIbAL7wJUx1zOv98y5omeOcAyngRi2BTGcf8Pv/22opRkJchiiaWP2KImxpRp2TGvWMo6qS6JZM7tIhmYtMSXtjGuy+Zg/ASHPWp47D5d+o78tPbsIHMdM54Uwa/lhtFWdr6wgCIKgwuALNFnvqx5lOWAAAAAASUVORK5CYII="
                      />
                    </Defs>
                  </Svg>
                </TouchableOpacity>
              )}
              {showSavedPassword && (
                <>
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
                    onSubmitEditing={() => {
                      const identifier = selectedAccount
                        ? pickPreferredIdentifier(selectedAccount)
                        : email;
                      handleLogin({
                        identifier,
                        secret: password,
                        roleHint: selectedAccount?.role,
                      });
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      loading && styles.loginButtonDisabled,
                    ]}
                    onPress={() => {
                      const identifier = selectedAccount
                        ? pickPreferredIdentifier(selectedAccount)
                        : email;
                      handleLogin({
                        identifier,
                        secret: password,
                        roleHint: selectedAccount?.role,
                      });
                    }}
                    disabled={loading}
                    accessible={true}
                    accessibilityLabel="Log in"
                    accessibilityRole="button"
                  >
                    <Text style={styles.loginButtonText}>
                      {loading ? "Logging in..." : "Log In"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {/* Toggle control: Use Password  <->  Sign in with Face ID (same place) */}
              {(!showSavedPassword && (
                <TouchableOpacity
                  style={styles.usePasswordButton}
                  onPress={() => {
                    const idToUse = selectedAccount
                      ? pickPreferredIdentifier(selectedAccount)
                      : "";
                    if (idToUse) setEmail(idToUse);
                    setShowSavedPassword(true);
                    setTimeout(() => focusNextInput(passwordInputRef), 50);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                >
                  <Text style={styles.usePasswordButtonText}>Use Password</Text>
                </TouchableOpacity>
              )) || (
                <TouchableOpacity
                  style={styles.usePasswordButton}
                  onPress={() =>
                    selectedAccount && attemptFaceIdLogin(selectedAccount)
                  }
                  accessible={true}
                  accessibilityRole="button"
                >
                  {" "}
                  <Text style={styles.usePasswordButtonText}>
                    Sign in with Face ID
                  </Text>
                </TouchableOpacity>
              )}

              {/* Sign in with a different account */}

              <TouchableOpacity
                onPress={() => {
                  setShowSavedOnly(false);
                  setIdDropdownOpen(false);
                  setEmail("");
                  setPassword("");
                  setShowSavedPassword(false);
                }}
                accessible={true}
                accessibilityRole="button"
                style={styles.differentAccountButton}
              >
                <Text style={styles.differentAccountText}>
                  Log in with a different account
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Identifier Input with dropdown (full mode) */}
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="Email or Phone"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (!idDropdownOpen) setIdDropdownOpen(true);
                  }}
                  textContentType="username"
                  autoComplete="username"
                  autoCorrect={false}
                  accessible={true}
                  accessibilityLabel="Identifier input"
                  returnKeyType="next"
                  onFocus={() => {
                    if (accounts.length > 0) setIdDropdownOpen(true);
                  }}
                  onSubmitEditing={() => {
                    setIdDropdownOpen(false);
                    focusNextInput(passwordInputRef);
                  }}
                  blurOnSubmit={false}
                />
              </View>
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
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
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
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Sign Up Section moved to bottom above footer (hidden in saved-only mode) */}
      {!showSavedOnly && (
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpPrompt}>
            Don't have an account? Sign up for free
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
      )}

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
  inputWrapper: {
    width: "100%",
    position: "relative",
  },
  inputRightIcon: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 16,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "100%",
    maxHeight: 180,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginTop: -8,
    marginBottom: 16,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.silver,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.black,
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
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: "700", // H3 weight (medium)
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
    fontWeight: "700",
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
    fontWeight: "700", // P weight
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
    fontWeight: "700", // H3 weight
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
    fontWeight: "500", // Sub-p weight
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
  // Saved-only mode styles
  savedAccountContainer: {
    width: "100%",
  },
  savedAccountSelector: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedAccountText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  differentAccountButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  differentAccountText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate,
    fontFamily: "Futura",
  },
  usePasswordButton: {
    marginBottom: 8,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  usePasswordButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.green,
    fontFamily: "Futura",
  },
});
