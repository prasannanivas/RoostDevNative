import { createStackNavigator } from "@react-navigation/stack";
import SignupScreen from "../screens/SignupScreen";
import SignupScreen2 from "../screens/SignupScreen2";
import SignupScreen3PhoneVerification from "../screens/SignupScreen3PhoneVerification";
import SignupSuccess from "../screens/SignupSuccess";

const Stack = createStackNavigator();

export default function SignupStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen
        name="AccountType"
        component={SignupScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="Details"
        component={SignupScreen2}
        initialParams={{ isRealtor: false }} // Default to client
      />
      <Stack.Screen
        name="PhoneVerification"
        component={SignupScreen3PhoneVerification}
      />
      <Stack.Screen
        name="Success"
        component={SignupSuccess}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
