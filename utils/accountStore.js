import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple account store (no biometrics). Keeps accounts keyed by backend ID
// Shape: { id: string, role: 'client'|'realtor'|string, displayName?: string, identifiers: string[] }
const KEY = "roost.accounts.v1";

export async function getAccounts() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((a) => ({
      id: String(a.id),
      role: a.role,
      displayName:
        a.displayName ||
        (a.role === "realtor"
          ? "Realtor Account"
          : a.role === "client"
          ? "Client Account"
          : "Account"),
      identifiers: Array.isArray(a.identifiers)
        ? a.identifiers.filter(Boolean)
        : [],
    }));
  } catch (e) {
    console.warn("accountStore.getAccounts error", e);
    return [];
  }
}

export async function getAllIdentifiers() {
  const accounts = await getAccounts();
  const set = new Set();
  for (const a of accounts) {
    for (const id of a.identifiers || []) {
      const norm = String(id || "").trim();
      if (norm) set.add(norm);
    }
  }
  return Array.from(set);
}

export async function upsertAccount({ id, role, displayName, identifier }) {
  if (!id || !identifier) return false;
  const idStr = String(id);
  const identStr = String(identifier).trim();
  try {
    const accounts = await getAccounts();
    const idx = accounts.findIndex((a) => a.id === idStr);
    if (idx >= 0) {
      const acc = accounts[idx];
      const existing = new Set(
        (acc.identifiers || []).map((s) => s.toLowerCase())
      );
      if (!existing.has(identStr.toLowerCase())) {
        acc.identifiers = [...(acc.identifiers || []), identStr];
      }
      if (role && acc.role !== role) acc.role = role;
      if (displayName) acc.displayName = displayName;
      accounts[idx] = acc;
    } else {
      accounts.push({
        id: idStr,
        role,
        displayName:
          displayName ||
          (role === "realtor"
            ? "Realtor Account"
            : role === "client"
            ? "Client Account"
            : "Account"),
        identifiers: [identStr],
      });
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(accounts));
    return true;
  } catch (e) {
    console.warn("accountStore.upsertAccount error", e);
    return false;
  }
}

export async function removeAccountById(id) {
  if (!id) return false;
  const idStr = String(id);
  try {
    const accounts = await getAccounts();
    const filtered = accounts.filter((a) => a.id !== idStr);
    await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn("accountStore.removeAccountById error", e);
    return false;
  }
}
