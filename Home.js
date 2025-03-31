import React, { useEffect, useState, useTransition } from "react";
import { View } from "react-native";
import { useAuth } from "./context/AuthContext";
import ClientHome from "./ClientHome.js";
import RealtorHome from "./RealtorHome.js";
import LoginScreen from "./screens/LoginScreen.js";
import ClientQuestionaire from "./ClientQuestionaire.js";
import { ClientProvider } from "./context/ClientContext.js";
import { RealtorProvider } from "./context/RealtorContext.js";

const Home = () => {
  const { auth } = useAuth();
  //console.log(auth);
  const [isPending, startTransition] = useTransition();
  const [clientQuestionaire, setClientQuestionaire] = useState({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  useEffect(() => {
    //   console.log("Auth changed:", auth);
    if (auth?.client) {
      startTransition(() => {
        const getClientInfo = async () => {
          try {
            // Update URL to match your backend for mobile (e.g., using your computer's IP)
            await fetch(`http://54.89.183.155:5000/client/${auth.client.id}`)
              .then((response) => response.json())
              .then((data) => {
                setClientQuestionaire({
                  applyingbehalf: data.applyingbehalf,
                  employmentStatus: data.employmentStatus,
                  ownAnotherProperty: data.ownAnotherProperty,
                });
                setShowQuestionnaire(
                  !data.applyingbehalf ||
                    !data.employmentStatus ||
                    !data.ownAnotherProperty
                );
              });
          } catch (error) {
            console.error("Error fetching client info", error);
          }
        };
        getClientInfo();
      });
    }
  }, [auth]);

  if (!auth) {
    return <LoginScreen />;
  }

  return auth.client ? (
    <ClientProvider>
      {showQuestionnaire ? <ClientQuestionaire /> : <ClientHome />}
    </ClientProvider>
  ) : auth.realtor ? (
    <RealtorProvider>
      <RealtorHome />
    </RealtorProvider>
  ) : (
    <PublicHome />
  );
};

export default Home;
