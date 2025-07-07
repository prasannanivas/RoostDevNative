import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const RealtorContext = createContext(null);

export const RealtorProvider = ({ children }) => {
  const { auth } = useAuth();
  const realtor = auth?.realtor; // Safely access realtor
  const [loadingRealtor, setLoadingRealtor] = useState(true);
  const [realtorInfo, setRealtorInfo] = useState(null);
  const [invited, setInvited] = useState([]);
  const [invitedClients, setInvitedClients] = useState([]);
  const [invitedRealtors, setInvitedRealtors] = useState([]);
  const fetchData = async () => {
    if (realtor && realtor.id) {
      setLoadingRealtor(true);
      // Fetch realtor info
      try {
        const realtorResponse = await fetch(
          `http://159.203.58.60:5000/realtor/${realtor.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const realtorData = await realtorResponse.json();
        setRealtorInfo(realtorData);
      } catch (error) {
        console.error("Error fetching realtor:", error);
        setLoadingRealtor(false);
      } finally {
      }

      // Fetch invited data
      try {
        setLoadingRealtor(true);
        const invitedResponse = await fetch(
          `http://159.203.58.60:5000/realtor/invited/${realtor.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const invitedData = await invitedResponse.json();
        setInvited(invitedData);
        setInvitedClients(
          invitedData.filter((invite) => invite.inviteType === "client")
        );
        setInvitedRealtors(
          invitedData.filter((invite) => invite.inviteType === "realtor")
        );
      } catch (error) {
        console.error("Error fetching invited clients:", error);
      } finally {
        setLoadingRealtor(false);
      }
    }
  };

  const fetchRefreshData = async (realtorId) => {
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtorId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const freshData = await response.json();
        setRealtorInfo(freshData);
        console.log("Realtor data refreshed successfully");
        return freshData;
      } else {
        console.error(
          "Failed to refresh realtor data, status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error refreshing realtor data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [realtor]);

  return (
    <RealtorContext.Provider
      value={{
        invited,
        invitedClients,
        invitedRealtors,
        loadingRealtor,
        realtorInfo,
        fetchLatestRealtor: fetchData,
        fetchRefreshData,
        logout: auth?.logout,
      }}
    >
      {children}
    </RealtorContext.Provider>
  );
};

export const useRealtor = () => {
  const context = useContext(RealtorContext);
  if (!context) {
    throw new Error("useRealtor must be used within a RealtorProvider");
  }
  return context;
};

// Export the context directly
export { RealtorContext };
