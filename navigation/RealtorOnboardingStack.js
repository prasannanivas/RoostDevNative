import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import RealtorFirstLoginAddProfilePic from "../screens/RealtorFirstLoginAddProfilePic";
import RealtorInviteFirstClient from "../screens/RealtorInviteFirstClient";
import RealtorHome from "../RealtorHome";

const Stack = createStackNavigator();

export default function RealtorOnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen
        name="AddProfilePic"
        component={RealtorFirstLoginAddProfilePic}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="InviteFirstClient"
        component={RealtorInviteFirstClient}
      />
      <Stack.Screen
        name="RealtorHome"
        component={RealtorHome}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
