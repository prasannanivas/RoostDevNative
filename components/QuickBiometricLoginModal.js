import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from "react-native";
import { Animated, Easing } from "react-native";
import {
  authenticateBiometric,
  getCredential,
  saveCredential,
  getStoredAccounts,
} from "../utils/biometricUtils";
import { Ionicons } from "@expo/vector-icons";

// NOTE: Implemented without React Native's native Modal so that higher z-index overlays
// like the custom SplashScreen (which uses an absolute positioned view with large zIndex)
// remain visually on top. Native Modal always floats above everything, which previously
// caused the splash to appear "behind" the biometric sheet. This component now renders
// in-place with absolute positioning and respects normal z-index stacking.
const QuickBiometricLoginModal = ({
  visible,
  onClose,
  onUsePassword, // optional callback to trigger focusing password field externally
  onForgotPassword, // optional navigation to reset
  onRegister, // optional navigation to signup
  accounts = [], // [{identifier, role, displayName}]
  onAuthenticated, // ({identifier, password, role}) => void
  prefillEmail, // function to set email field in parent
  supportedTypes = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(accounts[0] || null);
  const [error, setError] = useState(null);
  const [render, setRender] = useState(visible); // internal mount control for exit animation

  // Animated values
  const slideY = useRef(new Animated.Value(visible ? 0 : 40)).current; // sheet offset
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Animate on visibility change
  React.useEffect(() => {
    if (visible) {
      setRender(true);
      // enter
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // exit
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 40,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible]);

  console.log("QuickBiometricLoginModal render", {
    visible,
    accounts,
    selected,
  });

  React.useEffect(() => {
    if (visible) {
      setExpanded(false);
      setSelected(accounts[0] || null);
      setError(null);
    }
  }, [visible, accounts]);

  // Ensure we always have a selected account when accounts are present.
  React.useEffect(() => {
    if (
      visible &&
      (!selected || !selected.identifier) &&
      accounts &&
      accounts.length > 0
    ) {
      setSelected(accounts[0]);
    }
  }, [visible, accounts, selected]);

  const resolveType = () => {
    // Priority: stored account biometricType -> supported types -> generic
    if (selected?.biometricType) return selected.biometricType;
    if (supportedTypes.includes(2)) return "face"; // FaceID
    if (supportedTypes.includes(1)) return "fingerprint";
    return "generic";
  };

  const renderIcon = () => {
    const t = resolveType();
    // Valid Ionicons (v7+ via @expo/vector-icons) suggestions:
    // Face-like: 'person-circle-outline' or 'happy-outline'
    // Fingerprint: 'finger-print'
    // Generic lock: 'lock-closed-outline'
    if (t === "face")
      return <Ionicons name="happy-outline" size={52} color="#377473" />;
    if (t === "fingerprint")
      return <Ionicons name="finger-print" size={52} color="#377473" />;
    return <Ionicons name="lock-closed-outline" size={52} color="#377473" />;
  };

  const runAuth = async () => {
    if (!selected) return;
    setError(null);
    let auth = await authenticateBiometric("Authenticate to login", {
      disableDeviceFallback: true,
    });
    if (!auth.success) {
      // Some devices / OS versions may not show biometric first with strict mode; retry once allowing fallback.
      if (auth.error && auth.error !== "user_cancel") {
        auth = await authenticateBiometric("Authenticate to login", {
          disableDeviceFallback: false,
        });
      }
    }
    if (!auth.success) {
      if (auth.error !== "user_cancel") {
        setError("Authentication failed. Try again.");
      }
      return;
    }
    const cred = await getCredential(selected.identifier);
    if (!cred) {
      setError("Stored credential missing.");
      return;
    }
    // Persist biometricType used if not already stored (augment meta & secure record)
    const currentType = resolveType();
    if (!selected.biometricType || selected.biometricType !== currentType) {
      await saveCredential({
        identifier: cred.identifier,
        password: cred.password,
        role: cred.role,
        displayName: cred.displayName,
        biometricType: currentType === "generic" ? undefined : currentType,
      });
    }
    // Refresh accounts silently (optional)
    try {
      const updated = await getStoredAccounts();
      // We don't have a setter here; parent will refresh next mount.
    } catch (_) {}
    onClose();
    onAuthenticated(cred); // {identifier,password,role}
  };

  if (!render) return null;

  return (
    <View style={styles.portalContainer} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <TouchableWithoutFeedback onPress={() => {}}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideY }] }]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close quick login"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle-outline" size={32} color="#2823236b" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign In</Text>
          {accounts.length > 1 && (
            <View style={styles.accountPickerWrapper}>
              <TouchableOpacity
                style={styles.accountHeader}
                onPress={() => setExpanded(!expanded)}
              >
                <Text style={styles.accountHeaderText} numberOfLines={1}>
                  {selected?.displayName || selected?.role || "Account"}
                </Text>
                <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.accountList}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.identifier}
                      style={styles.accountItem}
                      onPress={() => {
                        setSelected(acc);
                        setExpanded(false);
                        prefillEmail && prefillEmail(acc.identifier);
                      }}
                    >
                      <Text style={styles.accountItemText}>
                        {acc.displayName +
                          (acc.role === "realtor"
                            ? " (Realtor)"
                            : acc.role === "client"
                            ? " (Client)"
                            : "")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          {accounts.length === 1 && (
            <Text style={styles.singleAccount}>
              {selected?.displayName ||
                (selected?.role === "realtor"
                  ? "Realtor Account"
                  : selected?.role === "client"
                  ? "Client Account"
                  : "Account")}
            </Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.iconButtonContainer}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                !selected && { opacity: 0.5, backgroundColor: "#ccc" },
              ]}
              disabled={!selected}
              onPress={runAuth}
              accessibilityLabel="Authenticate with biometrics"
              accessibilityRole="button"
            >
              {renderIcon()}
              <View style={styles.primaryButton}>
                <Text style={styles.primaryText}>
                  {`Sign in with ${
                    resolveType() === "generic"
                      ? "Biometrics"
                      : resolveType() === "face"
                      ? "Face ID"
                      : "Fingerprint"
                  }`}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryText}>Use Password</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.secondaryButton, { marginTop: 1 }]}
            onPress={() => {
              if (selected?.identifier) {
                prefillEmail && prefillEmail(selected.identifier);
              }
              onClose();
              if (onUsePassword) setTimeout(() => onUsePassword(), 50);
            }}
            accessibilityLabel="Use password instead"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Use Password</Text>
          </TouchableOpacity>
          {(onForgotPassword || onRegister) && (
            <View style={styles.inlineLinksRow}>
              {onForgotPassword && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onForgotPassword();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot Password"
                >
                  <Text style={styles.linkInline}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
              {onForgotPassword && onRegister && (
                <Text style={styles.linkDivider}> </Text>
              )}
              {onRegister && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onRegister();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Register"
                >
                  <Text style={styles.linkInline}>Register</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  portalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100, // below SplashScreen which uses a very high zIndex
    elevation: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FDFDFD",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "60%", // occupy 60% of screen height as requested
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  handleContainer: { alignItems: "center", marginBottom: 8, height: 48 },
  handle: { width: 46, height: 5, backgroundColor: "#D0D4D8", borderRadius: 3 },
  title: {
    fontFamily: "futura",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  accountPickerWrapper: { marginBottom: 16, position: "relative" },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#A9A9A9",
    borderRadius: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 16,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  accountHeaderText: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#1D2327",
    fontFamily: "futura",
  },
  chevron: { fontSize: 14, color: "#707070" },
  accountList: {
    position: "absolute",
    top: 52, // below header (approx header height + margin)
    left: 0,
    right: 0,
    marginTop: 0,
    borderWidth: 1,
    borderColor: "#A9A9A9",
    borderRadius: 10,
    backgroundColor: "#FDFDFD",
    overflow: "hidden",
    maxHeight: 200,
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  accountItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  accountItemText: { fontSize: 14, color: "#1D2327", fontFamily: "futura" },
  singleAccount: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    color: "#1D2327",
  },
  error: {
    color: "#A20E0E",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 12,
  },
  iconButtonContainer: {
    alignItems: "center",
    marginVertical: 32,
  },
  iconButton: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    height: 48,
    borderRadius: 50,
    borderColor: "#377473",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#377473",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "futura",
  },
  primaryButton: {
    height: 48,
    borderRadius: 33,
    width: 200,
    backgroundColor: "#377473",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  primaryText: {
    color: "#FDFDFD",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "futura",
  },
  inlineLinksRow: {
    position: "absolute",
    bottom: "15%",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkInline: {
    fontSize: 12,
    fontWeight: "700",
    color: "#377473",
    marginHorizontal: 8,
    minWidth: 75,
    fontFamily: "futura",
  },
  linkDivider: { width: 20 },
});

export default QuickBiometricLoginModal;
