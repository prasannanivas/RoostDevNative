import React, { useEffect, useState, useTransition } from "react";
import { View, Text, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useAuth } from "./context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import ClientHome from "./ClientHome.js";
import RealtorBottomTabs from "./navigation/RealtorBottomTabs.js";
import LoginScreen from "./screens/LoginScreen.js";
import ClientQuestionaire from "./ClientQuestionaire.js";
import PreQuestionnaireScreen from "./screens/PreQuestionnaireScreen.js";
import ScheduleCallScreen from "./screens/ScheduleCallScreen.js";
import BrokerIntroScreen from "./screens/BrokerIntroScreen.js";
import LoadingScreen from "./screens/LoadingScreen.js";
import CallScheduledConfirmation from "./screens/CallScheduledConfirmation.js";
import { ClientProvider } from "./context/ClientContext.js";
import { RealtorProvider } from "./context/RealtorContext.js";
import RealtorOnboardingCheck from "./components/RealtorOnboardingCheck.js";
import NotificationComponent from "./NotificationComponent.js";

const Home = () => {
  const { auth, logout } = useAuth();
  const navigation = useNavigation();
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showPreQuestionnaire, setShowPreQuestionnaire] = useState(false);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showBrokerIntro, setShowBrokerIntro] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showCallScheduled, setShowCallScheduled] = useState(false);
  const [scheduledDetails, setScheduledDetails] = useState(null);
  const [brokerInfo, setBrokerInfo] = useState(null);
  const [onboardingCheckCompleted, setOnboardingCheckCompleted] =
    useState(false);
  const [lastAuthId, setLastAuthId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

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
        callSchedulePreference: data.callSchedulePreference,
      });

      // Fetch broker info if not already loaded (needed for ScheduleCallScreen)
      if (!brokerInfo) {
        await fetchBrokerInfo();
      }

      // Check if client has scheduled a call
      const hasScheduledCall =
        data.callSchedulePreference?.preferredDay &&
        data.callSchedulePreference?.preferredTime;

      // Check if there's a draft questionnaire
      const draftKey = `questionnaire:draft:${auth.client.id}`;
      const draft = await AsyncStorage.getItem(draftKey);
      const hasDraft = !!draft;

      // Show questionnaire if incomplete AND hasn't scheduled a call
      const isQuestionnaireIncomplete =
        !data.applyingbehalf ||
        !data.employmentStatus ||
        !data.ownAnotherProperty;

      if (hasScheduledCall) {
        // Client has scheduled a call, skip questionnaire
        setShowQuestionnaire(false);
        setShowPreQuestionnaire(false);
      } else if (isQuestionnaireIncomplete) {
        // If there's a draft, go directly to questionnaire (it will show start over/continue)
        // If no draft, show broker intro before questionnaire
        if (hasDraft) {
          console.log("Resuming incomplete questionnaire with draft", hasDraft);
          setShowQuestionnaire(true);
          setShowPreQuestionnaire(false);
        } else {
          // No draft and no call scheduled - show broker intro flow
          console.log("No draft found, showing broker intro flow");
          await showBrokerIntroFlow();
        }
      } else {
        // Questionnaire is complete

        setShowPreQuestionnaire(false);
        setShowQuestionnaire(false);
      }
    } catch (error) {
      console.error("Error fetching client info", error);
    }
  };

  // Download and cache broker profile picture
  const downloadAndCacheBrokerPicture = async (filename) => {
    if (!filename) return null;

    try {
      const cacheDir = `${FileSystem.cacheDirectory}broker-pictures/`;
      const cachedFilePath = `${cacheDir}${filename}`;

      // Check if directory exists, if not create it
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Check if file already exists in cache
      const fileInfo = await FileSystem.getInfoAsync(cachedFilePath);
      if (fileInfo.exists) {
        console.log("Broker picture found in cache:", cachedFilePath);
        return cachedFilePath;
      }

      // Download the image if not cached
      console.log("Downloading broker profile picture:", filename);
      const downloadUrl = `https://signup.roostapp.io/admin/profile-picture/${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        cachedFilePath
      );

      if (downloadResult.status === 200) {
        console.log("Broker picture downloaded and cached:", cachedFilePath);
        return cachedFilePath;
      } else {
        console.error(
          "Failed to download broker picture:",
          downloadResult.status
        );
        return null;
      }
    } catch (error) {
      console.error("Error downloading/caching broker picture:", error);
      return null;
    }
  };

  // Fetch broker info without showing intro screen
  const fetchBrokerInfo = async () => {
    try {
      const response = await fetch(
        `https://signup.roostapp.io/client/${auth.client.id}/mortgage-broker`
      );

      if (!response.ok) {
        console.error("Failed to fetch mortgage broker");
        return;
      }

      const data = await response.json();

      if (data.success && data.mortgageBroker) {
        // Download and cache broker profile picture if available
        let cachedImageUri = null;
        if (data.mortgageBroker.profilePicture) {
          cachedImageUri = await downloadAndCacheBrokerPicture(
            data.mortgageBroker.profilePicture
          );
        }

        // Set broker info with cached image URI
        setBrokerInfo({
          ...data.mortgageBroker,
          cachedImageUri: cachedImageUri,
        });
      }
    } catch (error) {
      console.error("Error fetching broker info:", error);
    }
  };

  // Show broker intro flow with loading screen
  const showBrokerIntroFlow = async () => {
    try {
      setShowLoading(true);

      // Fetch broker info if not already loaded
      let currentBrokerInfo = brokerInfo;
      if (!currentBrokerInfo) {
        await fetchBrokerInfo();
        // After fetching, we need to get the updated broker info
        // Since state updates are async, we fetch it again
        const response = await fetch(
          `https://signup.roostapp.io/client/${auth.client.id}/mortgage-broker`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.mortgageBroker) {
            currentBrokerInfo = data.mortgageBroker;
          }
        }
      }

      // Show loading for at least 1 second for smooth transition
      setTimeout(() => {
        setShowLoading(false);
        if (currentBrokerInfo) {

          setShowBrokerIntro(true);
        } else {
          console.error("Failed to fetch mortgage broker");
          // If broker fetch failed, go to pre-questionnaire
          setShowPreQuestionnaire(true);
        }
      }, 1000);
    } catch (error) {
      console.error("Error showing broker intro:", error);
      setShowLoading(false);
      setShowPreQuestionnaire(true);
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
          {showLoading ? (
            <LoadingScreen />
          ) : showBrokerIntro && brokerInfo ? (
            <BrokerIntroScreen
              brokerName={brokerInfo.name}
              brokerImage={brokerInfo.cachedImageUri}
              onContinue={() => {
                setShowBrokerIntro(false);
                setShowPreQuestionnaire(true);
              }}
            />
          ) : showPreQuestionnaire ? (
            <PreQuestionnaireScreen
              brokerName={brokerInfo?.name}
              onSelectOnline={() => {
                setShowPreQuestionnaire(false);
                setShowQuestionnaire(true);
              }}
              onSelectCall={() => {
                setShowPreQuestionnaire(false);
                setShowScheduleCall(true);
              }}
            />
          ) : showScheduleCall ? (
            <ScheduleCallScreen
              clientId={auth.client.id}
              brokerName={brokerInfo?.name}
              onComplete={(details) => {
                setScheduledDetails(details);
                setShowScheduleCall(false);
                setShowCallScheduled(true);
              }}
              onBack={() => {
                setShowScheduleCall(false);
                setShowPreQuestionnaire(true);
              }}
            />
          ) : showCallScheduled && scheduledDetails ? (
            <CallScheduledConfirmation
              brokerName={brokerInfo?.name}
              brokerImage={brokerInfo?.cachedImageUri}
              scheduledDay={scheduledDetails.day}
              scheduledTime={scheduledDetails.time}
              onContinue={() => {
                setShowCallScheduled(false);
                setScheduledDetails(null);
              }}
            />
          ) : showQuestionnaire ? (
            <ClientQuestionaire
              navigation={navigation}
              questionnaireData={clientQuestionaire}
              showCloseButton={false}
              onBack={() => {
                setShowQuestionnaire(false);
                setShowPreQuestionnaire(true);
              }}
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
          <RealtorBottomTabs
            key={Date.now()}
            onShowNotifications={() => setShowNotifications(true)}
          />
          <NotificationComponent
            visible={showNotifications}
            onClose={() => setShowNotifications(false)}
            userId={auth.realtor?.id}
          />
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
