import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
  const { auth } = useAuth();
  const client = auth?.client; // Ensure we safely access client

  const [documents, setDocuments] = useState([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);

  useEffect(() => {
    setLoadingClient(true);

    async function fetchDocuments(clientID) {
      try {
        // Replace 54.89.183.155 with your computer's IP or an accessible URL
        const response = await fetch(
          `http://54.89.183.155:5000/documents/${clientID}/documents`,
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
        // Replace 54.89.183.155 with your computer's IP or an accessible URL
        const response = await fetch(
          `http://54.89.183.155:5000/client/${clientID}`,
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

    if (client && client.id) {
      fetchDocuments(client.id);
      fetchClient(client.id);
    }
  }, [client]);

  return (
    <ClientContext.Provider value={{ documents, loadingClient, clientInfo }}>
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
