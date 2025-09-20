import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  // On mount, load stored auth data from AsyncStorage
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedAuth = await AsyncStorage.getItem("authroost");
        if (savedAuth) {
          setAuth(JSON.parse(savedAuth));
        }
      } catch (error) {
        console.error("Failed to load auth data", error);
      }
    };
    loadAuth();
  }, []);

  const login = async (userData) => {
    console.log(userData);
    setAuth(userData);
    try {
      await AsyncStorage.setItem("authroost", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save auth data", error);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    setAuth(null);
    try {
      await AsyncStorage.removeItem("authroost");
      // Also clear any persisted tokens to avoid stale auth on relaunch
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Failed to remove auth data", error);
    }
  };

  // Verify that the saved user still exists on the server. If not, force logout.
  useEffect(() => {
    const verifyUserExists = async () => {
      if (!auth) return;
      try {
        const userId = auth?.client?.id || auth?.realtor?.id;
        const role = auth?.client ? "client" : auth?.realtor ? "realtor" : null;
        if (!userId || !role) return;

        const resp = await fetch(
          `https://signup.roostapp.io/${role}/${userId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!resp.ok) {
          console.warn(
            `Auth verification failed for ${role} ${userId} (status ${resp.status}). Logging out.`
          );
          await logout();
          return;
        }

        // Optionally validate the shape
        const data = await resp.json();
        const exists =
          data && (data.id || data._id || data.email || data.phone);
        if (!exists) {
          console.warn(
            `Auth verification: ${role} ${userId} appears missing. Logging out.`
          );
          await logout();
        }
      } catch (err) {
        // Network errors shouldn't forcibly log out; just log and continue.
        console.warn(
          "Auth verification error (non-fatal):",
          err?.message || err
        );
      }
    };

    verifyUserExists();
    // Only re-verify when the concrete logged-in identity changes
  }, [auth?.client?.id, auth?.realtor?.id]);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
