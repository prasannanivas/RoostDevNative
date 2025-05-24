import React, { useEffect, useState, useTransition } from "react";
import { useAuth } from "./context/AuthContext";
import ClientHome from "./ClientHome.js";
import RealtorHome from "./RealtorHome.js";
import LoginScreen from "./screens/LoginScreen.js";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "./context/ClientContext.js";
import { RealtorProvider } from "./context/RealtorContext.js";

const Home = () => {
  const { auth } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const fetchClientInfo = async () => {
    if (!auth?.client) return;
    try {
      const response = await fetch(
        `http://44.202.249.124:5000/client/${auth.client.id}`
      );
      const data = await response.json();
      setClientQuestionaire({
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
            <ClientQuestionaire />
          ) : (
            <ClientHome questionnaireData={clientQuestionaire} />
          )}
        </ClientProvider>
      ) : auth.realtor ? (
        <RealtorProvider>
          <RealtorHome />
        </RealtorProvider>
      ) : (
        <PublicHome />
      )}
    </>
  );
};

export default Home;
