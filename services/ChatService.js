// services/ChatService.js
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

class ChatService {
  constructor() {
    this.baseUrl = "https://signup.roostapp.io"; // Updated with your actual API base URL
  }

  /**
   * Get authentication headers with access token
   */
  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (e) {
      console.warn("Failed to read accessToken from storage", e);
    }
    return { "Content-Type": "application/json" };
  }

  /**
   * Fetch chat messages for a user
   * @param {string} userId - The user ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} page - Page number for pagination
   * @param {string} userType - Type of user ('client' or 'realtor')
   * @returns {Promise} - Promise resolving to messages array
   */
  async getMessages(userId, limit = 50, page = 1, userType = "client") {
    try {
      const endpoint = userType === "realtor" ? "realtor" : "client";
      let url = `${this.baseUrl}/${endpoint}/chat/${userId}/messages?limit=${limit}&page=${page}`;
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 404 is expected for new clients with no chat history
          console.log(
            `No chat history found for user ${userId} - returning empty messages`
          );
          return {
            messages: [],
            pagination: null,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        messages: data.messages || [],
        pagination: data.pagination || null,
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  /**
   * Send a new message
   * @param {string} userId - The user ID
   * @param {string} message - The message text
   * @param {string} userType - Type of user ('client' or 'realtor')
   * @returns {Promise} - Promise resolving to the sent message
   */
  async sendMessage(userId, message, userType = "client") {
    try {
      const headers = await this.getAuthHeaders();
      const endpoint = userType === "realtor" ? "realtor" : "client";

      const response = await fetch(
        `${this.baseUrl}/${endpoint}/chat/${userId}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param {string} userId - The user ID
   * @param {string[]} messageIds - Array of message IDs to mark as read
   * @param {string} userType - Type of user ('client' or 'realtor')
   * @returns {Promise} - Promise resolving to success status
   */
  async markMessagesAsRead(userId, messageIds, userType = "client") {
    try {
      const headers = await this.getAuthHeaders();
      const endpoint = userType === "realtor" ? "realtor" : "client";

      const response = await fetch(
        `${this.baseUrl}/${endpoint}/chat/${userId}/read`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            messageIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log("Error marking messages as read:", error);
      throw error;
    }
  }

  /**
   * Get unread message count
   * @param {string} userId - The user ID
   * @returns {Promise} - Promise resolving to unread count
   */
  async getUnreadCount(userId) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/chat/${userId}/unread-count`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  /**
   * Get or create mortgage broker chat
   * @param {string} userId - The client user ID
   * @returns {Promise} - Promise resolving to chat data
   */
  async getMortgageBrokerChat(userId) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/client/mortgage-broker-chat/${userId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching mortgage broker chat:", error);
      throw error;
    }
  }

  /**
   * Get mortgage broker chat messages
   * @param {string} userId - The client user ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} page - Page number for pagination
   * @returns {Promise} - Promise resolving to messages array
   */
  async getMortgageBrokerMessages(userId, limit = 50, page = 1) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/client/mortgage-broker-chat/${userId}/messages?limit=${limit}&page=${page}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            messages: [],
            pagination: null,
            available: false,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        messages: data.messages || [],
        pagination: data.pagination || null,
        available: data.available !== false,
        chat: data.chat,
      };
    } catch (error) {
      console.error("Error fetching mortgage broker messages:", error);
      throw error;
    }
  }

  /**
   * Send message to mortgage broker
   * @param {string} userId - The client user ID
   * @param {string} message - The message text
   * @returns {Promise} - Promise resolving to the sent message
   */
  async sendMortgageBrokerMessage(userId, message) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/client/mortgage-broker-message/${userId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || data;
    } catch (error) {
      console.error("Error sending mortgage broker message:", error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time chat updates (WebSocket)
   * @param {string} userId - The user ID
   * @param {function} onMessage - Callback for new messages
   * @param {function} onTyping - Callback for typing indicators
   * @returns {WebSocket} - WebSocket connection
   */
  /**
   * Subscribe to real-time chat updates using Socket.IO
   */
  subscribeToChat(
    userId,
    onMessage,
    onTyping,
    onConnectionChange,
    userType = "client"
  ) {
    console.log(
      "🔌 Setting up Socket.IO connection for user:",
      userId,
      "userType:",
      userType
    );

    const socket = io(this.baseUrl, {
      auth: {
        userType: userType,
        userId: userId,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected:", socket.id);
      if (onConnectionChange) onConnectionChange(true);

      // Join chats automatically (may be empty for new clients, but still attempt)
      console.log("🏠 Attempting to join chats for user:", userId);
      socket.emit("join_chats");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
      if (onConnectionChange) onConnectionChange(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      if (onConnectionChange) onConnectionChange(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("� Socket.IO reconnected after", attemptNumber, "attempts");
      if (onConnectionChange) onConnectionChange(true);
    });

    socket.on("reconnect_error", (error) => {
      console.error("❌ Socket.IO reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket.IO reconnection failed");
      if (onConnectionChange) onConnectionChange(false);
    });

    // Listen for new messages
    socket.on("new_message", (message) => {
      console.log("💬 New message received:", message);
      onMessage(message);
    });

    // Listen for typing indicators
    socket.on("user_typing", (data) => {
      console.log("⌨️ Typing indicator:", data);
      if (data.user.id !== userId) {
        onTyping(data.isTyping, data.user.id);
      }
    });

    // Listen for successful chat joining
    socket.on("joined_chats", (data) => {
      console.log("🏠 Joined chats:", data);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log(
          "📝 No existing chats found for user - this is normal for new users"
        );
      }
    });

    socket.on("joined_chat", (data) => {
      console.log("🏠 Joined specific chat:", data);
    });

    socket.on("left_chat", (data) => {
      console.log("🚪 Left chat:", data);
    });

    // Handle case where joining chats fails (no chats exist yet)
    socket.on("join_chats_error", (error) => {
      console.log("⚠️ Could not join chats (likely new user):", error);
    });

    // Listen for user status changes
    socket.on("user_status_change", (data) => {
      console.log("👤 User status change:", data);
    });

    // Listen for errors
    socket.on("error", (error) => {
      console.error("❌ Socket.IO error:", error);
    });

    // Add custom methods for your backend events
    socket.joinChat = (chatId) => {
      console.log("🏠 Joining chat:", chatId);
      socket.emit("join_chat", { chatId });
    };

    socket.leaveChat = (chatId) => {
      console.log("🚪 Leaving chat:", chatId);
      socket.emit("leave_chat", { chatId });
    };

    socket.startTyping = (chatId) => {
      console.log("⌨️ Start typing in chat:", chatId);
      socket.emit("typing_start", { chatId });
    };

    socket.stopTyping = (chatId) => {
      console.log("⌨️ Stop typing in chat:", chatId);
      socket.emit("typing_stop", { chatId });
    };

    socket.setOnline = () => {
      console.log("🟢 Setting user online");
      socket.emit("user_online");
    };

    socket.rejoinChats = (onSuccess) => {
      console.log("🔄 Manually rejoining chats for user:", userId);

      // Set up one-time listener for successful join
      if (onSuccess && typeof onSuccess === "function") {
        const handleJoinSuccess = (data) => {
          console.log("✅ Successfully rejoined chats, triggering callback");
          socket.off("joined_chats", handleJoinSuccess); // Remove listener
          onSuccess(data);
        };
        socket.once("joined_chats", handleJoinSuccess);
      }

      socket.emit("join_chats");
    };

    return socket;
  }

  // Mock implementation removed - now using real Socket.IO

  /**
   * Initialize real Socket.IO connection (to be implemented)
   * Install: npm install socket.io-client
   */
  createRealSocketConnection(userId, onMessage, onTyping, onConnectionChange) {
    const socket = io(this.baseUrl, {
      auth: {
        userType: "client",
        userId: userId,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected:", socket.id);
      if (onConnectionChange) onConnectionChange(true);

      // Join chats automatically
      socket.emit("join_chats");
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket.IO disconnected");
      if (onConnectionChange) onConnectionChange(false);
    });

    socket.on("new_message", (message) => {
      console.log("💬 New message received:", message);
      onMessage(message);
    });

    socket.on("user_typing", (data) => {
      console.log("⌨️ Typing indicator:", data);
      if (data.user.id !== userId) {
        onTyping(data.isTyping, data.user.id);
      }
    });

    socket.on("joined_chats", (data) => {
      console.log("🏠 Joined chats:", data);
    });

    socket.on("error", (error) => {
      console.error("❌ Socket.IO error:", error);
    });

    // Add custom methods
    socket.joinChat = (chatId) => {
      socket.emit("join_chat", { chatId });
    };

    socket.leaveChat = (chatId) => {
      socket.emit("leave_chat", { chatId });
    };

    socket.startTyping = (chatId) => {
      socket.emit("typing_start", { chatId });
    };

    socket.stopTyping = (chatId) => {
      socket.emit("typing_stop", { chatId });
    };

    return socket;
  }

  /**
   * Send typing indicator
   * @param {string} userId - The user ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTypingIndicator(userId, isTyping) {
    // This would typically be sent via WebSocket
    // Implementation depends on your real-time setup
    console.log(`User ${userId} typing: ${isTyping}`);
  }

  /**
   * Test WebSocket connection (for debugging)
   * @param {string} userId - The user ID
   */
  testWebSocket(userId) {
    console.log("🧪 Testing WebSocket connection for user:", userId);
    const testWs = this.subscribeToChat(
      userId,
      (message) => console.log("🧪 Test received message:", message),
      (isTyping, fromUserId) =>
        console.log("🧪 Test typing:", isTyping, fromUserId)
    );

    // Close after 10 seconds for testing
    setTimeout(() => {
      if (testWs.readyState === WebSocket.OPEN) {
        console.log("🧪 Closing test WebSocket");
        testWs.close();
      }
    }, 10000);

    return testWs;
  }
}

// Export singleton instance
export default new ChatService();
