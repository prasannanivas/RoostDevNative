import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
  const { auth } = useAuth();
  const client = auth?.client; // Ensure we safely access client

  const [documents, setDocuments] = useState([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);

  async function fetchDocuments(clientID) {
    try {
      // Replace 44.202.249.124 with your computer's IP or an accessible URL
      const response = await fetch(
        `http://44.202.249.124:5000/documents/${clientID}/documents`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingClient(false);
    }
  }
  async function fetchClient(clientID) {
    try {
      // Replace 44.202.249.124 with your computer's IP or an accessible URL
      const response = await fetch(
        `http://44.202.249.124:5000/client/${clientID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setClientInfo(data);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoadingClient(false);
    }
  }
  // Comprehensive refresh function that updates all client data
  async function fetchRefreshData(clientID) {
    if (!clientID) {
      console.error("Cannot refresh: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }

    console.log("Refreshing all client data for ID:", clientID);
    setLoadingClient(true);

    try {
      // Add a small delay to ensure loading state is visible for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Fetch everything in parallel for better performance
      const [documentsResponse, clientResponse, neededDocsResponse] =
        await Promise.all([
          // Get client uploaded documents
          fetch(`http://44.202.249.124:5000/documents/${clientID}/documents`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),

          // Get client profile data
          fetch(`http://44.202.249.124:5000/client/${clientID}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),

          // Get needed documents list
          fetch(
            `http://44.202.249.124:5000/client/neededdocument/${clientID}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          ),
        ]);

      // Process responses
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        console.log("Documents refreshed:", documentsData.length);
        setDocuments(documentsData);
      }

      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        console.log("Client data refreshed");
        setClientInfo(clientData);
      }

      // The needed documents response is handled directly by the component

      return {
        success: true,
        clientUpdated: clientResponse.ok,
        documentsUpdated: documentsResponse.ok,
        neededDocsResponse: neededDocsResponse.ok
          ? await neededDocsResponse.json()
          : null,
      };
    } catch (error) {
      console.error("Error during data refresh:", error);
      return { success: false, error };
    } finally {
      setLoadingClient(false);
    }
  }

  useEffect(() => {
    setLoadingClient(true);

    if (client && client.id) {
      fetchDocuments(client.id);
      fetchClient(client.id);
    }
  }, [client]);
  return (
    <ClientContext.Provider
      value={{
        documents,
        loadingClient,
        clientInfo,
        fetchRefreshData,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
