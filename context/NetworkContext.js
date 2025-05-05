import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";

export const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showOfflineGame, setShowOfflineGame] = useState(false);
  const connectionCheckerRef = useRef(null);

  // Set up the axios interceptor for network error detection
  useEffect(() => {
    // Add a response interceptor to catch network errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if error is a network error
        if (error.message === "Network Error") {
          console.log("Axios detected network error");
          setIsConnected(false);

          // Show game after a short delay if still offline
          setTimeout(() => {
            setShowOfflineGame(true);
          }, 1500);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Remove the interceptor when component unmounts
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Subscribe to network state updates using NetInfo
  useEffect(() => {
    const handleConnectivityChange = (state) => {
      console.log("Network state changed:", state.isConnected);

      // Update connection state
      setIsConnected(!!state.isConnected);

      if (state.isConnected) {
        // When back online, hide game after short delay
        setTimeout(() => {
          setShowOfflineGame(false);
        }, 1000);

        // Clear any active periodic checkers
        if (connectionCheckerRef.current) {
          clearInterval(connectionCheckerRef.current);
          connectionCheckerRef.current = null;
        }
      } else {
        // When offline, show game after short delay
        setTimeout(() => {
          setShowOfflineGame(true);
        }, 1500);

        // Start periodic connection checking
        if (!connectionCheckerRef.current) {
          connectionCheckerRef.current = setInterval(() => {
            console.log("Checking connection status...");
            NetInfo.fetch().then((state) => {
              setIsConnected(!!state.isConnected);
              if (state.isConnected) {
                clearInterval(connectionCheckerRef.current);
                connectionCheckerRef.current = null;
              }
            });
          }, 5000); // Check every 5 seconds
        }
      }
    };

    // Initial network state check
    NetInfo.fetch().then((state) => {
      setIsConnected(!!state.isConnected);
      if (!state.isConnected) {
        setShowOfflineGame(true);
      }
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    return () => {
      unsubscribe();
      if (connectionCheckerRef.current) {
        clearInterval(connectionCheckerRef.current);
      }
    };
  }, []);

  // Reset game visibility
  const hideOfflineGame = () => {
    setShowOfflineGame(false);
  };

  // Force show the game (for testing)
  const forceShowOfflineGame = () => {
    setShowOfflineGame(true);
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        showOfflineGame,
        hideOfflineGame,
        forceShowOfflineGame,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
