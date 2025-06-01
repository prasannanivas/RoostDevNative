import { createStackNavigator } from "@react-navigation/stack";
import SignupScreen from "../screens/SignupScreen";
import SignupScreen2 from "../screens/SignupScreen2";
import SignupScreen3PhoneVerification from "../screens/SignupScreen3PhoneVerification";
import SignupSuccess from "../screens/SignupSuccess";
import PasswordScreen from "../screens/PasswordScreen";

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
        name="EmailVerification"
        component={SignupScreen3PhoneVerification}
      />
      <Stack.Screen name="Password" component={PasswordScreen} />
      <Stack.Screen
        name="Success"
        component={SignupSuccess}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
