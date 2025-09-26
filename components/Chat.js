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
  SafeAreaView,
  Animated,
  Dimensions,
  RefreshControl,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useClient } from "../context/ClientContext";
import ChatService from "../services/ChatService";
import TypingIndicator from "./TypingIndicator";

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
  onlineIndicator: "#10B981",
};

const { width: screenWidth } = Dimensions.get("window");

const Chat = ({ visible, onClose, userId, userName = "User" }) => {
  const { auth } = useAuth();
  const { clientInfo } = useClient();

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

  const scrollViewRef = useRef(null);
  const wsConnectionRef = useRef(null);
  const textInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const clientFromContext = clientInfo || auth.client;
  const clientName = clientFromContext?.name || userName;

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
        append
      );
      const response = await ChatService.getMessages(userId, 50, page);
      console.log("Loaded messages response:", response);

      const apiMessages = response.messages || [];
      setPagination(response.pagination);

      // If no messages and this is initial load, show welcome message
      if (apiMessages.length === 0 && !append) {
        console.log(
          "No existing messages found, showing welcome message for new client"
        );
        setMessages([
          {
            id: "welcome",
            text: `Hello ${clientName}! Welcome to Roost Support. How can I help you today?`,
            sender: "support",
            timestamp: new Date(),
            status: "delivered",
          },
        ]);
        setConnectionStatus("connected");
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
          return true;
        })
        .map((msg) => {
          // Determine if message is from support (admin/realtor) or user (client)
          const isFromSupport =
            msg.sender === "admin" || msg.sender === "realtor";
          const isFromUser = msg.sender === "client";

          // Determine read status for the current user
          const isRead = msg.readBy?.client?.isRead || false;

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
        // For initial load or refresh, replace all messages
        setMessages(transformedMessages);
      }

      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error loading messages:", error);
      setConnectionStatus("error");

      // Set fallback welcome message only for initial load failures
      if (!append) {
        setMessages([
          {
            id: "welcome",
            text: `Hello ${clientName}! Welcome to Roost Support. How can I help you today?`,
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
  }, [visible, userId]);

  // Mark unread messages as read when chat becomes visible
  useEffect(() => {
    if (visible && messages.length > 0 && userId) {
      const unreadMessageIds = messages
        .filter(
          (msg) => msg.sender === "support" && !msg.readBy?.client?.isRead
        )
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        console.log("Marking messages as read:", unreadMessageIds);
        ChatService.markMessagesAsRead(userId, unreadMessageIds)
          .then(() => {
            // Update local state to reflect read status
            setMessages((prev) =>
              prev.map((msg) =>
                unreadMessageIds.includes(msg.id)
                  ? {
                      ...msg,
                      readBy: {
                        ...msg.readBy,
                        client: {
                          isRead: true,
                          readAt: new Date().toISOString(),
                        },
                      },
                    }
                  : msg
              )
            );
          })
          .catch((error) => {
            console.error("Error marking messages as read:", error);
          });
      }
    }
  }, [visible, messages, userId]);

  // Subscribe to real-time chat updates via WebSocket
  useEffect(() => {
    if (!visible || !userId) return;

    console.log("Setting up WebSocket subscription for user:", userId);

    const handleNewMessage = (data) => {
      console.log("Received new message via WebSocket:", data);

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

        // Also check for content and timestamp match for recently sent messages
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
            "Found matching recent message, updating with server data:",
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

        const transformedMessage = {
          id: messageId,
          text: messageContent,
          sender:
            message.sender === "admin" || message.sender === "realtor"
              ? "support"
              : "user",
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
            ChatService.markMessagesAsRead(userId, [transformedMessage.id])
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
                            ...msg.readBy,
                            client: {
                              isRead: true,
                              readAt: new Date().toISOString(),
                            },
                          },
                        }
                      : msg
                  )
                );
              })
              .catch((error) => {
                console.error("Error marking new message as read:", error);
              });
          }, 100);
        }

        return newMessages;
      });

      // If it's a support message, we might want to show a notification
      if (transformedMessage.sender === "support") {
        // You can add a notification sound or vibration here
        console.log("New support message received!");
      }
    };

    const handleTypingIndicator = (isTyping, fromUserId) => {
      console.log(
        `User ${fromUserId} is ${isTyping ? "typing" : "not typing"}`
      );
      // Only show typing for support messages
      if (fromUserId !== userId) {
        setIsTyping(isTyping);

        // Auto-scroll when typing indicator appears
        if (isTyping) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
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
        handleConnectionChange
      );

      // Store connection reference for later use
      wsConnectionRef.current = wsConnection;
    } catch (error) {
      console.error("Error setting up Socket.IO connection:", error);
      setConnectionStatus("error");
    }

    // Cleanup function
    return () => {
      if (wsConnection) {
        console.log("Disconnecting Socket.IO connection");
        if (typeof wsConnection.disconnect === "function") {
          wsConnection.disconnect();
        } else if (wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.close();
        }
      }
      // Clear the reference
      wsConnectionRef.current = null;
    };
  }, [visible, userId]);

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
    console.log("=== Messages State Updated ===");
    console.log("Messages count:", messages.length);
    console.log("Last 3 messages:", messages.slice(-3));

    messages.forEach((msg, index) => {
      if (!msg.text || !msg.text.trim()) {
        console.warn(`Empty message at index ${index}:`, msg);
      }
    });

    const validMessages = messages.filter(
      (msg) => msg && msg.text && msg.text.trim() && msg.id
    );
    console.log("Valid messages count:", validMessages.length);
    console.log("=== End Messages Debug ===");
  }, [messages]);

  // Handle keyboard events for better UX
  useEffect(() => {
    if (!visible) return;

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        console.log("Keyboard appeared, scrolling to bottom");
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        console.log("Keyboard hidden");
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
      console.log("Sending message:", messageText, "for user:", userId);

      // Send message via API
      const response = await ChatService.sendMessage(userId, messageText);
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

              // Also refresh messages as backup
              setTimeout(() => {
                loadMessages(1, false);
              }, 500);
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
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
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
    if (refreshing) return;

    setRefreshing(true);
    try {
      await loadMessages(1, false);
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
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

      const response = await ChatService.sendMessage(userId, message.text);
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

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
            {message.originalSender === "admin" ? (
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={COLORS.green}
              />
            ) : (
              <Ionicons name="headset-outline" size={16} color={COLORS.green} />
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
            <View style={styles.timestampContainer}>
              <Text
                style={[
                  styles.timestamp,
                  isUser ? styles.userTimestamp : styles.supportTimestamp,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
              {isSupport && message.originalSender && (
                <Text style={styles.senderLabel}>
                  {message.originalSender === "admin" ? "Admin" : "Support"}
                </Text>
              )}
            </View>

            {isUser && (
              <View style={styles.messageStatus}>
                {message.status === "sending" && (
                  <ActivityIndicator size="small" color={COLORS.white} />
                )}
                {message.status === "sent" && (
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                )}
                {message.status === "delivered" && (
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color={COLORS.white}
                  />
                )}
                {message.status === "failed" && (
                  <TouchableOpacity
                    onPress={() => retryMessage(message.id)}
                    style={styles.retryButton}
                  >
                    <Ionicons name="refresh" size={12} color={COLORS.red} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {clientName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
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
          <Ionicons name="headset-outline" size={16} color={COLORS.green} />
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

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Roost Support</Text>
            <View style={styles.statusContainer}>
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
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              console.log(
                "🧪 Manual WebSocket test triggered for user:",
                userId
              );
              ChatService.testWebSocket(userId);
            }}
          >
            <Ionicons
              name="wifi"
              size={20}
              color={wsConnected ? COLORS.onlineIndicator : COLORS.white}
            />
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
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } =
                  event.nativeEvent;
                const isScrolledToBottom =
                  contentOffset.y + layoutMeasurement.height >=
                  contentSize.height - 50;
                setIsAtBottom(isScrolledToBottom);
              }}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.green}
                  colors={[COLORS.green]}
                />
              }
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
                      <Text style={styles.loadMoreText}>
                        Load More Messages
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {messages
                .filter((msg) => {
                  const isValid = msg && msg.text && msg.text.trim() && msg.id;
                  if (!isValid) {
                    console.warn(
                      "Filtering out invalid message in render:",
                      msg
                    );
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
              onChangeText={setInputText}
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
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? COLORS.white : COLORS.gray}
                />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.inputHint}>
            Messages are encrypted and secure
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    fontFamily: "Futura",
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    fontFamily: "Futura",
  },
  moreButton: {
    padding: 8,
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
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  supportMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  supportBubble: {
    backgroundColor: COLORS.supportBubble,
    borderBottomLeftRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Futura",
  },
  userMessageText: {
    color: COLORS.white,
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
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "Futura",
  },
  userTimestamp: {
    color: COLORS.white,
    opacity: 0.7,
  },
  supportTimestamp: {
    color: COLORS.timestampColor,
  },
  senderLabel: {
    fontSize: 10,
    fontFamily: "Futura",
    color: COLORS.green,
    fontWeight: "600",
    backgroundColor: COLORS.coloredBgFill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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

  // Avatar Styles
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  userAvatarText: {
    color: COLORS.white,
    fontSize: 12,
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
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    elevation: 8, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Futura",
    color: COLORS.black,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.silver,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.timestampColor,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Futura",
  },
});

export default Chat;
