import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SignupStack from "./navigation/SignupStack";
import Home from "./Home";
import WrappedClientDetails from "./screens/WrappedClientDetails";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NetworkProvider, NetworkContext } from "./context/NetworkContext";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";
import OfflineGame from "./components/OfflineGame";
import PasswordResetScreen from "./screens/PasswordResetScreen";
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <AuthProvider>
          <NetworkProvider>
            <NotificationProvider>
              <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                  name="Home"
                  component={Home}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SignupStack"
                  component={SignupStack}
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
          </NetworkProvider>
        </AuthProvider>
      </NavigationContainer>
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
