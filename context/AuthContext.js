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
    } catch (error) {
      console.error("Failed to remove auth data", error);
    }
  };

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
