import React, { useState, useRef, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import {
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import Button from "../components/common/Button";
import BackButton from "../components/icons/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import SignupScreen from "../screens/SignupScreen";
import SignupScreen2 from "../screens/SignupScreen2";
import SignupScreen3PhoneVerification from "../screens/SignupScreen3PhoneVerification";
import PasswordScreen from "../screens/PasswordScreen";
import SignupSuccess from "../screens/SignupSuccess";

const Stack = createStackNavigator();

// Color palette
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  white: "#FDFDFD",
};

// A component with a truly fixed bottom bar that renders once and stays fixed across screens
export default function SignupStackWithFixedBar({
  navigation: parentNavigation,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("AccountType");
  const insets = useSafeAreaInsets();
  // Use a container ref to access navigation functions
  const navigationContainerRef = useRef(null);

  // Create refs for each screen to access their validation methods
  const accountTypeRef = useRef(null);
  const detailsRef = useRef(null);
  const emailVerificationRef = useRef(null);
  const passwordRef = useRef(null);

  // Determine if this is the first screen to disable back button
  const isFirstScreen = currentScreen === "AccountType";
  const isLastScreen = currentScreen === "Success";

  // Set the action and button text based on current route
  const getButtonText = () => {
    switch (currentScreen) {
      case "Success":
        return "Done";
      default:
        return "Next";
    }
  }; // Perform actions when the component mounts or the navigation ref changes
  useEffect(() => {
    // This effect runs when the component mounts or when navigationContainerRef.current changes
    if (navigationContainerRef.current) {
      // Add any initialization code here if needed
    }
  }, [navigationContainerRef.current]);

  const handleBack = () => {
    // Get the navigator to go back
    if (navigationContainerRef.current && !isFirstScreen) {
      // Using navigation container navigate method
      navigationContainerRef.current.goBack();
    }
    if (isFirstScreen) {
      // If on the first screen, go back to Home with proper animation
      parentNavigation.goBack();
    }
  }; // Helper function to validate the current screen
  const validateCurrentScreen = async () => {
    let isValid = false;
    try {
      switch (currentScreen) {
        case "AccountType":
          isValid = (await accountTypeRef.current?.validate?.()) || false;
          break;
        case "Details":
          isValid = (await detailsRef.current?.validate?.()) || false;
          break;
        case "EmailVerification":
          isValid = (await emailVerificationRef.current?.validate?.()) || false;
          break;
        case "Password":
          isValid = (await passwordRef.current?.validate?.()) || false;
          break;
        case "Success":
          isValid = true; // No validation needed for success screen
          break;
        default:
          isValid = false;
      }
    } catch (error) {
      console.error(`Error validating screen ${currentScreen}:`, error);
      isValid = false;
    }

    return isValid;
  };
  const handleNext = async () => {
    if (!navigationContainerRef.current) return;

    // Set loading state while validating
    setIsLoading(true);

    try {
      // Special handling for success screen
      if (currentScreen === "Success") {
        // Navigate back to Home from main app navigation
        parentNavigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
        return;
      }

      // Validate the current screen
      console.log(`Starting validation for screen: ${currentScreen}`);
      const isValid = await validateCurrentScreen();
      console.log(`Validation result for screen ${currentScreen}: ${isValid}`);

      if (!isValid) {
        console.log(`Validation failed for screen: ${currentScreen}`);
        setIsLoading(false);
        return; // Don't proceed if validation fails
      } // If validation passes, navigate to the next screen
      // Get the current route params to pass forward
      const currentState = navigationContainerRef.current.getCurrentRoute();
      const currentParams = currentState?.params || {};
      console.log(`Current params for ${currentScreen}:`, currentParams);

      switch (currentScreen) {
        case "AccountType":
          navigationContainerRef.current.navigate("Details", currentParams);
          break;
        case "Details":
          navigationContainerRef.current.navigate(
            "EmailVerification",
            currentParams
          );
          break;
        case "EmailVerification":
          navigationContainerRef.current.navigate("Password", currentParams);
          break;
        case "Password":
          navigationContainerRef.current.navigate("Success", currentParams);
          break;
      }
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // Track state changes to update the current screen
  const handleNavigationStateChange = (state) => {
    if (state && state.routes && state.routes.length > 0) {
      const route = state.routes[state.index];
      if (route) {
        console.log("Current screen changed to:", route.name);
        setCurrentScreen(route.name);
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Independent navigation container with ref for direct navigation access */}
        <NavigationIndependentTree>
          <NavigationContainer
            ref={navigationContainerRef}
            onStateChange={handleNavigationStateChange}
          >
            <Stack.Navigator
              initialRouteName="AccountType"
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: COLORS.background },
              }}
            >
              <Stack.Screen
                name="AccountType"
                options={{ gestureEnabled: false }}
              >
                {(props) => (
                  <SignupScreen
                    {...props}
                    ref={accountTypeRef}
                    setIsLoading={setIsLoading}
                    onExitToLogin={() => {
                      // Prefer going back to the previous screen on the parent navigator (likely Login/Home)
                      if (parentNavigation?.canGoBack?.()) {
                        try {
                          parentNavigation.goBack();
                          return;
                        } catch (_) {}
                      }
                      // Fallback: navigate explicitly to Home (which renders Login when unauthenticated)
                      try {
                        parentNavigation?.navigate?.("Home");
                      } catch (_) {}
                    }}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Details"
                initialParams={{ isRealtor: false }} // Default to client
              >
                {(props) => (
                  <SignupScreen2
                    {...props}
                    ref={detailsRef}
                    setIsLoading={setIsLoading}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="EmailVerification">
                {(props) => (
                  <SignupScreen3PhoneVerification
                    {...props}
                    ref={emailVerificationRef}
                    setIsLoading={setIsLoading}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Password">
                {(props) => (
                  <PasswordScreen
                    {...props}
                    ref={passwordRef}
                    setIsLoading={setIsLoading}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Success" options={{ gestureEnabled: false }}>
                {(props) => (
                  <SignupSuccess {...props} setIsLoading={setIsLoading} />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>
      </View>
      {/* Fixed Bottom Bar - Always visible and in the same position */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Back Arrow - hidden on first screen */}

        {!isLastScreen ? (
          <Button
            Icon={<BackButton width={26} height={26} color="#FFFFFF" />}
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
        ) : (
          <View style={{ width: 26 }} /> // Empty spacer
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
    //paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 24,
    minHeight: 120,
    zIndex: 999, // Ensure the bar is above other content
  },
  backButton: {
    borderWidth: 0,
    backgroundColor: COLORS.black,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 24,
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
