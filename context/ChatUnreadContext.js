// context/ChatUnreadContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";

const ChatUnreadContext = createContext(null);

export const useChatUnread = () => {
  const context = useContext(ChatUnreadContext);
  if (!context) {
    throw new Error("useChatUnread must be used within a ChatUnreadProvider");
  }
  return context;
};

export const ChatUnreadProvider = ({ children }) => {
  const { auth } = useAuth();
  const clientId = auth?.client?.id || auth?.client?._id;

  // Separate unread counts for each chat type
  const [unreadCounts, setUnreadCounts] = useState({
    admin: 0,
    "mortgage-broker": 0,
  });

  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch unread counts for both chat types
  const fetchUnreadCounts = async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      const ChatService = require("../services/ChatService").default;
      const headers = await ChatService.getAuthHeaders();

      // Fetch unread count for admin chat
      const adminResponse = await fetch(
        `https://signup.roostapp.io/client/chat/${clientId}/unread-count?chatType=admin`,
        { headers }
      );

      // Fetch unread count for mortgage broker chat
      const brokerResponse = await fetch(
        `https://signup.roostapp.io/client/chat/${clientId}/unread-count?chatType=mortgage-broker`,
        { headers }
      );

      const adminData = adminResponse.ok
        ? await adminResponse.json()
        : { unreadCount: 0 };
      const brokerData = brokerResponse.ok
        ? await brokerResponse.json()
        : { unreadCount: 0 };

      setUnreadCounts({
        admin: adminData.unreadCount || 0,
        "mortgage-broker": brokerData.unreadCount || 0,
      });

      console.log("📊 Fetched unread counts:", {
        admin: adminData.unreadCount || 0,
        "mortgage-broker": brokerData.unreadCount || 0,
      });
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Increment unread count for a specific chat type
  const incrementUnread = (chatType) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chatType]: prev[chatType] + 1,
    }));
    console.log(`📈 Incremented unread count for ${chatType}`);
  };

  // Clear unread count for a specific chat type
  const clearUnread = (chatType) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chatType]: 0,
    }));
    console.log(`🔄 Cleared unread count for ${chatType}`);
  };

  // Set specific unread count for a chat type
  const setUnreadForType = (chatType, count) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chatType]: count,
    }));
    console.log(`📝 Set unread count for ${chatType} to ${count}`);
  };

  // Setup WebSocket connection to listen for new messages
  useEffect(() => {
    if (!clientId) return;

    console.log("🔌 Setting up ChatUnread WebSocket for client:", clientId);

    socketRef.current = io("https://signup.roostapp.io", {
      auth: {
        userType: "client",
        userId: clientId,
      },
    });

    socketRef.current.on("connect", () => {
      console.log("✅ ChatUnread socket connected");
      setSocketConnected(true);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ ChatUnread socket connection error:", error);
      setSocketConnected(false);
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 ChatUnread socket disconnected");
      setSocketConnected(false);
    });

    // Listen for new messages from admin chat
    socketRef.current.on("new_message", (data) => {
      console.log("📨 New message received via ChatUnread socket:", data);

      const message = data.message || data;
      const sender = message.sender;
      const chatType =
        data.chatType || (sender === "admin" ? "admin" : "mortgage-broker");

      // Only increment if it's not from the client
      if (sender !== "client" && sender !== "user") {
        incrementUnread(chatType);
      }
    });

    // Listen for messages read events
    socketRef.current.on("messages_read", (data) => {
      console.log("📖 Messages read event via ChatUnread socket:", data);
      const chatType = data.chatType || "admin";

      // If client read the messages, clear the count
      if (data.userId === clientId) {
        clearUnread(chatType);
      }
    });

    return () => {
      if (socketRef.current) {
        console.log("🛑 Cleaning up ChatUnread socket");
        socketRef.current.disconnect();
      }
    };
  }, [clientId]);

  // Listen to push notifications and increment unread count immediately
  useEffect(() => {
    if (!clientId) return;

    console.log("📱 Setting up push notification listener for ChatUnread");

    // Listen for notifications received while app is in foreground or background
    const notificationSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        console.log("📨 ChatUnread received notification:", data);

        // Check if it's a chat notification
        if (
          data.type === "CHAT_MESSAGE" ||
          data.notificationType === "chat_message"
        ) {
          const chatType = data.chatType; // "admin" or "mortgage-broker"

          if (chatType) {
            console.log(
              `📈 Incrementing unread count for ${chatType} from push notification`
            );
            incrementUnread(chatType);
          }
        }
      });

    // Also listen for notification responses (when user taps notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("📲 ChatUnread notification tapped:", data);

        // When user taps notification, they'll be taken to the chat
        // The Chat component will handle marking as read
        // We don't need to do anything here
      });

    return () => {
      console.log("🛑 Cleaning up ChatUnread notification listeners");
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [clientId]);

  // Fetch initial counts on mount
  useEffect(() => {
    if (clientId) {
      fetchUnreadCounts();
    }
  }, [clientId]);

  // Listen to app state changes and fetch counts when app comes to foreground
  useEffect(() => {
    if (!clientId) return;

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        console.log(`📱 AppState changed to: ${nextAppState}`);

        // When app comes to foreground (from background or inactive)
        if (nextAppState === "active") {
          console.log("📊 App became active, fetching unread counts...");
          fetchUnreadCounts();
        }
      }
    );

    return () => {
      console.log("🛑 Cleaning up AppState listener");
      appStateSubscription.remove();
    };
  }, [clientId]);

  // Refresh counts when app comes to foreground
  useEffect(() => {
    if (clientId && socketConnected) {
      // Refresh every 30 seconds as a fallback
      const interval = setInterval(() => {
        fetchUnreadCounts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [clientId, socketConnected]);

  const value = {
    unreadCounts,
    loading,
    socketConnected,
    fetchUnreadCounts,
    incrementUnread,
    clearUnread,
    setUnreadForType,
    totalUnread: unreadCounts.admin + unreadCounts["mortgage-broker"],
  };

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
};

export default ChatUnreadContext;
