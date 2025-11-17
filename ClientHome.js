// ClientHome.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  RefreshControl,
  Linking,
  Image,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";
import { useNotification } from "./context/NotificationContext";
import { useChatUnread } from "./context/ChatUnreadContext";
import ClientProfile from "./ClientProfile";
import NotificationComponent from "./NotificationComponent";
import { QuestionnaireProvider } from "./context/QuestionnaireContext";
import Questionnaire from "./components/questionnaire/Questionnaire";
import NotificationBell from "./components/icons/NotificationBell";
import HelpButton from "./components/icons/HelpButton";
import ReactNativeModal from "react-native-modal";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
// Import modal components
import UploadModal from "./components/modals/UploadModal";
import SubmittedDocumentModal from "./components/modals/SubmittedDocumentModal";
import CompleteDocumentModal from "./components/modals/CompleteDocumentModal";
import CategorySelectionModal from "./components/modals/CategorySelectionModal";
import FullyApprovedModal from "./components/modals/FullyApprovedModal";
import CustomAdminMessagesModal from "./components/modals/CustomAdminMessagesModal";
import ChatModal from "./components/ChatModal";
import Svg, { Path } from "react-native-svg";

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

  // Opacity variations
  noticeContainerBg: "#37747340", // Green with 25% opacity
  coloredBgFill: "#3774731A", // Green with 10% opacity
};

const ClientHome = ({ questionnaireData }) => {
  const navigation = useNavigation();
  const { auth } = useAuth();
  const {
    documents: contextDocuments,
    clientInfo,
    fetchRefreshData,
    loadingClient,
  } = useClient();

  const { unreadCount } = useNotification();
  const { unreadCounts, totalUnread } = useChatUnread();
  const [showProfile, setShowProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // const [showQuestionnairePreview, setShowQuestionnairePreview] =
  //   useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showChangeOptions, setShowChangeOptions] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const [showChatTypeSelection, setShowChatTypeSelection] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState("admin");
  const [mortgageBrokerAvailable, setMortgageBrokerAvailable] = useState(false);
  const [checkingBrokerAvailability, setCheckingBrokerAvailability] =
    useState(false);
  const [mortgageBrokerInfo, setMortgageBrokerInfo] = useState(null); // Store broker name and profile picture
  const [cachedProfilePicture, setCachedProfilePicture] = useState(null); // Store cached local URI

  const clientFromContext = clientInfo || auth.client;

  const clientId =
    clientFromContext.id || auth.client.id || clientFromContext._id;
  const [documentsFromApi, setDocumentsFromApi] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [clientDocs, setClientDocs] = useState(contextDocuments || []);

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);

  // Button loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedCompleteDoc, setSelectedCompleteDoc] = useState(null);

  // Submitted modal state
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [selectedSubmittedDoc, setSelectedSubmittedDoc] = useState(null); // Keep client docs updated from context
  // Fully Approved modal state
  const [downloadingMortgageDoc, setDownloadingMortgageDoc] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedFileUri, setDownloadedFileUri] = useState(null);
  const [indeterminateDownload, setIndeterminateDownload] = useState(false);

  // Custom admin messages state
  const [customMessages, setCustomMessages] = useState([]);
  const [currentCustomMsgIndex, setCurrentCustomMsgIndex] = useState(0);
  const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  useEffect(() => {
    if (contextDocuments && contextDocuments.length > 0) {
      console.log(
        "Updating client documents from context:",
        contextDocuments.length,
        "documents"
      );
      setClientDocs(contextDocuments);
    }
  }, [contextDocuments]);

  // Update loading state from context
  useEffect(() => {
    setLoadingDocuments(loadingClient);
  }, [loadingClient]);

  // Track app state to handle modal auto-dismiss on resume
  const appState = React.useRef(AppState.currentState);
  const wasModalOpenBeforeBackground = React.useRef(false);
  const shouldReopenModal = React.useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Save modal state when going to background
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        wasModalOpenBeforeBackground.current = showCategorySelection;
        if (showCategorySelection) {
          shouldReopenModal.current = true;
          console.log(
            "ClientHome: Going to background with modal open, will force reopen on resume"
          );
        }
      }

      // When returning to active, force reopen the modal if it was open
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (shouldReopenModal.current) {
          console.log(
            "ClientHome: App resumed, forcing modal reopen to prevent freeze"
          );
          // First ensure it's closed
          setShowCategorySelection(false);
          // Then reopen it after a brief delay
          setTimeout(() => {
            setShowCategorySelection(true);
            shouldReopenModal.current = false;
          }, 150);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription && subscription.remove();
    };
  }, [showCategorySelection]);

  // Fetch documents from the server
  // Initial data loading
  useEffect(() => {
    if (clientId) {
      console.log("Initial data loading for client:", clientId);
      fetchRefreshData(clientId).then((result) => {
        if (result?.neededDocsResponse?.documents_needed) {
          setDocumentsFromApi(result.neededDocsResponse.documents_needed);
        }
      });
      // Fetch any custom admin messages
      fetchCustomMessages();
      // Check mortgage broker availability on mount
      checkMortgageBrokerAvailability();
    }
  }, [clientId]);

  // Fetch custom admin messages for the client
  const fetchCustomMessages = async () => {
    console.log("Fetching custom messages for client:", clientId);
    if (!clientId) return;
    try {
      const res = await fetch(
        `https://signup.roostapp.io/admin/custom-messages?userId=${clientId}`
      );
      if (res.ok) {
        const data = await res.json();
        const unread = (data.messages || []).filter((m) => !m.read);
        if (unread.length > 0) {
          console.log("Found unread custom messages:", unread.length);
          setCustomMessages(unread);
          setCurrentCustomMsgIndex(0);
          setShowCustomMessageModal(true);
        }
      } else {
        console.log("Failed to fetch custom messages", res.status);
      }
    } catch (e) {
      console.log("Error fetching custom messages", e.message);
    }
  };

  // Acknowledge (mark read) current custom message
  const acknowledgeCurrentMessage = async () => {
    if (!customMessages.length) return;
    const msg = customMessages[currentCustomMsgIndex];
    if (!msg?._id) return;
    setAckLoading(true);
    try {
      // Mark as read (default to POST; adjust if backend expects different method)
      await fetch(
        `https://signup.roostapp.io/admin/custom-messages/${msg._id}/read`,
        { method: "PUT" }
      );
    } catch (e) {
      console.log("Error marking message read", e.message);
    } finally {
      setAckLoading(false);
      const next = currentCustomMsgIndex + 1;
      if (next < customMessages.length) {
        // Close then reopen with next message (no visible counter)
        setShowCustomMessageModal(false);
        setTimeout(() => {
          setCurrentCustomMsgIndex(next);
          setShowCustomMessageModal(true);
        }, 50);
      } else {
        setShowCustomMessageModal(false);
        setCustomMessages([]);
      }
    }
  };
  // Merge API + client uploads with proper logging
  const merged = React.useMemo(() => {
    if (documentsFromApi.length === 0) {
      // If API returns nothing, fall back to clientDocs
      console.log(
        `Merged documents fallback: 0 from API, ${clientDocs.length} from clientDocs`
      );
      return clientDocs;
    }
    const result = documentsFromApi.map((apiDoc) => {
      const match = clientDocs.find(
        (d) => d.docType?.toLowerCase() === apiDoc.docType?.toLowerCase()
      );
      return match ? { ...apiDoc, ...match } : apiDoc;
    });
    // Log merge results on changes
    console.log(
      `Merged documents: ${result.length} (API: ${documentsFromApi.length}, Client: ${clientDocs.length})`
    );
    return result;
  }, [documentsFromApi, clientDocs]);

  // Adjust statuses: if API still reports 'submitted' but no actual client upload exists, treat as 'pending'
  const mergedWithStatusFix = React.useMemo(() => {
    return merged.map((doc) => {
      const hasLocal = clientDocs.some(
        (d) => d.docType?.toLowerCase() === doc.docType?.toLowerCase()
      );
      if (!hasLocal && doc.status && doc.status.toLowerCase() === "submitted") {
        return { ...doc, status: "pending" };
      }
      return doc;
    });
  }, [merged, clientDocs]);

  // Sort documents: Approved/Complete first, Submitted second, Pending/Rejected last
  const sortDocuments = (docs) => {
    return [...docs].sort((a, b) => {
      const statusA = a.status?.toLowerCase() || "";
      const statusB = b.status?.toLowerCase() || "";

      // Define priority: approved/complete = 0, submitted = 1, pending/rejected = 2
      const getPriority = (status) => {
        if (status === "approved" || status === "complete") return 0;
        if (status === "submitted") return 1;
        return 2; // pending or rejected
      };

      return getPriority(statusA) - getPriority(statusB);
    });
  };

  // Sections
  const docsNeeded = sortDocuments(
    mergedWithStatusFix.filter((d) => d.type === "Needed")
  );
  const docsRequested = sortDocuments(
    mergedWithStatusFix.filter((d) => d.type === "Needed-other")
  );
  // Open upload modal
  const handleAdd = (doc) => {
    setSelectedDocType(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDocType(null);
  }; // Centralized refresh logic
  const onRefresh = React.useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    setActionLoading(true);

    try {
      // Refresh auth data
      const authPromise = auth.refetch?.() || Promise.resolve();

      // Refresh all client data from the context
      const refreshResult = await fetchRefreshData(clientId);

      // Update needed documents from the response
      if (refreshResult?.neededDocsResponse?.documents_needed) {
        setDocumentsFromApi(refreshResult.neededDocsResponse.documents_needed);
      }

      // Wait for auth refresh to complete as well
      await authPromise;

      console.log("Refresh complete with updated data");
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
      setActionLoading(false);
    }
    fetchCustomMessages();
  }, [auth, clientId, refreshing]);

  // Download and cache profile picture
  const downloadAndCacheProfilePicture = async (filename) => {
    if (!filename) return null;

    try {
      // Create a cache directory for profile pictures
      const cacheDir = `${FileSystem.cacheDirectory}profile-pictures/`;
      const cachedFilePath = `${cacheDir}${filename}`;

      // Check if directory exists, if not create it
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Check if file already exists in cache
      const fileInfo = await FileSystem.getInfoAsync(cachedFilePath);
      if (fileInfo.exists) {
        console.log("Profile picture found in cache:", cachedFilePath);
        return cachedFilePath;
      }

      // Download the image if not cached
      console.log("Downloading profile picture:", filename);
      const downloadUrl = `https://signup.roostapp.io/admin/profile-picture/${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        cachedFilePath
      );

      if (downloadResult.status === 200) {
        console.log("Profile picture downloaded and cached:", cachedFilePath);
        return cachedFilePath;
      } else {
        console.error(
          "Failed to download profile picture:",
          downloadResult.status
        );
        return null;
      }
    } catch (error) {
      console.error("Error downloading/caching profile picture:", error);
      return null;
    }
  };

  // Clear old cached profile pictures when filename changes
  const clearOldCachedPictures = async (currentFilename) => {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}profile-pictures/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        // Delete all files except the current one
        for (const file of files) {
          if (file !== currentFilename) {
            const filePath = `${cacheDir}${file}`;
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            console.log("Deleted old cached profile picture:", file);
          }
        }
      }
    } catch (error) {
      console.error("Error clearing old cached pictures:", error);
    }
  };

  // Check if mortgage broker is available
  const checkMortgageBrokerAvailability = async () => {
    if (checkingBrokerAvailability) return false;

    setCheckingBrokerAvailability(true);

    try {
      const ChatService = require("./services/ChatService").default;
      const headers = await ChatService.getAuthHeaders();

      const response = await fetch(
        `https://signup.roostapp.io/client/mortgage-broker-chat/${clientId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "Mortgage broker chat response:",
          JSON.stringify(data, null, 2)
        );

        const available = data.available || false;
        setMortgageBrokerAvailable(available);

        // Extract and store mortgage broker info
        if (available && data.chat?.participants?.mortgageBroker) {
          const broker = data.chat.participants.mortgageBroker;

          // Check if broker is just an ID (not populated) or full object
          if (typeof broker === "string") {
            console.warn(
              "Mortgage broker data not populated, received ID:",
              broker
            );
            // Fallback: set minimal info, broker details won't be available
            setMortgageBrokerInfo({
              name: "Mortgage Broker",
              profilePicture: null,
              email: null,
              phone: null,
              brokerageName: null,
            });
          } else {
            // Broker object is populated
            // Download and cache the profile picture
            let cachedImageUri = null;
            if (broker.profilePicture) {
              // Clear old cached pictures first
              await clearOldCachedPictures(broker.profilePicture);

              // Download and cache the new picture
              cachedImageUri = await downloadAndCacheProfilePicture(
                broker.profilePicture
              );
            }

            setMortgageBrokerInfo({
              name: broker.name || "Mortgage Broker",
              profilePicture: broker.profilePicture, // Store filename for reference
              email: broker.email || null,
              phone: broker.phone || null,
              brokerageName: broker.brokerageName || null,
            });

            // Set the cached local URI separately
            setCachedProfilePicture(cachedImageUri);

            console.log("Mortgage broker info saved:", {
              name: broker.name,
              profilePicture: broker.profilePicture || "Not available",
              cachedUri: cachedImageUri || "Not cached",
            });
          }
        } else {
          console.log("No mortgage broker participant data found in response");
          setMortgageBrokerInfo(null);
        }

        console.log("Mortgage broker availability checked:", available);
        return available;
      } else if (response.status === 404) {
        setMortgageBrokerAvailable(false);
        setMortgageBrokerInfo(null);
        console.log("No mortgage broker assigned to client");
        return false;
      } else {
        // For temporary errors, be optimistic
        setMortgageBrokerAvailable(true);
        setMortgageBrokerInfo(null);
        console.warn(
          "Temporary error checking mortgage broker availability, allowing access"
        );
        return true;
      }
    } catch (error) {
      console.error("Error checking mortgage broker availability:", error);
      // On network errors, be optimistic
      setMortgageBrokerAvailable(true);
      setMortgageBrokerInfo(null);
      console.warn("Network error - allowing mortgage broker chat attempt");
      return true;
    } finally {
      setCheckingBrokerAvailability(false);
    }
  };

  // Help button logic - now opens chat type selection
  const handleHelpPress = async () => {
    // Check mortgage broker availability first
    await checkMortgageBrokerAvailability();

    // If mortgage broker is available, show selection modal
    if (mortgageBrokerAvailable) {
      setShowChatTypeSelection(true);
    } else {
      // If no mortgage broker, go directly to general support
      setSelectedChatType("admin");
      setShowChat(true);
    }
  };

  // Notifications button logic - now opens chat type selection
  const handleNotifications = async () => {
    setShowNotifications(true);
  };

  // Handle chat type selection
  const handleChatTypeSelect = (chatType) => {
    setSelectedChatType(chatType);
    setShowChatTypeSelection(false);
    setShowChat(true);
  };

  // Handle category selection for questionnaire sections
  // The category selection is now handled directly within the modal
  const handleCategorySelect = (categoryId, startQuestionId) => {
    console.log(
      `Selected category: ${categoryId}, starting at question: ${startQuestionId}`
    );
    // No need to set the selected category or navigate elsewhere
    // The CategorySelectionModal now handles question rendering internally

    // We keep this function for backward compatibility
    // but it won't be called with our updated CategorySelectionModal
    // unless we intentionally want to navigate away from the modal
  };
  // Render notification button with badge
  const renderNotificationButton = () => {
    return (
      <NotificationBell
        size={24}
        bellColor={COLORS.white}
        badgeColor={COLORS.orange}
        showBadge={unreadCount > 0}
        badgeCount={unreadCount}
        variant="outlined"
        onPress={handleNotifications}
        style={styles.notificationButton}
      />
    );
  };
  // Add this right after the renderNotificationButton function
  const renderQuestionnaireButton = () => {
    return (
      <View style={styles.questionnaireButtonContainer}>
        <TouchableOpacity
          style={[styles.questionnaireButton, styles.testQuestionnaireButton]}
          // onPress={() => setShowChangeOptions(true)} // use for testing
          onPress={() => {
            setShowChangeOptions(false);
            setShowCategorySelection(true);
          }}
        >
          {/* <Ionicons name="play" size={24} color={COLORS.white} /> */}
          <Text style={styles.questionnaireButtonText}>Change Application</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render row
  const renderDocumentRow = (doc) => {
    const status = doc.status?.toLowerCase();
    let action = null;

    // Determine container and label styles based on status
    let containerStyle = styles.docItem;
    let labelStyle = styles.docLabel;

    if (status === "approved" || status === "complete") {
      containerStyle = styles.docItemApproved;
      labelStyle = styles.docLabelApproved;
    } else if (
      status === "pending" ||
      status === "rejected" ||
      status === "submitted"
    ) {
      containerStyle = styles.docItemPending;
      labelStyle = styles.docLabelPending;
    }

    if (status === "pending" || status === "rejected") {
      action = (
        <TouchableOpacity
          style={[styles.addPill, actionLoading && styles.pillDisabled]}
          onPress={() => {
            setActionLoading(true);
            handleAdd(doc);
            setTimeout(() => setActionLoading(false), 300); // Reset after animation
          }}
          disabled={actionLoading}
        >
          {/* {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.addPillText}>Add</Text>
          )} */}
          <Text style={styles.addPillText}>Add</Text>
        </TouchableOpacity>
      );
    } else if (status === "submitted") {
      action = (
        <TouchableOpacity
          style={[styles.submittedPill, actionLoading && styles.pillDisabled]}
          onPress={() => {
            setActionLoading(true);
            setSelectedSubmittedDoc(doc);
            setShowSubmittedModal(true);
            setTimeout(() => setActionLoading(false), 300); // Reset after animation
          }}
          disabled={actionLoading}
        >
          {/* {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            )} */}
          <Text style={styles.submittedPillText}>Submitted</Text>
        </TouchableOpacity>
      );
    } else if (status === "approved" || status === "complete") {
      action = (
        <TouchableOpacity
          style={[
            styles.approvedIconContainer,
            actionLoading && styles.pillDisabled,
          ]}
          onPress={() => {
            setActionLoading(true);
            setSelectedCompleteDoc(doc);
            setShowCompleteModal(true);
            setTimeout(() => setActionLoading(false), 300); // Reset after animation
          }}
          disabled={actionLoading}
        >
          {/* {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.green} />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={COLORS.green}
            />
          )} */}
          <Svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              d="M15 10L11 14L9 12M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
              stroke="#377473"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      );
    }
    return (
      <View key={doc.docType} style={containerStyle}>
        <Text style={labelStyle}>
          {doc.displayName
            ? doc.displayName.charAt(0).toUpperCase() + doc.displayName.slice(1)
            : doc.docType.charAt(0).toUpperCase() + doc.docType.slice(1)}
        </Text>
        {action}
      </View>
    );
  };

  // Download mortgage document
  const handleDownloadMortgageDocument = async () => {
    if (!clientFromContext.completionDetails?.mortgageDocument?._id) return;
    setDownloadingMortgageDoc(true);
    setDownloadProgress(0);
    setIndeterminateDownload(false);
    try {
      const docMeta = clientFromContext.completionDetails.mortgageDocument;
      const docId = docMeta._id;
      const originalName = docMeta.fileName || "mortgage-document.pdf";
      const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const url = `https://signup.roostapp.io/admin/client/${clientId}/mortgage-document/${docId}`;
      console.log("Downloading mortgage document (XHR) from:", url);

      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "blob"; // Ensure we get binary data

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          // Avoid jumping straight to 100% before write/share finishes
          setIndeterminateDownload(false);
          setDownloadProgress(Math.min(pct, 99));
        } else {
          // Server didn't send content-length header
          if (event.loaded > 0) {
            setIndeterminateDownload(true);
          }
        }
      };

      xhr.onerror = () => {
        console.error("XHR download error");
        Alert.alert("Error", "Failed to download document.");
        setDownloadingMortgageDoc(false);
        setDownloadProgress(0);
        setIndeterminateDownload(false);
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const blob = xhr.response;
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64data = reader.result.split(",")[1];
                const fileUri = FileSystem.cacheDirectory + safeFileName;
                await FileSystem.writeAsStringAsync(fileUri, base64data, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                setDownloadedFileUri(fileUri);
                setDownloadProgress(100);
                setIndeterminateDownload(false);
                setTimeout(() => setDownloadingMortgageDoc(false), 200);
                if (await Sharing.isAvailableAsync()) {
                  try {
                    await Sharing.shareAsync(fileUri, {
                      dialogTitle: "Share Mortgage Document",
                    });
                  } catch (shareErr) {
                    console.warn("Share cancelled or failed", shareErr);
                  }
                } else {
                  Alert.alert("Download Complete", `Saved to: ${fileUri}`);
                }
              } catch (writeErr) {
                console.error("File write/share error", writeErr);
                Alert.alert("Error", "Failed to save downloaded file.");
                setDownloadingMortgageDoc(false);
                setDownloadProgress(0);
              }
            };
            reader.readAsDataURL(blob);
          } catch (blobErr) {
            console.error("Blob handling error", blobErr);
            Alert.alert("Error", "Failed to process downloaded file.");
            setDownloadingMortgageDoc(false);
            setDownloadProgress(0);
            setIndeterminateDownload(false);
          }
        } else {
          Alert.alert("Download Failed", "Unable to download document.");
          setDownloadingMortgageDoc(false);
          setDownloadProgress(0);
          setIndeterminateDownload(false);
        }
      };

      xhr.send();
    } catch (err) {
      console.error("Download setup error", err);
      Alert.alert("Error", "Failed to start download.");
      setDownloadingMortgageDoc(false);
      setDownloadProgress(0);
      setIndeterminateDownload(false);
    }
  };

  // Fallback: if after 1500ms still at 0% and downloading, mark indeterminate
  useEffect(() => {
    if (downloadingMortgageDoc) {
      const t = setTimeout(() => {
        if (downloadProgress === 0 && downloadingMortgageDoc) {
          setIndeterminateDownload(true);
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [downloadingMortgageDoc, downloadProgress]);

  return (
    <View style={styles.safeArea}>
      {/* Main Header - Bottom 63px */}
      <View style={styles.topHeader}>
        {/* Left Section: Profile Circle and Welcome Text */}
        <TouchableOpacity
          style={styles.leftSection}
          onPress={() => setShowProfile(true)}
        >
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>
              {clientFromContext.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text
              style={styles.clientName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {clientFromContext.name}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Section: Notification Bell and Help Button */}
        <View style={styles.rightSection}>
          {renderNotificationButton()}
          <View style={styles.helpButtonContainer}>
            <HelpButton
              borderColor={COLORS.white}
              textColor={COLORS.white}
              width={46}
              height={46}
              text="HELP"
              onPress={handleHelpPress}
              variant="outline"
              size="medium"
            />
            {/* Chat unread badge on Help button */}
            {totalUnread > 0 && (
              <View style={styles.chatUnreadBadge}>
                <View style={styles.chatUnreadDot} />
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.mainContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.green}
            colors={[COLORS.green]}
          />
        }
      >
        {/* Extended Background for Header */}
        <View style={styles.headerExtendedBackground} />

        <View style={styles.contentContainer}>
          <View style={styles.statusContainer}>
            {clientFromContext.status === "PreApproved" ? (
              <>
                <Text style={styles.bigTitlePreApproved}>Pre-Approved!</Text>
                <Text style={styles.moneyPreApproved}>
                  {(clientFromContext?.preApprovalAmount || 0).toLocaleString(
                    "en-US",
                    {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }
                  )}
                </Text>
                <Text style={styles.subTitlePreApproved}>
                  For the full approval we will need the following documents. By
                  the way if you need more we might be able to help. Click the
                  help button above.
                </Text>
              </>
            ) : clientFromContext.status === "FullyApproved" ? (
              <>
                <FullyApprovedModal
                  visible={true}
                  details={clientFromContext.fullyApprovedDetails || {}}
                  onPurchasedPress={() => {
                    // Placeholder: potential navigation or action when user indicates purchase intent
                  }}
                />
              </>
            ) : clientFromContext.status === "Completed" ? (
              <>
                <Text style={styles.bigTitlePreApproved}>Approved!</Text>

                {clientFromContext.completionDetails.mortgageDocument && (
                  <View style={{ alignItems: "center" }}>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={handleDownloadMortgageDocument}
                      disabled={downloadingMortgageDoc}
                    >
                      <Text style={styles.downloadButtonText}>
                        {downloadingMortgageDoc
                          ? `Downloading: ${downloadProgress}%`
                          : "Download Mortgage Document"}
                      </Text>
                      {downloadingMortgageDoc && (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      )}
                    </TouchableOpacity>
                    {/* {downloadingMortgageDoc && (
                      <View style={{ marginTop: 10 }}>
                        {indeterminateDownload ? (
                          <Text style={styles.downloadProgressText}>
                            Downloading...
                          </Text>
                        ) : (
                          <Text style={styles.downloadProgressText}>
                            Downloading: {downloadProgress}%
                          </Text>
                        )}
                      </View>
                    )} */}
                  </View>
                )}

                {clientFromContext.completionDetails && (
                  <View style={styles.completionDetailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Property Price:</Text>
                      <Text style={styles.detailValue}>
                        $
                        {Number(
                          clientFromContext.completionDetails.propertyPrice || 0
                        ).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Mortgage Amount:</Text>
                      <Text style={styles.detailValue}>
                        $
                        {Number(
                          clientFromContext.completionDetails.mortgageAmount ||
                            0
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.bigTitle}>Just Hang in there</Text>
                <Text style={styles.subTitle}>
                  We’re working on your pre-approval amount. This usually takes
                  about an hour, depending on volume and the details you’ve
                  provided.
                </Text>
              </>
            )}
          </View>
          {loadingDocuments ? (
            <ActivityIndicator
              size="large"
              color={COLORS.green}
              style={styles.loadingIndicator}
            />
          ) : (
            !["FullyApproved", "Completed"].includes(
              clientFromContext.status
            ) && (
              <View>
                {/* Needed */}
                <Text style={styles.sectionHeader}>WHAT’S NEEDED FOR YOU</Text>
                <View style={styles.docsContainer}>
                  {docsNeeded.length > 0 ? (
                    docsNeeded.map(renderDocumentRow)
                  ) : (
                    <View style={styles.noDocsContainer}>
                      <Text style={styles.noDocsText}>
                        Document requests will be here, once your application is
                        completed
                      </Text>
                    </View>
                  )}
                </View>

                {/* Requested */}
                {clientFromContext.applyingbehalf &&
                  clientFromContext.applyingbehalf.toLowerCase() ===
                    "other" && (
                    <View>
                      <Text style={styles.sectionHeader}>
                        {"WHAT'S NEEDED FOR " +
                          (
                            clientFromContext.otherDetails?.name || ""
                          )?.toUpperCase()}
                      </Text>
                      <View style={styles.docsContainer}>
                        {docsRequested.length > 0 ? (
                          docsRequested.map(renderDocumentRow)
                        ) : (
                          <View style={styles.noDocsContainer}>
                            <Text style={styles.noDocsText}>
                              Document requests will be here, once your
                              application is completed
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {!(
        clientFromContext.status === "Completed" ||
        clientFromContext.status === "FullyApproved"
      ) && renderQuestionnaireButton()}

      {/* Profile Panel */}
      <ReactNativeModal
        isVisible={showProfile}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        animationInTiming={400}
        animationOutTiming={400}
        onRequestClose={() => setShowProfile(false)}
        useNativeDriver={false}
        statusBarTranslucent
        style={styles.sideModal}
      >
        <View style={styles.profileModalContent}>
          <ClientProfile onClose={() => setShowProfile(false)} />
        </View>
      </ReactNativeModal>
      {/* Upload Modal */}
      <UploadModal
        visible={showModal}
        onClose={closeModal}
        selectedDocType={selectedDocType}
        clientName={clientFromContext.name}
        coClientName={clientFromContext.otherDetails?.name || ""}
        clientId={clientId}
        onUploadSuccess={() =>
          fetchRefreshData(clientId).then((result) => {
            if (result?.neededDocsResponse?.documents_needed) {
              setDocumentsFromApi(result.neededDocsResponse.documents_needed);
            }
          })
        }
      />
      {/* Complete Document Modal */}
      <CompleteDocumentModal
        visible={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        document={selectedCompleteDoc}
        clientId={clientId}
        clientName={clientFromContext.name}
        coClientName={clientFromContext.otherDetails?.name || ""}
      />
      {/* Submitted Document Modal */}
      <SubmittedDocumentModal
        visible={showSubmittedModal}
        onClose={() => setShowSubmittedModal(false)}
        document={selectedSubmittedDoc}
        clientId={clientId}
        clientName={clientFromContext.name}
        coClientName={clientFromContext.otherDetails?.name || ""}
        onDeleteSuccess={() => {
          fetchRefreshData(clientId).then((result) => {
            if (result?.neededDocsResponse?.documents_needed) {
              setDocumentsFromApi(result.neededDocsResponse.documents_needed);
            }
          });
          // Optimistically remove from local clientDocs so status updates immediately
          if (selectedSubmittedDoc?.docType) {
            setClientDocs((prev) =>
              prev.filter(
                (d) =>
                  d.docType?.toLowerCase() !==
                  selectedSubmittedDoc.docType?.toLowerCase()
              )
            );
          }
          setShowSubmittedModal(false);
        }}
      />
      {/* Modal for change application options */}
      <Modal
        visible={showChangeOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowChangeOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changeOptionsModalContent}>
            <Text style={styles.changeOptionsTitle}>Change Application</Text>
            <Text style={styles.changeOptionsSubTitle}>
              How would you like to update your application?
            </Text>

            <TouchableOpacity
              style={styles.changeOptionButton}
              onPress={() => {
                setShowChangeOptions(false);
                setShowQuestionnaire(true);
              }}
            >
              <Text style={styles.changeOptionButtonText}>Start Over</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.changeOptionButton, styles.secondOptionButton]}
              onPress={() => {
                setShowChangeOptions(false);
                setShowCategorySelection(true);
              }}
            >
              <Text style={styles.changeOptionButtonText}>
                Change only Specific Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowChangeOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for questionnaire preview */}
      {/* <QuestionnairePreview /> */}
      {/* Modal for testing the actual questionnaire */}
      <Modal
        visible={showQuestionnaire}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowQuestionnaire(false);
          // Reset the selected category when closing the questionnaire
          setSelectedCategory(null);
        }}
      >
        <QuestionnaireProvider>
          <Questionnaire
            key={`questionnaire-${Date.now()}`}
            navigation={{
              goBack: () => {
                setShowQuestionnaire(false);
                setSelectedCategory(null);
              },
            }}
            questionnaireData={questionnaireData}
            showCloseButton={true}
            selectedCategory={selectedCategory}
            startQuestionId={selectedCategory?.startQuestionId}
          />
        </QuestionnaireProvider>
      </Modal>
      <NotificationComponent
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={clientFromContext.id}
      />
      <CustomAdminMessagesModal
        visible={showCustomMessageModal}
        messages={customMessages}
        currentIndex={currentCustomMsgIndex}
        onAcknowledge={acknowledgeCurrentMessage}
        onRequestClose={() => setShowCustomMessageModal(false)}
        loading={ackLoading}
        colors={{
          backdrop: "rgba(0,0,0,0.5)",
          surface: COLORS.white,
          title: COLORS.black,
          body: COLORS.black,
          primary: COLORS.green,
          primaryText: COLORS.white,
          counter: COLORS.slate,
        }}
      />

      {/* Chat Type Selection Modal */}
      <Modal
        visible={showChatTypeSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChatTypeSelection(false)}
      >
        <View style={styles.chatTypeSelectionOverlay}>
          <View style={styles.chatTypeSelectionModalContent}>
            <Text style={styles.chatTypeSelectionTitle}>
              Choose Support Type
            </Text>
            <Text style={styles.chatTypeSelectionSubTitle}>
              Which type of support do you need?
            </Text>

            <TouchableOpacity
              style={styles.chatTypeOptionButton}
              onPress={() => handleChatTypeSelect("admin")}
            >
              <Image
                source={require("./assets/app-icon.png")}
                style={styles.chatTypeOptionAvatar}
                resizeMode="contain"
              />
              <View style={styles.chatTypeOptionTextContainer}>
                <Text style={styles.chatTypeOptionTitle}>General Support</Text>
                <Text style={styles.chatTypeOptionDescription}>
                  Help with app, documents, and general questions
                </Text>
              </View>
              {/* Unread badge for admin chat */}
              {unreadCounts.admin > 0 && (
                <View style={styles.chatTypeUnreadBadge}>
                  <Text style={styles.chatTypeUnreadText}>
                    {unreadCounts.admin}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatTypeOptionButton}
              onPress={() => handleChatTypeSelect("mortgage-broker")}
            >
              {cachedProfilePicture ? (
                <Image
                  source={{ uri: cachedProfilePicture }}
                  style={styles.chatTypeOptionAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={COLORS.blue}
                  style={styles.chatTypeOptionIcon}
                />
              )}
              <View style={styles.chatTypeOptionTextContainer}>
                <Text style={styles.chatTypeOptionTitle}>
                  {mortgageBrokerInfo?.name + " " + `(Mortgage Broker)` ||
                    "Mortgage Broker"}
                </Text>
                <Text style={styles.chatTypeOptionDescription}>
                  Specific questions about your mortgage application
                </Text>
              </View>
              {/* Unread badge for mortgage broker chat */}
              {unreadCounts["mortgage-broker"] > 0 && (
                <View style={styles.chatTypeUnreadBadge}>
                  <Text style={styles.chatTypeUnreadText}>
                    {unreadCounts["mortgage-broker"]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowChatTypeSelection(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chat Modals - Always mounted to maintain socket connections */}
      {/* Admin Chat */}
      <ChatModal
        visible={showChat && selectedChatType === "admin"}
        onClose={() => setShowChat(false)}
        userId={clientId}
        userName={clientFromContext.name}
        chatType="admin"
      />

      {/* Mortgage Broker Chat - only if broker is available */}
      {mortgageBrokerAvailable && (
        <ChatModal
          visible={showChat && selectedChatType === "mortgage-broker"}
          onClose={() => setShowChat(false)}
          userId={clientId}
          userName={clientFromContext.name}
          chatType="mortgage-broker"
          supportName={mortgageBrokerInfo?.name || "Mortgage Broker"}
          supportAvatar={cachedProfilePicture}
        />
      )}

      {/* Category Selection Modal */}
      <QuestionnaireProvider>
        <CategorySelectionModal
          visible={showCategorySelection}
          questionnaireData={questionnaireData}
          onClose={() => {
            onRefresh();
            setShowCategorySelection(false);
          }}
          onSelectCategory={handleCategorySelect}
          logo={
            <Image
              source={require("./assets/Roost_Logo_V1_Logo-text-black.svg")}
              style={{ width: 150, height: 60, resizeMode: "contain" }}
            />
          }
        />
      </QuestionnaireProvider>
    </View>
  );
};

export default ClientHome;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: "relative", // To position absolute elements
  },

  headerExtendedBackground: {
    position: "absolute",
    top: -126, // Position it to align with the header above
    left: -24, // Compensate for ScrollView paddingHorizontal
    right: -24, // Compensate for ScrollView paddingHorizontal
    height: 180, // Extends to cover header (126px) + half of statusContainer padding/content
    backgroundColor: COLORS.black,
    zIndex: 0,
  },

  topHeader: {
    width: "100%",
    height: 126, // Exact height as specified
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 60, // Reserve 68px for mobile status bar
    paddingBottom: 8,
    backgroundColor: COLORS.black, // Restore original background color
    zIndex: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  helpButtonContainer: {
    position: "relative",
  },
  chatUnreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#F0913A",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.black,
    zIndex: 10,
  },
  chatUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  initials: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    maxWidth: "80%", // Limit width to prevent overlap
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 50,
    backgroundColor: COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  sideModal: {
    margin: 0, // Remove default margin to make it full width
    justifyContent: "flex-start", // Align to the side
    flex: 1,
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 18, // Larger font for bigger circle
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  welcomeTextContainer: {
    justifyContent: "center",
    flex: 1,
  },
  welcomeText: {
    color: "#D2D2D2",
    fontSize: 10,
    fontWeight: 500,
    fontFamily: "Futura",
  },
  clientName: {
    textTransform: "uppercase",
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Futura",
  },
  removeButtonText: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    textAlign: "center",
    borderRadius: 8,
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "fit-content",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: COLORS.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Futura",
  },
  helpButton: {
    backgroundColor: COLORS.green,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  helpButtonText: {
    color: COLORS.white,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    marginBottom: 64,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  statusContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    zIndex: 2,
    shadowColor: "#00000040",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  bigTitle: {
    fontSize: 24, // H1 size
    fontWeight: "bold", // H1 weight
    color: COLORS.green,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  subTitle: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.slate,
    fontFamily: "Futura",
    marginBottom: 8,
  },
  bigTitlePreApproved: {
    fontSize: 24, // H1 size
    fontWeight: "700", // H1 weight
    color: COLORS.green,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  moneyPreApproved: {
    fontSize: 16, // H1 size
    fontWeight: "500", // H1 weight
    color: COLORS.green,
    marginBottom: 16,
    fontFamily: "Futura",
  },
  subTitlePreApproved: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.slate,
    fontFamily: "Futura",
    marginBottom: 8,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#797979",
    marginBottom: 16,
    fontFamily: "Futura",
    lineHeight: 20,
    letterSpacing: 0,
  },
  docsContainer: {
    marginBottom: 32,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 0,
  },
  docItemApproved: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FBFBFB",
    borderRadius: 16,
    height: 40,
  },
  docItemPending: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    height: 59,
    shadowColor: "rgba(14, 29, 29, 0.2)",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  docLabel: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
    fontFamily: "Futura",
  },
  docLabelApproved: {
    fontSize: 14,
    fontWeight: "500",
    color: "#797979",
    flex: 1,
    fontFamily: "Futura",
    lineHeight: 19,
  },
  docLabelPending: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4D4D4D",
    flex: 1,
    fontFamily: "Futura",
    lineHeight: 19,
  }, // Pill styles
  addPill: {
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeModalButton: {
    color: COLORS.black,
    fontWeight: "bold", // H4 weight
    fontSize: 24,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.silver,
  },
  closeModalText: {
    color: COLORS.black,
  },
  addPillText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  submittedPillText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  completePillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    textAlign: "center",
    letterSpacing: 0,
  },
  submittedPill: {
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  approvedIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  completePill: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingBottom: 13,
    paddingLeft: 24,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 100,
    flexShrink: 0,
  },
  noDocsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 100,
    backgroundColor: "#FBFBFB",
    borderRadius: 16,
    shadowColor: "rgba(14, 29, 29, 0.2)",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  noDocsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#D2D2D2",
    textAlign: "center",
    lineHeight: 19,
    fontFamily: "Futura",
    flex: 1,
  },
  loadingIndicator: {
    marginTop: 48,
  },
  /* FILE UPLOAD MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    position: "relative",
  },
  modalContentFullscreen: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    borderRadius: 0,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "ios" ? 40 : 20, // Add more padding for iOS notch
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    flex: 1,
    fontFamily: "Futura",
  },
  removeButton: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  removeButtonText: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    textAlign: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
  imageScrollView: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.white,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.white,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 0.75,
    marginBottom: 24,
    position: "relative",
    backgroundColor: COLORS.silver,
    borderRadius: 8,
    overflow: "hidden",
    padding: 4,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.black,
  },
  bottomButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    backgroundColor: COLORS.silver,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  addMoreButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    flex: 1,
    marginHorizontal: 16,
  },
  doneButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginVertical: 16,
  },
  actionButtonText: {
    backgroundColor: COLORS.green,
    color: COLORS.white,
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  actionButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonHalf: {
    flex: 1,
  },
  fileSelected: {
    textAlign: "center",
    marginVertical: 16,
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  uploadButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginTop: 16,
    width: "100%",
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    textAlign: "center",
    fontSize: 16, // H3 size
    fontFamily: "Futura",
  } /* PROFILE MODAL */,
  profileModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
  },
  profileModalContent: {
    flex: 1,
    backgroundColor: "transparent",
    width: "100%",
  },
  closeProfileButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  closeProfileText: {
    fontSize: 24,
    color: COLORS.black,
  },
  completeModalText: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 24,
    fontFamily: "Futura",
  },
  closeButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginTop: 16,
    width: "100%",
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    textAlign: "center",
    fontSize: 16, // H3 size
    fontFamily: "Futura",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: COLORS.red,
  },
  nevermindButton: {
    backgroundColor: COLORS.green,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    fontSize: 16, // H3 size
    fontFamily: "Futura",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pillDisabled: {
    opacity: 0.7,
  },
  completionDetailsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    fontFamily: "Futura",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  questionnaireButtonContainer: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    width: "90%",
    bottom: 24,
    zIndex: 66, // Ensure it appears above other content
  },
  questionnaireButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 33,
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    justifyContent: "center",
  },
  testQuestionnaireButton: {
    backgroundColor: COLORS.orange,
  },
  questionnaireButtonText: {
    color: COLORS.white,
    fontSize: 12, // H4 size
    fontWeight: "700", // H4 weight
    fontFamily: "Futura",
  },
  // Change Application Modal Styles
  changeOptionsModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  changeOptionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 12,
    fontFamily: "Futura",
    textAlign: "center",
  },
  changeOptionsSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    marginBottom: 24,
    fontFamily: "Futura",
    textAlign: "center",
  },
  changeOptionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  secondOptionButton: {
    backgroundColor: COLORS.blue,
  },
  changeOptionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  cancelButton: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  downloadButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 33,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 220,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
    fontFamily: "Futura",
    marginRight: 8,
  },
  downloadProgressText: {
    color: COLORS.slate,
    fontSize: 15,
    marginTop: 4,
  },
  // Chat type selection modal styles
  chatTypeSelectionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  chatTypeSelectionModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  chatTypeSelectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
    fontFamily: "Futura",
    textAlign: "center",
  },
  chatTypeSelectionSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    marginBottom: 24,
    fontFamily: "Futura",
    textAlign: "center",
  },
  chatTypeOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.silver,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E1E5E9",
    position: "relative",
  },
  chatTypeUnreadBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#F0913A",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.silver,
    zIndex: 10,
  },
  chatTypeUnreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  chatTypeUnreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  chatTypeOptionIcon: {
    marginRight: 16,
  },
  chatTypeOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    backgroundColor: COLORS.red, // Default red background while image loads
  },
  chatTypeOptionTextContainer: {
    flex: 1,
  },
  chatTypeOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    fontFamily: "Futura",
    marginBottom: 4,
  },
  chatTypeOptionDescription: {
    fontSize: 13,
    fontWeight: "400",
    color: COLORS.slate,
    fontFamily: "Futura",
    lineHeight: 18,
  },
  // Removed old custom message modal specific styles (now in shared component)
});
