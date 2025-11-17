// Chat.js
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  Keyboard,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import { useAuth } from "../context/AuthContext";
import { useChatUnread } from "../context/ChatUnreadContext";
import ChatService from "../services/ChatService";
import TypingIndicator from "./TypingIndicator";
import { generateInitials } from "../utils/initialsUtils";
import Svg, { Path } from "react-native-svg";

// Pre-cache the Roost logo image
const roostLogoImage = require("../assets/app-icon.png");

/**
 * Color palette from UX team design system
 */
const COLORS = {
  // Core colors
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070", // dark gray
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",

  // Accent colors
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",

  // Chat specific colors
  userBubble: "#377473",
  supportBubble: "#FFFFFF",
  inputBackground: "#FFFFFF",
  borderColor: "#E1E5E9",
  timestampColor: "#8E9AAF",
  onlineIndicator: "#377473",
};

const { width: screenWidth } = Dimensions.get("window");

const Chat = ({
  visible,
  onClose,
  userId,
  userName = "User",
  userType = "client",
  chatType = "admin", // "admin" or "mortgage-broker"
  onUnreadChange, // Callback to notify parent about unread messages
  supportName, // Name of support person (e.g., mortgage broker name)
  supportAvatar, // Avatar URL of support person
}) => {
  const { auth } = useAuth();
  const { clearUnread, setUnreadForType } = useChatUnread();

  console.log("Chat component rendered", supportAvatar, supportName);
  // Get context data based on userType
  let contextInfo = null;
  let contextName = userName;

  if (userType === "client") {
    // Try to use client context if available (for client screens)
    try {
      const { useClient } = require("../context/ClientContext");
      const clientContext = useClient();
      contextInfo = clientContext?.clientInfo || auth.client;
      contextName = contextInfo?.name || userName;
    } catch (error) {
      // Client context not available
      contextInfo = auth.client;
      contextName = contextInfo?.name || userName;
    }
  } else if (userType === "realtor") {
    // Try to use realtor context if available (for realtor screens)
    try {
      const { useRealtor } = require("../context/RealtorContext");
      const realtorContext = useRealtor();
      contextInfo = realtorContext?.realtorInfo || auth.realtor;
      contextName = contextInfo?.name || userName;
    } catch (error) {
      // Realtor context not available
      contextInfo = auth.realtor;
      contextName = contextInfo?.name || userName;
    }
  }

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [imageCached, setImageCached] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const scrollViewRef = useRef(null);
  const wsConnectionRef = useRef(null);
  const textInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const soundRef = useRef(null);

  // Use dynamic context data based on userType
  const userFromContext = contextInfo;
  const displayName = contextName;

  // Function to play notification sound
  const playNotificationSound = async () => {
    console.log("🎵 playNotificationSound() called");
    try {
      console.log("🎵 Attempting to load and play notification.mp3...");

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/notification.mp3"),
        { shouldPlay: true, volume: 0.8 }
      );
      soundRef.current = sound;
      console.log("✅ Sound loaded successfully, should be playing now!");

      // Unload sound after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log("🎵 Sound finished playing, unloading...");
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("❌ ERROR playing notification sound:", error);
      console.error("Error details:", error.message);
      console.warn(
        "To enable sound notifications, add notification.mp3 to the assets folder"
      );
    }
  };

  // Pre-cache the Roost logo image on component mount
  useEffect(() => {
    console.log(
      `🚀 [Chat] Component mounted - chatType: ${chatType}, userId: ${userId}, userType: ${userType}`
    );

    const cacheImage = async () => {
      try {
        await Asset.fromModule(roostLogoImage).downloadAsync();
        setImageCached(true);
        console.log("Roost logo image cached successfully");
      } catch (error) {
        console.warn("Failed to cache Roost logo image:", error);
        setImageCached(true); // Set to true anyway to not block rendering
      }
    };
    cacheImage();

    // Set up audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      console.log(`🛑 [Chat] Component unmounting - chatType: ${chatType}`);
    };
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle sending typing indicators
  const handleTypingStart = () => {
    if (wsConnectionRef.current && currentChatId && !isTypingRef.current) {
      console.log("🔤 Sending typing_start event for chat:", currentChatId);
      isTypingRef.current = true;
      setIsUserTyping(true);
      wsConnectionRef.current.startTyping(currentChatId);
    }
  };

  const handleTypingStop = () => {
    if (wsConnectionRef.current && currentChatId && isTypingRef.current) {
      console.log("🔤 Sending typing_stop event for chat:", currentChatId);
      isTypingRef.current = false;
      setIsUserTyping(false);
      wsConnectionRef.current.stopTyping(currentChatId);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);

    // Handle typing indicators
    if (text.trim().length > 0) {
      handleTypingStart();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 1000); // Stop typing after 1 second of inactivity
    } else {
      // If input is empty, stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    }
  };

  // Load messages from API
  const loadMessages = async (page = 1, append = false) => {
    if (!userId) return;

    if (!append) {
      setLoading(true);
      setConnectionStatus("connecting");
    } else {
      setLoadingMore(true);
    }

    try {
      console.log(
        "Loading messages for user:",
        userId,
        "page:",
        page,
        "append:",
        append,
        "userType:",
        userType
      );

      // First, get or create the chat to get the chatId
      if (!currentChatId && !append) {
        try {
          let chatData;
          if (chatType === "mortgage-broker") {
            chatData = await ChatService.getMortgageBrokerChat(userId);
          } else {
            const chatResponse = await fetch(
              `https://signup.roostapp.io/${userType}/chat/${userId}`,
              {
                method: "GET",
                headers: await ChatService.getAuthHeaders(),
              }
            );
            if (chatResponse.ok) {
              chatData = await chatResponse.json();
            }
          }

          if (chatData && chatData.chat && chatData.chat._id) {
            setCurrentChatId(chatData.chat._id);
            console.log(
              "💬 Chat ID obtained for typing indicators:",
              chatData.chat._id
            );

            // Join the specific chat room for real-time updates
            if (wsConnectionRef.current && wsConnectionRef.current.joinChat) {
              wsConnectionRef.current.joinChat(chatData.chat._id);
            }
          }
        } catch (chatError) {
          console.warn("Could not get chat ID:", chatError);
        }
      }

      // Use appropriate endpoint based on userType
      let response;
      if (userType === "realtor") {
        // Realtors always chat with admin, use legacy endpoint
        response = await ChatService.getMessages(userId, 50, page, userType);
      } else {
        // Clients can chat with admin or mortgage-broker, use unified endpoint
        console.log(
          "🔄 Loading messages for CLIENT - userId:",
          userId,
          "chatType:",
          chatType
        );
        response = await ChatService.getMessagesByType(
          userId,
          chatType,
          50,
          page
        );
      }

      const apiMessages = response.messages || [];
      setPagination(response.pagination);

      // Check if mortgage broker chat is available
      if (chatType === "mortgage-broker" && response && !response.available) {
        console.log("Mortgage broker chat not available");
        setMessages([
          {
            id: "not-available",
            text: "You don't have a mortgage broker assigned yet. Your mortgage broker will be assigned soon during the application process. For immediate assistance, please use General Support.",
            sender: "support",
            timestamp: new Date(),
            status: "delivered",
          },
        ]);
        setConnectionStatus("connected");
        return;
      }

      // If no messages and this is initial load, show welcome message
      if (apiMessages.length === 0 && !append) {
        const supportType =
          chatType === "mortgage-broker" ? "Mortgage Broker" : "Roost Support";
        console.log("📭 No existing messages found, showing welcome message");
        console.log("👤 User type:", userType, "Display name:", displayName);
        setMessages([
          {
            id: "welcome",
            text: `Hello ${displayName}! Welcome to ${supportType}. How can I help you today?`,
            sender: "support",
            timestamp: new Date(),
            status: "delivered",
          },
        ]);
        setConnectionStatus("connected");
        setLoading(false); // IMPORTANT: Stop loading spinner
        return;
      }

      // Transform API messages to component format
      const transformedMessages = apiMessages
        .filter((msg) => {
          // Filter out messages without content or ID
          const hasContent = msg.content && msg.content.trim();
          const hasId = msg._id;

          if (!hasContent || !hasId) {
            console.warn("Filtering out invalid message:", msg);
            return false;
          }

          // CRITICAL: Filter by chat type to prevent showing messages in wrong chat
          // This is a safety check (API should already filter, but double-check here)
          if (chatType === "admin" && msg.sender === "mortgage-broker") {
            console.log(
              "🚫 Filtering out mortgage-broker message from admin chat API response"
            );
            return false;
          }
          if (chatType === "mortgage-broker" && msg.sender === "admin") {
            console.log(
              "🚫 Filtering out admin message from mortgage-broker chat API response"
            );
            return false;
          }

          return true;
        })
        .map((msg) => {
          // Determine if message is from support (admin/mortgage-broker) or user (client)
          const isFromSupport =
            msg.sender === "admin" ||
            msg.sender === "mortgage-broker" ||
            msg.sender === "sub-admin";
          const isFromUser =
            msg.sender === "client" || msg.sender === "realtor";

          // Determine read status for the current user
          const isRead = msg.readBy?.[userType]?.isRead || false;

          // Create a valid timestamp
          let timestamp = new Date();
          if (msg.createdAt) {
            const dateFromAPI = new Date(msg.createdAt);
            if (
              !isNaN(dateFromAPI.getTime()) &&
              dateFromAPI.getFullYear() > 1970
            ) {
              timestamp = dateFromAPI;
            } else {
              console.warn(
                "Invalid date from API, using current time:",
                msg.createdAt
              );
            }
          }

          return {
            id: msg._id,
            text: msg.content.trim(),
            sender: isFromSupport ? "support" : "user",
            timestamp: timestamp,
            status: isFromUser ? (isRead ? "delivered" : "sent") : "delivered",
            messageType: msg.messageType || "text",
            isDeleted: msg.isDeleted || false,
            readBy: msg.readBy,
            replyTo: msg.replyTo,
            senderId: msg.senderId,
            originalSender: msg.sender, // Keep original sender info
          };
        });

      if (append) {
        // For pagination, prepend older messages
        setMessages((prev) => [...transformedMessages, ...prev]);
      } else {
        // For initial load or refresh, intelligently merge messages
        setMessages((prevMessages) => {
          // If we have previous messages, merge intelligently
          if (prevMessages.length > 0) {
            console.log("=== MESSAGE MERGE DEBUG ===");
            console.log("Previous messages count:", prevMessages.length);
            console.log("Server messages count:", transformedMessages.length);
            console.log(
              "Previous message IDs:",
              prevMessages.map((m) => m.id)
            );
            console.log(
              "Server message IDs:",
              transformedMessages.map((m) => m.id)
            );

            // Create a map of server messages by ID
            const serverMessagesMap = new Map();
            transformedMessages.forEach((msg) => {
              serverMessagesMap.set(msg.id, msg);
            });

            // Update existing messages with server data, keep local messages not yet on server
            const mergedMessages = prevMessages.map((localMsg) => {
              const serverMsg = serverMessagesMap.get(localMsg.id);
              if (serverMsg) {
                console.log(`Updating message ${localMsg.id} with server data`);
                // Update local message with server data (better status, readBy, etc.)
                return {
                  ...localMsg,
                  ...serverMsg,
                  // Keep local timestamp if server timestamp is weird
                  timestamp: serverMsg.timestamp || localMsg.timestamp,
                };
              } else {
                console.log(
                  `Keeping local message ${localMsg.id} (not found on server)`
                );
              }
              return localMsg; // Keep local message if not found on server
            });

            // Add any new server messages that aren't in local state
            const existingIds = new Set(prevMessages.map((msg) => msg.id));
            const newServerMessages = transformedMessages.filter(
              (msg) => !existingIds.has(msg.id)
            );

            console.log(
              "New server messages to add:",
              newServerMessages.length
            );
            console.log(
              "Final merged messages count:",
              mergedMessages.length + newServerMessages.length
            );
            console.log("=== END MESSAGE MERGE DEBUG ===");

            return [...mergedMessages, ...newServerMessages];
          } else {
            // No previous messages, use server messages as-is
            console.log("No previous messages, using server messages as-is");
            return transformedMessages;
          }
        });
      }

      setConnectionStatus("connected");
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      setConnectionStatus("error");

      // Set fallback welcome message only for initial load failures
      if (!append) {
        console.log("⚠️ Setting fallback welcome message due to error");
        setMessages([
          {
            id: "welcome",
            text: `Hello ${displayName}! Welcome to Roost Support. How can I help you today?`,
            sender: "support",
            timestamp: new Date(),
            status: "delivered",
          },
        ]);
      }
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (visible && userId) {
      loadMessages();

      // Scroll to bottom after a short delay to ensure messages are rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);

      // Additional scroll attempts to ensure we reach the bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 300);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 500);

      // Animate entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, userId, chatType]); // Added chatType to dependency array

  // Mark unread messages as read when chat becomes visible
  useEffect(() => {
    if (visible && messages.length > 0 && userId) {
      const unreadMessageIds = messages
        .filter(
          (msg) => msg.sender === "support" && !msg.readBy?.[userType]?.isRead
        )
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        console.log(
          "Marking messages as read:",
          unreadMessageIds,
          "chatType:",
          chatType
        );
        ChatService.markMessagesAsRead(
          userId,
          unreadMessageIds,
          userType,
          chatType
        )
          .then(() => {
            // Update local state to reflect read status
            setMessages((prev) =>
              prev.map((msg) =>
                unreadMessageIds.includes(msg.id)
                  ? {
                      ...msg,
                      readBy: {
                        ...(typeof msg.readBy === "object" &&
                        msg.readBy !== null &&
                        !Array.isArray(msg.readBy)
                          ? msg.readBy
                          : {}),
                        [userType]: {
                          isRead: true,
                          readAt: new Date().toISOString(),
                        },
                      },
                    }
                  : msg
              )
            );

            // Clear unread count in ChatUnreadContext
            console.log(
              "📊 Messages marked as read, clearing unread count for",
              chatType
            );
            clearUnread(chatType);
            setHasUnreadMessages(false);
          })
          .catch((error) => {
            console.log("Error marking messages as read:", error);
          });
      }
    }
  }, [
    visible,
    messages,
    userId,
    userType,
    onUnreadChange,
    chatType,
    clearUnread,
  ]);

  // Track unread messages and notify parent component
  useEffect(() => {
    console.log(
      "📊 Unread tracking effect - visible:",
      visible,
      "| messages count:",
      messages.length,
      "| chatType:",
      chatType
    );
    if (!visible) {
      // When chat is not visible, check if there are unread messages
      const unreadMessages = messages.filter(
        (msg) => msg.sender === "support" && !msg.readBy?.[userType]?.isRead
      );

      console.log(
        "📊 Chat NOT visible - unreadMessages count:",
        unreadMessages.length,
        "| chatType:",
        chatType
      );

      if (unreadMessages.length > 0 && !hasUnreadMessages) {
        console.log(
          "📊 New unread messages detected! Setting hasUnreadMessages to TRUE | chatType:",
          chatType
        );
        setHasUnreadMessages(true);
      } else if (unreadMessages.length === 0 && hasUnreadMessages) {
        console.log("📊 No more unread messages - clearing status");
        setHasUnreadMessages(false);
      }
    } else {
      // When chat becomes visible, clear unread status immediately
      console.log(
        "📊 Chat IS visible - clearing unread status immediately | chatType:",
        chatType
      );
      setHasUnreadMessages(false);
    }
  }, [visible, messages, userType, onUnreadChange, chatType]); // Removed hasUnreadMessages to prevent infinite loop

  // Subscribe to real-time chat updates via WebSocket
  useEffect(() => {
    // Keep socket connected even when chat is not visible (to receive notifications)
    if (!userId) {
      console.log("⚠️ No userId, skipping socket subscription");
      return;
    }

    console.log(
      "🔌 Setting up WebSocket subscription for user:",
      userId,
      "| Chat visible:",
      visible
    );

    const handleNewMessage = (data) => {
      console.log("Received new message via WebSocket:", data);

      // Ignore read receipt notifications completely
      if (data.type === "read_receipt") {
        console.log("🔕 Ignoring read receipt (disabled)");
        return;
      }

      // Extract the actual message from the nested structure
      const message = data.message || data;

      // Validate message has content
      const messageContent = message.content || message.text || "";
      if (!messageContent.trim()) {
        console.warn("Received empty message, ignoring:", data);
        return;
      }

      // Validate message has ID
      const messageId = message._id || message.id;
      if (!messageId) {
        console.warn("Received message without ID, ignoring:", data);
        return;
      }

      // CRITICAL: Filter messages by chat type to prevent showing in wrong chat
      // Admin chat should only receive admin messages
      // Mortgage-broker chat should only receive mortgage-broker messages
      if (chatType === "admin" && message.sender === "mortgage-broker") {
        console.log(
          "🚫 Ignoring mortgage-broker message in admin chat:",
          messageId
        );
        return;
      }
      if (chatType === "mortgage-broker" && message.sender === "admin") {
        console.log(
          "🚫 Ignoring admin message in mortgage-broker chat:",
          messageId
        );
        return;
      }

      console.log(
        "Processing message - ID:",
        messageId,
        "SenderId:",
        message.senderId,
        "CurrentUserId:",
        userId,
        "OriginalSender:",
        message.sender,
        "ChatType:",
        chatType
      );

      // Check if message already exists to prevent duplicates
      setMessages((prevMessages) => {
        // Check for exact ID match
        const existingMessageById = prevMessages.find(
          (msg) => msg.id === messageId
        );

        if (existingMessageById) {
          console.log(
            "Message already exists by ID, updating status:",
            messageId
          );
          // Update existing message with server data (like read status)
          return prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: "delivered",
                  readBy: message.readBy || msg.readBy,
                  timestamp: message.createdAt
                    ? new Date(message.createdAt)
                    : msg.timestamp,
                }
              : msg
          );
        }

        // Check for content and timestamp match for recently sent messages (only if from current user)
        if (message.senderId === userId) {
          const recentMessage = prevMessages.find(
            (msg) =>
              msg.text === messageContent &&
              msg.sender === "user" &&
              (msg.status === "sending" || msg.status === "sent") &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(
                    message.createdAt || message.timestamp || new Date()
                  ).getTime()
              ) < 10000 // Within 10 seconds
          );

          if (recentMessage) {
            console.log(
              "Found matching recent message from current user, updating with server data:",
              messageContent.substring(0, 20)
            );
            return prevMessages.map((msg) =>
              msg === recentMessage
                ? {
                    ...msg,
                    id: messageId, // Update with server ID
                    status: "delivered",
                    readBy: message.readBy,
                    timestamp: message.createdAt
                      ? new Date(message.createdAt)
                      : msg.timestamp,
                    originalSender: message.sender,
                    senderId: message.senderId,
                  }
                : msg
            );
          }
        }

        // Transform the message to component format
        let timestamp = new Date();
        if (message.createdAt || message.timestamp) {
          const dateString = message.createdAt || message.timestamp;
          const dateFromMessage = new Date(dateString);

          // Validate the date is actually valid
          if (
            !isNaN(dateFromMessage.getTime()) &&
            dateFromMessage.getFullYear() > 1970
          ) {
            timestamp = dateFromMessage;
          } else {
            console.warn(
              "Invalid date received, using current time:",
              dateString
            );
          }
        }

        // Determine the correct sender based on message data
        let messageSender = "user"; // default

        // Check if message is from admin/support
        if (
          message.sender === "admin" ||
          message.sender === "support" ||
          message.sender === "mortgage-broker"
        ) {
          messageSender = "support";
        }
        // Check if message is from current user based on senderId
        else if (message.senderId && message.senderId === userId) {
          messageSender = "user";
        }
        // Check if message is from different user/client (in chat context, non-current user would be support)
        else if (message.senderId && message.senderId !== userId) {
          // If it's from a different client or admin, treat as support
          messageSender = "support";
        }
        // Fallback: if no senderId but sender is "client", assume it's current user
        else if (message.sender === "client") {
          messageSender = "user";
        }
        // Final fallback: admin messages are support, others are user
        else {
          messageSender = message.sender === "admin" ? "support" : "user";
        }

        console.log(
          "Determined sender:",
          messageSender,
          "for message from:",
          message.sender,
          "senderId:",
          message.senderId
        );

        const transformedMessage = {
          id: messageId,
          text: messageContent,
          sender: messageSender,
          timestamp: timestamp,
          status: "delivered",
          messageType: message.messageType || "text",
          isDeleted: message.isDeleted || false,
          readBy: message.readBy,
          replyTo: message.replyTo,
          senderId: message.senderId,
          originalSender: message.sender,
        };

        console.log("Adding new message to state:", transformedMessage);
        console.log("Current messages count:", prevMessages.length);
        const newMessages = [...prevMessages, transformedMessage];
        console.log("New messages count:", newMessages.length);

        // If it's a support message and chat is visible, mark it as read immediately
        if (transformedMessage.sender === "support" && visible) {
          setTimeout(() => {
            ChatService.markMessagesAsRead(
              userId,
              [transformedMessage.id],
              userType
            )
              .then(() => {
                console.log(
                  "Marked new message as read:",
                  transformedMessage.id
                );
                // Update the message in state to reflect read status
                setMessages((currentMessages) =>
                  currentMessages.map((msg) =>
                    msg.id === transformedMessage.id
                      ? {
                          ...msg,
                          readBy: {
                            ...(typeof msg.readBy === "object" &&
                            msg.readBy !== null &&
                            !Array.isArray(msg.readBy)
                              ? msg.readBy
                              : {}),
                            [userType]: {
                              isRead: true,
                              readAt: new Date().toISOString(),
                            },
                          },
                        }
                      : msg
                  )
                );

                // Explicitly clear unread badge since message was read immediately
                console.log("📊 New message read immediately, clearing badge");
                setHasUnreadMessages(false);
              })
              .catch((error) => {
                console.error("Error marking new message as read:", error);
              });
          }, 100);
        }

        return newMessages;
      });

      // If it's a support message, play notification sound
      console.log(
        "🔔 MESSAGE RECEIVED - Sender:",
        transformedMessage.sender,
        "| Visible:",
        visible
      );
      if (transformedMessage.sender === "support") {
        console.log(
          "🔊 SUPPORT MESSAGE DETECTED! Attempting to play notification sound..."
        );
        playNotificationSound();
      } else {
        console.log("⏭️ Not a support message, skipping notification sound");
      }
    };

    const handleTypingIndicator = (
      isTyping,
      fromUserId,
      fromChatId,
      fromUserType
    ) => {
      console.log(
        `User ${fromUserId} (type: ${fromUserType}) is ${
          isTyping ? "typing" : "not typing"
        } in chat ${fromChatId}`
      );

      // Determine if this typing event is for the current chat type
      // Admin users typing -> show in "admin" chat
      // Mortgage broker (sub-admin) users typing -> show in "mortgage-broker" chat
      let typingChatType = null;
      if (fromUserType === "admin") {
        typingChatType = "admin";
      } else if (
        fromUserType === "sub-admin" ||
        fromUserType === "mortgage-broker"
      ) {
        typingChatType = "mortgage-broker";
      }

      // Only show typing if it's for the current chat type
      if (fromUserId !== userId && typingChatType === chatType) {
        console.log(
          `✅ Showing typing indicator for ${typingChatType} chat (current: ${chatType})`
        );
        setIsTyping(isTyping);

        // Auto-scroll when typing indicator appears
        if (isTyping) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } else if (typingChatType !== chatType) {
        console.log(
          `⏭️ Ignoring typing indicator from ${typingChatType} (current chat: ${chatType})`
        );
      }
    };

    let wsConnection = null;

    const handleConnectionChange = (connected) => {
      console.log("Socket.IO connection status changed:", connected);
      setWsConnected(connected);
      setConnectionStatus(connected ? "connected" : "connecting");
    };

    try {
      wsConnection = ChatService.subscribeToChat(
        userId,
        handleNewMessage,
        handleTypingIndicator,
        handleConnectionChange,
        userType
      );

      // Store connection reference for later use
      wsConnectionRef.current = wsConnection;
    } catch (error) {
      console.error("Error setting up Socket.IO connection:", error);
      setConnectionStatus("error");
    }

    // Cleanup function
    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send final typing stop if user was typing
      if (isTypingRef.current && wsConnection && currentChatId) {
        wsConnection.stopTyping(currentChatId);
        isTypingRef.current = false;
      }

      if (wsConnection) {
        console.log("🔌 Disconnecting Socket.IO connection");
        if (typeof wsConnection.disconnect === "function") {
          wsConnection.disconnect();
        } else if (wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.close();
        }
      }
      // Clear the reference
      wsConnectionRef.current = null;
      setCurrentChatId(null);
    };
  }, [userId]); // Removed 'visible' - keep socket connected even when chat is not visible

  // Track if user is at bottom before auto-scrolling
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    // Only auto-scroll if user is already at bottom and we have new messages
    if (messages.length > lastMessageCountRef.current && isAtBottom) {
      console.log(
        "Auto-scrolling to bottom. New messages:",
        messages.length - lastMessageCountRef.current
      );
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false }); // Use non-animated for smoother experience
      }, 50); // Reduced delay for faster response
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, isAtBottom]);

  // Debug: Track messages changes
  useEffect(() => {
    // console.log("=== Messages State Updated ===");
    // console.log("Messages count:", messages.length);
    // console.log("Last 3 messages:", messages.slice(-3));

    messages.forEach((msg, index) => {
      if (!msg.text || !msg.text.trim()) {
        console.warn(`Empty message at index ${index}:`, msg);
      }
    });

    const validMessages = messages.filter(
      (msg) => msg && msg.text && msg.text.trim() && msg.id
    );
    // console.log("Valid messages count:", validMessages.length);
    // console.log("=== End Messages Debug ===");
  }, [messages]);

  // Scroll to bottom when chat becomes visible with messages
  useEffect(() => {
    if (visible && messages.length > 0 && !loading) {
      console.log("📜 Chat visible with messages, scrolling to bottom...");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 300);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 600);
    }
  }, [visible, messages.length, loading]);

  // Handle keyboard events for better UX
  useEffect(() => {
    if (!visible) return;

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        console.log("Keyboard appeared, scrolling to bottom");
        // Multiple scroll attempts when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 300);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        console.log("Keyboard hidden, scrolling to bottom");
        // Scroll to bottom when keyboard closes to prevent messages sticking at top
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 200);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [visible]);

  // Handle typing indicator changes
  useEffect(() => {
    if (isTyping) {
      // When typing starts, scroll to show indicator
      console.log("Typing indicator appeared, scrolling to show it");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [isTyping]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending || !userId) return;

    const messageText = inputText.trim();
    if (!messageText) return; // Double check for empty message

    setInputText("");
    setSending(true);

    // Stop typing indicator when message is sent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    handleTypingStop();

    // Create user message for immediate UI feedback
    const tempId = `temp_${Date.now()}`;
    const userMessage = {
      id: tempId,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      console.log(
        "Sending message:",
        messageText,
        "for user:",
        userId,
        "userType:",
        userType,
        "chatType:",
        chatType
      );

      // Send message via appropriate API endpoint
      let response;
      if (userType === "realtor") {
        // Realtors always chat with admin, use legacy endpoint
        response = await ChatService.sendMessage(userId, messageText, userType);
      } else {
        // Clients can chat with admin or mortgage-broker, use unified endpoint
        response = await ChatService.sendMessageByType(
          userId,
          messageText,
          chatType
        );
      }

      console.log("Message sent successfully:", response);

      // Update message with server response - only if we have a valid response
      if (response && (response.id || response._id)) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.id || response._id,
                  status: "sent",
                  timestamp: response.createdAt
                    ? new Date(response.createdAt)
                    : msg.timestamp,
                }
              : msg
          )
        );
      } else {
        // If no valid response, just update status to sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "sent" } : msg
          )
        );
      }

      // For new clients, after first message is sent, ensure WebSocket rejoins the chat
      if (messages.length === 1) {
        // If this was the first message (welcome + this message)
        console.log(
          "First message sent for new client, ensuring WebSocket connection"
        );
        const sentMessageId = response && (response.id || response._id);

        setTimeout(() => {
          // Trigger WebSocket to rejoin chats
          if (
            wsConnectionRef.current &&
            typeof wsConnectionRef.current.rejoinChats === "function"
          ) {
            console.log("Rejoining chats after first message for new client");
            wsConnectionRef.current.rejoinChats((data) => {
              // Callback triggered when rejoin is successful
              console.log(
                "WebSocket successfully rejoined, updating message status to delivered"
              );

              // Update the sent message to delivered status immediately
              if (sentMessageId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === sentMessageId
                      ? { ...msg, status: "delivered" }
                      : msg
                  )
                );
              }

              // Only refresh if the message status wasn't updated successfully
              setTimeout(() => {
                setMessages((currentMessages) => {
                  const messageStillSent = currentMessages.find(
                    (msg) => msg.id === sentMessageId && msg.status === "sent"
                  );

                  if (messageStillSent) {
                    console.log(
                      "Message still shows 'sent' status, doing backup refresh"
                    );
                    loadMessages(1, false);
                  } else {
                    console.log(
                      "Message status updated successfully, skipping backup refresh"
                    );
                  }

                  return currentMessages; // No change to messages
                });
              }, 1000);
            });

            // Fallback: refresh anyway after 3 seconds if callback didn't fire
            setTimeout(() => {
              console.log("Fallback refresh after first message");
              loadMessages(1, false);
            }, 3000);
          }
        }, 1000);
      }

      // Refocus input after sending
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);

      // Note: In a real chat system, support responses would come via WebSocket
      // Keeping auto-response for now until you implement real-time support responses
    } catch (error) {
      console.error("Error sending message:", error);

      // Handle specific mortgage broker errors
      if (chatType === "mortgage-broker" && error.message.includes("404")) {
        // Replace the failed message with a helpful system message
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== tempId),
          {
            id: "broker-not-available",
            text: "Your mortgage broker is not available right now. They will be assigned during your application process. For immediate help, please use General Support.",
            sender: "support",
            timestamp: new Date(),
            status: "delivered",
          },
        ]);
      } else {
        // Update message status to failed for other errors
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg
          )
        );
      }
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const getAutoResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("document") || lowerMessage.includes("upload")) {
      return "I can help you with document uploads! You can upload documents directly from your home screen by tapping the 'Add' button next to each required document.";
    } else if (
      lowerMessage.includes("status") ||
      lowerMessage.includes("approval")
    ) {
      return "Let me check on your application status for you. Your application is currently being processed and we'll update you as soon as we have more information.";
    } else if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("support")
    ) {
      return "I'm here to help! You can ask me about document uploads, application status, or any other questions about your mortgage process.";
    } else {
      return "Thank you for your message! Our support team will get back to you shortly. Is there anything else I can help you with?";
    }
  };

  const onRefresh = async () => {
    if (refreshing || isRefreshingRef.current) return;

    setRefreshing(true);
    isRefreshingRef.current = true;

    try {
      console.log("Fetching new messages from bottom pull...");

      // Get the latest message ID to fetch only newer messages
      const latestMessageId =
        messages.length > 0 ? messages[messages.length - 1].id : null;

      let response;
      if (userType === "realtor") {
        // Realtors always chat with admin, use legacy endpoint
        response = await ChatService.getMessages(userId, 50, 1, userType);
      } else {
        // Clients can chat with admin or mortgage-broker, use unified endpoint
        response = await ChatService.getMessagesByType(userId, chatType, 50, 1);
      }

      const apiMessages = response.messages || [];

      // Transform API messages
      const transformedMessages = apiMessages
        .filter((msg) => {
          const hasContent = msg.content && msg.content.trim();
          const hasId = msg._id;
          if (!hasContent || !hasId) return false;
          return true;
        })
        .map((msg) => {
          const isFromSupport =
            msg.sender === "admin" ||
            msg.sender === "mortgage-broker" ||
            msg.sender === "sub-admin";
          const isFromUser =
            msg.sender === "client" || msg.sender === "realtor";
          const isRead = msg.readBy?.[userType]?.isRead || false;

          let timestamp = new Date();
          if (msg.createdAt) {
            const dateFromAPI = new Date(msg.createdAt);
            if (
              !isNaN(dateFromAPI.getTime()) &&
              dateFromAPI.getFullYear() > 1970
            ) {
              timestamp = dateFromAPI;
            }
          }

          return {
            id: msg._id,
            text: msg.content.trim(),
            sender: isFromSupport ? "support" : "user",
            timestamp: timestamp,
            status: isFromUser ? (isRead ? "delivered" : "sent") : "delivered",
            messageType: msg.messageType || "text",
            isDeleted: msg.isDeleted || false,
            readBy: msg.readBy,
            replyTo: msg.replyTo,
            senderId: msg.senderId,
            originalSender: msg.sender,
          };
        });

      // Only add new messages that don't exist in current state
      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((msg) => msg.id));
        const newMessages = transformedMessages.filter(
          (msg) => !existingIds.has(msg.id)
        );

        if (newMessages.length > 0) {
          console.log(
            `Found ${newMessages.length} new messages, appending to bottom`
          );
          // Append new messages at the end
          return [...prevMessages, ...newMessages];
        } else {
          console.log("No new messages found");
          return prevMessages;
        }
      });

      // Smooth scroll to bottom after adding new messages
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 150);
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (!pagination || !pagination.hasMore || loadingMore) return;

    const nextPage = pagination.currentPage + 1;
    await loadMessages(nextPage, true);
  };

  const retryMessage = async (messageId) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (!message || !userId) return;

    // Update message status to sending
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "sending" } : msg
      )
    );

    try {
      console.log("Retrying message:", message.text, "for user:", userId);

      // Use unified endpoint with chatType
      const response = await ChatService.sendMessageByType(
        userId,
        message.text,
        chatType
      );
      console.log("Message retry successful:", response);

      // Update message with server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                id: response.id || response._id || messageId,
                status: "sent",
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error retrying message:", error);
      // Update message status back to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "failed" } : msg
        )
      );
      Alert.alert("Error", "Failed to resend message. Please try again.");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn("Invalid timestamp:", timestamp);
      return "";
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeString = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today - ${timeString}`;
    } else if (isYesterday) {
      return `Yesterday - ${timeString}`;
    } else {
      const dayName = date.toLocaleDateString([], { weekday: "short" });
      return `${dayName} - ${timeString}`;
    }
  };

  const renderMessage = (message) => {
    // Don't render messages without content
    if (!message.text || !message.text.trim()) {
      console.warn("Attempting to render message without content:", message);
      return null;
    }

    const isUser = message.sender === "user";
    const isSupport = message.sender === "support";

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.supportMessageContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {isSupport && (
          <View style={styles.supportAvatar}>
            {chatType === "mortgage-broker" ? (
              supportAvatar ? (
                <Image
                  source={{ uri: supportAvatar }}
                  style={styles.supportAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="home" size={20} color={COLORS.white} />
              )
            ) : (
              <Image
                source={roostLogoImage}
                style={styles.supportAvatarImage}
                resizeMode="contain"
              />
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.supportBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.supportMessageText,
            ]}
          >
            {message.text}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.supportTimestamp,
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>

            {isUser && (
              <View style={styles.messageStatus}>
                {message.status === "sending" && (
                  <ActivityIndicator size="small" color={COLORS.slate} />
                )}
                {message.status === "sent" && (
                  <Ionicons name="checkmark" size={14} color={COLORS.slate} />
                )}
                {message.status === "delivered" && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={COLORS.slate}
                  />
                )}
                {message.status === "failed" && (
                  <TouchableOpacity
                    onPress={() => retryMessage(message.id)}
                    style={styles.retryButton}
                  >
                    <Ionicons name="refresh" size={14} color={COLORS.red} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {generateInitials(
                displayName.split(" ")[0],
                displayName.split(" ")[1]
              )}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.supportMessageContainer]}>
        <View style={styles.supportAvatar}>
          {chatType === "mortgage-broker" ? (
            supportAvatar ? (
              <Image
                source={{ uri: supportAvatar }}
                style={styles.supportAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="home" size={20} color={COLORS.white} />
            )
          ) : (
            <Image
              source={roostLogoImage}
              style={styles.supportAvatarImage}
              resizeMode="contain"
            />
          )}
        </View>
        <View
          style={[
            styles.messageBubble,
            styles.supportBubble,
            styles.typingBubble,
          ]}
        >
          <TypingIndicator visible={isTyping} />
        </View>
      </View>
    );
  };

  // Always render to keep socket connected, but conditionally show modal
  const chatContent = (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            {chatType === "mortgage-broker" ? (
              supportAvatar ? (
                <Image
                  source={{ uri: supportAvatar }}
                  style={styles.headerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="business"
                  size={18}
                  color={COLORS.white}
                  style={styles.headerIcon}
                />
              )
            ) : (
              <Ionicons
                name="headset"
                size={18}
                color={COLORS.white}
                style={styles.headerIcon}
              />
            )}
            <Text style={styles.headerTitle}>
              {chatType === "mortgage-broker"
                ? supportName || "Mortgage Broker"
                : "General Support"}
            </Text>
          </View>
          {/* <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    wsConnected && connectionStatus === "connected"
                      ? COLORS.onlineIndicator
                      : connectionStatus === "error"
                      ? COLORS.red
                      : COLORS.gray,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {wsConnected && connectionStatus === "connected"
                ? "Online"
                : connectionStatus === "error"
                ? "Connection Error"
                : "Connecting..."}
            </Text>
          </View> */}
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Svg
            width="32"
            height="32"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              d="M13 0C5.82075 0 0 5.8201 0 13C0 20.1799 5.8201 26 13 26C20.1799 26 26 20.1799 26 13C26 5.8201 20.1799 0 13 0ZM13 24.401C6.7275 24.401 1.625 19.2725 1.625 13C1.625 6.7275 6.7275 1.625 13 1.625C19.2725 1.625 24.375 6.7275 24.375 13C24.375 19.2725 19.2725 24.401 13 24.401ZM17.5961 8.4045C17.2793 8.08763 16.7648 8.08763 16.4473 8.4045L13.0007 11.8511L9.55402 8.4045C9.23715 8.08763 8.72202 8.08763 8.4045 8.4045C8.08698 8.72138 8.08763 9.2365 8.4045 9.55338L11.8511 13L8.4045 16.4466C8.08763 16.7635 8.08763 17.2786 8.4045 17.5955C8.72138 17.9124 9.2365 17.9124 9.55402 17.5955L13.0007 14.1489L16.4473 17.5955C16.7642 17.9124 17.2786 17.9124 17.5961 17.5955C17.9137 17.2786 17.913 16.7635 17.5961 16.4466L14.1495 13L17.5961 9.55338C17.914 9.23585 17.914 8.72138 17.5961 8.4045Z"
              fill="#797979"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <View style={styles.messagesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: isTyping ? 80 : 24 }, // Extra space when typing indicator is visible
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Scroll to bottom when content size changes (messages loaded)
              if (visible && !loading) {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: false });
                }, 50);
              }
            }}
            onLayout={() => {
              // Scroll to bottom when layout completes
              if (visible && messages.length > 0 && !loading) {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: false });
                }, 100);
              }
            }}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } =
                event.nativeEvent;
              const currentScrollY = contentOffset.y;
              const isScrolledToBottom =
                contentOffset.y + layoutMeasurement.height >=
                contentSize.height - 50;
              setIsAtBottom(isScrolledToBottom);

              // Detect pull from bottom (when scrolling down past the end)
              const distanceFromBottom =
                contentSize.height -
                (contentOffset.y + layoutMeasurement.height);

              // Only trigger refresh if:
              // 1. User has pulled down past the bottom (negative distance)
              // 2. Not already refreshing
              // 3. User is scrolling downward (pulling up)
              // 4. The pull is significant enough
              const isPullingUp = currentScrollY > lastScrollYRef.current;

              if (
                distanceFromBottom < -80 &&
                !refreshing &&
                !isRefreshingRef.current &&
                isPullingUp
              ) {
                console.log("Pull-to-refresh triggered from bottom");
                isRefreshingRef.current = true;
                onRefresh().finally(() => {
                  isRefreshingRef.current = false;
                });
              }

              lastScrollYRef.current = currentScrollY;
            }}
            scrollEventThrottle={16}
            bounces={true}
          >
            {/* Load More Button */}
            {pagination && pagination.hasMore && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreMessages}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.green} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More Messages</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {messages
              .filter((msg) => {
                const isValid = msg && msg.text && msg.text.trim() && msg.id;
                if (!isValid) {
                  console.warn("Filtering out invalid message in render:", msg);
                }
                return isValid;
              })
              .map((msg, index) => {
                // console.log(
                //   `Rendering message ${index}:`,
                //   msg.text?.substring(0, 20) + "..."
                // );
                return renderMessage(msg);
              })}
            {renderTypingIndicator()}
            {/* Extra spacer when typing to ensure visibility */}
            {isTyping && <View style={{ height: 20 }} />}

            {/* Bottom refresh indicator */}
            {refreshing && (
              <View style={styles.bottomRefreshContainer}>
                <ActivityIndicator size="small" color={COLORS.green} />
                <Text style={styles.bottomRefreshText}>
                  Loading new messages...
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.gray}
            multiline
            maxLength={500}
            returnKeyType="send"
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
            onContentSizeChange={() => {
              // Auto-scroll when text input grows
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.green} />
            ) : (
              <Svg
                width="26"
                height="26"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Path
                  d="M8.62808 11.1601L13.4742 6.31397M18.4316 3.35645L14.341 16.651C13.9744 17.8425 13.7909 18.4385 13.4748 18.636C13.2005 18.8074 12.8609 18.836 12.5623 18.7121C12.2178 18.5692 11.9383 18.0111 11.3807 16.8958L8.7897 11.7139C8.7012 11.5369 8.65691 11.4488 8.5978 11.3721C8.54535 11.304 8.48481 11.2427 8.41676 11.1903C8.34182 11.1325 8.25517 11.0892 8.08608 11.0046L2.89224 8.40772C1.77693 7.85006 1.21923 7.57098 1.07632 7.22656C0.95238 6.92787 0.980645 6.588 1.152 6.31375C1.34959 5.99751 1.94555 5.8138 3.13735 5.44709L16.4319 1.35645C17.3689 1.06815 17.8376 0.924119 18.154 1.0403C18.4297 1.1415 18.647 1.35861 18.7482 1.63428C18.8644 1.9506 18.7202 2.41904 18.4322 3.35506L18.4316 3.35645Z"
                  stroke="#4D4D4D"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </Svg>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.inputHint}>Messages are encrypted and secure</Text>
      </View>
    </KeyboardAvoidingView>
  );

  // Wrap in modal
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {chatContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9BB9B9",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 33,
    marginRight: 8,
    backgroundColor: COLORS.red, // Default red background while image loads
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FDFDFD",
    fontFamily: "Futura",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.white,
    fontFamily: "Futura",
  },
  closeButton: {
    backgroundColor: "#F4F4F4",
    borderRadius: 53,

    justifyContent: "center",
    alignItems: "center",
  },

  // Messages Styles
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
    fontFamily: "Futura",
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Message Bubble Styles
  messageContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  supportMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: screenWidth * 0.7,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: COLORS.white,
    borderBottomRightRadius: 4,
    marginRight: 12,
  },
  supportBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Futura",
  },
  userMessageText: {
    color: COLORS.black,
  },
  supportMessageText: {
    color: COLORS.black,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Futura",
    color: COLORS.slate,
  },
  userTimestamp: {
    color: COLORS.slate,
  },
  supportTimestamp: {
    color: COLORS.slate,
  },
  messageStatus: {
    marginLeft: 8,
  },
  retryButton: {
    padding: 2,
  },

  // Load More Styles
  loadMoreContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  loadMoreButton: {
    backgroundColor: COLORS.silver,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  loadMoreText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: "500",
    fontFamily: "Futura",
  },

  // Bottom Refresh Styles
  bottomRefreshContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  bottomRefreshText: {
    fontSize: 13,
    color: COLORS.green,
    fontFamily: "Futura",
  },

  // Avatar Styles
  supportAvatar: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 383,
    marginBottom: 2,
    overflow: "hidden",
  },
  supportAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 383, // Make it circular for profile pictures
    backgroundColor: COLORS.red, // Default red background while image loads
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 383, // Make it circular for profile pictures
    backgroundColor: COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  userAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },

  // Typing Indicator Styles
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Input Styles
  inputContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#797979",
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#797979",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.9,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.slate,
    textAlign: "center",
    marginTop: 12,
    fontFamily: "Futura",
  },
});

export default Chat;
