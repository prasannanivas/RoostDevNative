import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys
const ACCOUNTS_KEY = "roost.biometric.accounts"; // stores list of account metadata objects
// Each metadata object shape (latest version): { identifier, role, displayName, biometricType }
// biometricType: 'face' | 'fingerprint' | 'iris' | 'generic' (stored preference / last used)
// Secure credential value shape: { identifier, password, role, displayName, biometricType }
const CREDS_PREFIX = "roost.biometric.cred."; // prefix for secure credential entries

// Helper to create a SecureStore key (alphanumeric . - _ only). We hash the identifier with a simple base36 approach.
function makeSecureKey(identifier) {
  const norm = (identifier || "").toLowerCase().trim();
  // Replace invalid chars with '-' then append a short hash to avoid collisions
  const cleaned = norm.replace(/[^a-z0-9._-]/g, "-");
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  }
  const short = hash.toString(36);
  return CREDS_PREFIX + cleaned + "_" + short; // final key always valid
}

export async function isBiometricAvailable() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware)
      return { available: false, reason: "No biometric hardware" };
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled)
      return { available: false, reason: "No biometrics enrolled" };
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { available: true, types };
  } catch (e) {
    return { available: false, reason: e?.message || "Unknown error" };
  }
}

export async function getStoredAccounts() {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Backward compatibility: older entries may miss displayName
    return parsed.map((a) => ({
      ...a,
      displayName:
        a.displayName ||
        (a.role === "realtor"
          ? "Realtor Account"
          : a.role === "client"
          ? "Client Account"
          : "Account"),
      biometricType: a.biometricType || undefined,
    }));
  } catch (e) {
    console.warn("Failed reading stored accounts", e);
    return [];
  }
}

export async function getCredential(identifier) {
  try {
    const key = makeSecureKey(identifier);
    const raw = await SecureStore.getItemAsync(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed reading credential", e);
    return null;
  }
}

export async function saveCredential({
  identifier,
  password,
  role,
  displayName,
  biometricType, // optional
}) {
  if (!identifier || !password) return false;
  const normalized = identifier.toLowerCase();
  try {
    const key = makeSecureKey(normalized);
    await SecureStore.setItemAsync(
      key,
      JSON.stringify({
        identifier: normalized,
        password,
        role,
        displayName,
        biometricType,
      })
    );

    // Update account list (no duplicates)
    const accounts = await getStoredAccounts();
    const existingIdx = accounts.findIndex((a) => a.identifier === normalized);
    const meta = {
      identifier: normalized,
      role,
      displayName:
        displayName ||
        (role === "realtor"
          ? "Realtor Account"
          : role === "client"
          ? "Client Account"
          : "Account"),
      biometricType,
    };
    if (existingIdx >= 0) {
      accounts[existingIdx] = meta; // overwrite role if changed
    } else {
      accounts.push(meta);
    }
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (e) {
    console.warn("Failed saving credential", e);
    return false;
  }
}

export async function removeCredential(identifier) {
  if (!identifier) return false;
  const normalized = identifier.toLowerCase();
  try {
    await SecureStore.deleteItemAsync(makeSecureKey(normalized));
    const accounts = await getStoredAccounts();
    const filtered = accounts.filter((a) => a.identifier !== normalized);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn("Failed removing credential", e);
    return false;
  }
}

export async function authenticateBiometric(
  prompt = "Login with biometrics",
  { disableDeviceFallback = false } = {}
) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      disableDeviceFallback,
    });
    return result;
  } catch (e) {
    return { success: false, error: e?.message };
  }
}
