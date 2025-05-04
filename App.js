import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignupStack from "./navigation/SignupStack";
import Home from "./Home";
import WrappedClientDetails from "./screens/WrappedClientDetails";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import PasswordResetScreen from "./screens/PasswordResetScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
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
        </NotificationProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
