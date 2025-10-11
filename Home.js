import React, { useEffect, useState, useTransition } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import ClientHome from "./ClientHome.js";
import RealtorBottomTabs from "./navigation/RealtorBottomTabs.js";
import LoginScreen from "./screens/LoginScreen.js";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "./context/ClientContext.js";
import { RealtorProvider } from "./context/RealtorContext.js";
import RealtorOnboardingCheck from "./components/RealtorOnboardingCheck.js";

const Home = () => {
  const { auth, logout } = useAuth();
  const navigation = useNavigation();
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [onboardingCheckCompleted, setOnboardingCheckCompleted] =
    useState(false);
  const [lastAuthId, setLastAuthId] = useState(null);

  // AsyncStorage keys for tracking realtor onboarding completion
  const REALTOR_ONBOARDING_KEY = "realtor_onboarding_completed_";

  // Check if realtor has completed onboarding before
  const checkRealtorOnboardingStatus = async (realtorId) => {
    try {
      const key = `${REALTOR_ONBOARDING_KEY}${realtorId}`;
      const completed = await AsyncStorage.getItem(key);
      return completed === "true";
    } catch (error) {
      console.error("Error checking realtor onboarding status:", error);
      return false;
    }
  };

  // Mark realtor onboarding as completed
  const markRealtorOnboardingCompleted = async (realtorId) => {
    try {
      const key = `${REALTOR_ONBOARDING_KEY}${realtorId}`;
      await AsyncStorage.setItem(key, "true");
      console.log(`Realtor ${realtorId} onboarding marked as completed`);
    } catch (error) {
      console.error("Error marking realtor onboarding as completed:", error);
    }
  };

  const fetchClientInfo = async () => {
    if (!auth?.client) return;
    console.log(auth.client);
    try {
      const response = await fetch(
        `https://signup.roostapp.io/client/${auth.client.id}`
      );
      if (!response.ok) {
        console.warn(
          `Client fetch failed for ${auth.client.id} (status ${response.status}). Will log out to avoid crash.`
        );
        await logout();
        return;
      }
      const data = await response.json();
      if (!data || (!data.id && !data._id)) {
        console.warn("Client not found in response. Logging out.");
        await logout();
        return;
      }
      setClientQuestionaire({
        responses: data?.questionnaire?.responses,
        applyingbehalf: data.applyingbehalf,
        employmentStatus: data.employmentStatus,
        ownAnotherProperty: data.ownAnotherProperty,
        otherDetails: data.otherDetails,
      });
      setShowQuestionnaire(
        !data.applyingbehalf ||
          !data.employmentStatus ||
          !data.ownAnotherProperty
      );
    } catch (error) {
      console.error("Error fetching client info", error);
    }
  };

  useEffect(() => {
    if (auth?.client) {
      startTransition(() => {
        fetchClientInfo();
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth?.client) {
      auth.refetch = fetchClientInfo;
    }
  }, [auth?.client]);

  // Check onboarding status when auth changes (new login)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const currentAuthId = auth?.realtor?.id || auth?.client?.id;

      if (currentAuthId && currentAuthId !== lastAuthId) {
        // This is a new login or auth change
        setLastAuthId(currentAuthId);

        if (auth?.realtor) {
          // For realtors, check AsyncStorage to see if they've completed onboarding
          const hasCompletedOnboarding = await checkRealtorOnboardingStatus(
            auth.realtor.id
          );
          setOnboardingCheckCompleted(hasCompletedOnboarding);
          console.log(
            `Realtor ${auth.realtor.id} onboarding status:`,
            hasCompletedOnboarding
          );
        } else {
          // For clients, no onboarding check needed
          setOnboardingCheckCompleted(true);
        }
      } else if (!auth) {
        // Reset when logged out
        setOnboardingCheckCompleted(false);
        setLastAuthId(null);
      }
    };

    checkOnboardingStatus();
  }, [auth, lastAuthId]);

  if (!auth) {
    return <LoginScreen />;
  }
  return (
    <>
      {auth.client ? (
        <ClientProvider>
          {showQuestionnaire ? (
            <ClientQuestionaire
              navigation={navigation}
              questionnaireData={clientQuestionaire}
              showCloseButton={false}
            />
          ) : (
            <ClientHome questionnaireData={clientQuestionaire} />
          )}
        </ClientProvider>
      ) : auth.realtor ? (
        <RealtorProvider>
          {/* RealtorOnboardingCheck will handle navigation if needed - only on initial login */}
          {!onboardingCheckCompleted && (
            <RealtorOnboardingCheck
              onCompleted={async () => {
                // Mark onboarding as completed in AsyncStorage
                await markRealtorOnboardingCompleted(auth.realtor.id);
                setOnboardingCheckCompleted(true);
              }}
            />
          )}
          <RealtorBottomTabs />
        </RealtorProvider>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F6F6F6",
          }}
        >
          <Text style={{ fontSize: 18, color: "#1D2327" }}>
            Welcome to Roost
          </Text>
        </View>
      )}
    </>
  );
};

// Simple PublicHome component for when there's no auth
const PublicHome = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F6F6F6",
      }}
    >
      <Text style={{ fontSize: 18, color: "#1D2327" }}>Welcome to Roost</Text>
    </View>
  );
};

export default Home;
