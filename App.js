import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SignupStackWithFixedBar from "./navigation/SignupStackWithFixedBar";
import RealtorOnboardingStack from "./navigation/RealtorOnboardingStack";
import Home from "./Home";
import WrappedClientDetails from "./screens/WrappedClientDetails";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NetworkProvider, NetworkContext } from "./context/NetworkContext";
import { RealtorProvider } from "./context/RealtorContext";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";
import OfflineGame from "./components/OfflineGame";
import PasswordResetScreen from "./screens/PasswordResetScreen";
import { StatusBar } from "expo-status-bar";
import SplashScreen from "./components/SplashScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  // Splash only acts as an overlay; underlying app renders immediately
  const [isSplashVisible, setSplashVisible] = useState(true);
  const hideSplash = () => setSplashVisible(false);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#CB003F" }}>
      <StatusBar style="light" backgroundColor="#CB003F" />
      <NavigationContainer>
        <AuthProvider>
          <NetworkProvider>
            <RealtorProvider>
              <NotificationProvider>
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
