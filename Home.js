import React, { useEffect, useState, useTransition } from "react";
import { useAuth } from "./context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import ClientHome from "./ClientHome.js";
import RealtorHome from "./RealtorHome.js";
import LoginScreen from "./screens/LoginScreen.js";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "./context/ClientContext.js";
import { RealtorProvider } from "./context/RealtorContext.js";
import RealtorOnboardingCheck from "./components/RealtorOnboardingCheck.js";

const Home = () => {
  const { auth } = useAuth();
  const navigation = useNavigation();
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const fetchClientInfo = async () => {
    if (!auth?.client) return;
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/client/${auth.client.id}`
      );
      const data = await response.json();
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
            />
          ) : (
            <ClientHome questionnaireData={clientQuestionaire} />
          )}
        </ClientProvider>
      ) : auth.realtor ? (
        <RealtorProvider>
          {/* RealtorOnboardingCheck will handle navigation if needed */}
          <RealtorOnboardingCheck />
          <RealtorHome />
        </RealtorProvider>
      ) : (
        <PublicHome />
      )}
    </>
  );
};

export default Home;
