import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import {
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SignupScreen from "../screens/SignupScreen";
import SignupScreen2 from "../screens/SignupScreen2";
import SignupScreen3PhoneVerification from "../screens/SignupScreen3PhoneVerification";
import SignupSuccess from "../screens/SignupSuccess";
import PasswordScreen from "../screens/PasswordScreen";

const Stack = createStackNavigator();

// Color palette
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  white: "#FDFDFD",
};

// This component wraps each screen and provides a fixed bottom bar
const FixedBottomBarLayout = ({ children, navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  // Determine if this is the first screen to disable back button
  const isFirstScreen = route.name === "AccountType";

  // Set the action and button text based on current route
  const getButtonText = () => {
    switch (route.name) {
      case "Success":
        return "Done";
      default:
        return "Next";
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    // This function will be passed down to the children to trigger navigation
    if (route.name === "Success") {
      // Handle completion of signup flow
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } else {
      // Extract the ref from the child element
      const childRef = children.ref;
      // Call the handleNext method on the ref
      if (childRef && childRef.current && childRef.current.handleNext) {
        childRef.current.handleNext();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Pass the setIsLoading to child components */}
        {React.cloneElement(children, {
          setBottomBarLoading: setIsLoading,
          // Don't pass onPressNext as a prop to avoid the infinite loop
        })}
      </View>

      {/* Fixed Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Back Arrow - hidden on first screen */}
        {!isFirstScreen ? (
          <TouchableOpacity style={styles.backCircle} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} /> // Empty spacer
        )}

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.nextButtonText}> Loading...</Text>
            </View>
          ) : (
            <Text style={styles.nextButtonText}>{getButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function SignupStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      {/* Make sure there are no spaces or extra text nodes between Stack.Screen elements */}
      <Stack.Screen name="AccountType" options={{ gestureEnabled: false }}>
        {(props) => {
          const screenRef = React.useRef(null);
          return (
            <FixedBottomBarLayout {...props}>
              <SignupScreen {...props} ref={screenRef} />
            </FixedBottomBarLayout>
          );
        }}
      </Stack.Screen>
      <Stack.Screen
        name="Details"
        initialParams={{ isRealtor: false }} // Default to client
      >
        {(props) => {
          const screenRef = React.useRef(null);
          return (
            <FixedBottomBarLayout {...props}>
              <SignupScreen2 {...props} ref={screenRef} />
            </FixedBottomBarLayout>
          );
        }}
      </Stack.Screen>
      <Stack.Screen name="EmailVerification">
        {(props) => {
          const screenRef = React.useRef(null);
          return (
            <FixedBottomBarLayout {...props}>
              <SignupScreen3PhoneVerification {...props} ref={screenRef} />
            </FixedBottomBarLayout>
          );
        }}
      </Stack.Screen>
      <Stack.Screen name="Password">
        {(props) => {
          const screenRef = React.useRef(null);
          return (
            <FixedBottomBarLayout {...props}>
              <PasswordScreen {...props} ref={screenRef} />
            </FixedBottomBarLayout>
          );
        }}
      </Stack.Screen>
      <Stack.Screen
        name="Success"
        component={SignupSuccess}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 120, // Space for the fixed bottom bar
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 24,
    minHeight: 120,
    zIndex: 999, // Ensure the bar is above other content
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 50,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    fontWeight: "700", // H3 weight
    fontFamily: "Futura",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
