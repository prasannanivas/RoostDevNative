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

const Stack = createNativeStackNavigator();

export default function App() {
  // Keep custom splash overlay for 3 seconds
  const [isSplashVisible, setSplashVisible] = useState(true);
  const hideSplash = () => setSplashVisible(false);

  // Match native splash background to prevent white flash
  const bgColor = "#CB003F";

  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: bgColor },
  };

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
                    <Stack.Screen
                      name="Home"
                      component={Home}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="SignupStack"
                      component={SignupStackWithFixedBar}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="RealtorOnboarding"
                      component={RealtorOnboardingStack}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="ClientDetails"
                      component={WrappedClientDetails}
                      options={{ title: "Client Details" }}
                    />
                    <Stack.Screen
                      name="PasswordReset"
                      component={PasswordResetScreen}
                    />
                  </Stack.Navigator>
                  {/* Network status components */}
                  <NetworkStatusIndicator />
                  <OfflineGameWrapper />
                </ChatUnreadProvider>
              </NotificationProvider>
            </RealtorProvider>
          </NetworkProvider>
        </AuthProvider>
      </NavigationContainer>
      {isSplashVisible && <SplashScreen onFinish={hideSplash} />}
    </SafeAreaProvider>
  );
}

// Wrapper component to conditionally render the offline game
const OfflineGameWrapper = () => {
  const { showOfflineGame } = React.useContext(NetworkContext);

  // Debug log for visibility
  useEffect(() => {
    console.log("Offline game visibility changed:", showOfflineGame);
  }, [showOfflineGame]);

  if (!showOfflineGame) return null;
  return <OfflineGame />;
};
