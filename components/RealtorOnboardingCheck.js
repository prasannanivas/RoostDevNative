import React, { useEffect, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { useRealtor } from "../context/RealtorContext";
import { useAuth } from "../context/AuthContext";

/**
 * RealtorOnboardingCheck component
 *
 * This component checks if a realtor has:
 * 1. Set a profile picture
 * 2. Invited at least one client
 *
 * If either check fails, navigate to the appropriate onboarding screen
 * No modifications to AuthContext are needed as we use existing data from RealtorContext
 */
const RealtorOnboardingCheck = () => {
  const { realtorInfo, invitedClients, loadingRealtor } = useRealtor();
  const { auth } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    // Only proceed if we're not still loading data and we have realtor info
    if (!loadingRealtor && realtorInfo && auth?.realtor) {
      console.log("Realtor onboarding check triggered", realtorInfo);
      const hasProfilePicture = realtorInfo.profilePicture;
      const hasInvitedClients = invitedClients && invitedClients.length > 0;

      console.log("Realtor onboarding check:", {
        hasProfilePicture,
        hasInvitedClients,
        availableRoutes: navigation.getState()?.routeNames || [],
      });
      const availableRoutes = navigation.getState()?.routeNames || [];
      console.log("Available routes:", availableRoutes);

      // First check if profile picture is missing
      if (!hasProfilePicture) {
        console.log("Profile picture missing, redirecting to onboarding");
        if (availableRoutes.includes("RealtorOnboarding")) {
          navigation.navigate("RealtorOnboarding");
        } else {
          // Fallback to individually created screens if available
          alert("Please set up your profile picture to continue");
        }
        return;
      }

      // Then check if no clients have been invited
      if (!hasInvitedClients) {
        console.log("No invited clients, redirecting to invite client screen");
        if (availableRoutes.includes("RealtorOnboarding")) {
          // Try with and without screen parameter
          try {
            navigation.navigate("RealtorOnboarding", {
              screen: "InviteFirstClient",
            });
          } catch (error) {
            console.error("Navigation error with screen param:", error);
            navigation.navigate("RealtorOnboarding");
          }
        } else {
          alert("Please invite your first client to continue");
        }
        return;
      }

      // If we reach here, both conditions are met so no onboarding needed
      console.log("Realtor onboarding complete");
    }
  }, [realtorInfo, invitedClients, loadingRealtor, auth]);

  // This component doesn't render anything
  return null;
};

export default RealtorOnboardingCheck;
