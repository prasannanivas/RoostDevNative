/**
 * EXAMPLE: How to Integrate Facebook Tracking in App.js
 * 
 * This file shows the changes needed to add Facebook Pixel tracking to your App.js
 * Compare with your current App.js and add the highlighted changes
 */

import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import SignupStackWithFixedBar from "./navigation/SignupStackWithFixedBar";
import RealtorOnboardingStack from "./navigation/RealtorOnboardingStack";
import Home from "./Home";
import WrappedClientDetails from "./screens/WrappedClientDetails";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatUnreadProvider } from "./context/ChatUnreadContext";
import { NetworkProvider, NetworkContext } from "./context/NetworkContext";
import { RealtorProvider } from "./context/RealtorContext";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";
import OfflineGame from "./components/OfflineGame";
import PasswordResetScreen from "./screens/PasswordResetScreen";
import { StatusBar } from "expo-status-bar";
import SplashScreen from "./components/SplashScreen";

// ✅ ADD THIS: Import Facebook Tracking
import { initializeFacebook, trackAppOpen } from "./utils/FacebookTracking";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);
  const hideSplash = () => setSplashVisible(false);

  const bgColor = "#CB003F";

  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: bgColor },
  };

  // ✅ ADD THIS: Initialize Facebook SDK when app starts
  useEffect(() => {
    const initializeFacebookSDK = async () => {
      try {
        console.log('🚀 Initializing Facebook SDK...');
        const initialized = await initializeFacebook();
        
        if (initialized) {
          // Track app open event
          await trackAppOpen();
          console.log('✅ Facebook SDK ready and app open tracked');
        }
      } catch (error) {
        console.error('❌ Facebook SDK initialization error:', error);
      }
    };

    initializeFacebookSDK();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style="light" backgroundColor={bgColor} />
      <NavigationContainer theme={navTheme}>
        <AuthProvider>
          <NetworkProvider>
            <RealtorProvider>
              <NotificationProvider>
                <ChatUnreadProvider>
                  <Stack.Navigator initialRouteName="Home">
                    {/* Your existing stack screens */}
                  </Stack.Navigator>
                </ChatUnreadProvider>
              </NotificationProvider>
            </RealtorProvider>
          </NetworkProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * CHANGES SUMMARY:
 * 
 * 1. Import Facebook tracking functions:
 *    import { initializeFacebook, trackAppOpen } from "./utils/FacebookTracking";
 * 
 * 2. Add useEffect hook to initialize Facebook SDK on app mount:
 *    - Calls initializeFacebook()
 *    - Tracks app open event
 *    - Includes error handling
 * 
 * That's it! Facebook SDK will now be initialized when your app starts.
 */
