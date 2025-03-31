import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignupScreen";
import SignUpScreenTwo from "./screens/SignupScreen2";
import SignUpScreenThreePhoneVerification from "./screens/SignupScreen3PhoneVerification";
import AddProfilePicScreen from "./screens/AddProfilePic";
import WelcomeRealtorScreen from "./screens/SignupSuccess";
import Home from "./Home";
import ClientDetails from "./screens/ClientDetails.js";
import WrappedClientDetails from "./screens/WrappedClientDetails";
import { AuthProvider } from "./context/AuthContext";
import { RealtorProvider } from "./context/RealtorContext";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WelcomeRealtorAfterSignUp"
            component={WelcomeRealtorScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddProPic"
            component={AddProfilePicScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpPage3-PhoneVerification"
            component={SignUpScreenThreePhoneVerification}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpPage2"
            component={SignUpScreenTwo}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClientDetails"
            component={WrappedClientDetails}
            options={{ title: "Client Details" }}
          />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
}
