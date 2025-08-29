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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";
import { useNotification } from "./context/NotificationContext";
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
  const [showProfile, setShowProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // const [showQuestionnairePreview, setShowQuestionnairePreview] =
  //   useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showChangeOptions, setShowChangeOptions] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const clientFromContext = clientInfo || auth.client;

  const clientId = clientFromContext.id;
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
    }
  }, [clientId]);
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

  // Sections
  const docsNeeded = merged.filter((d) => d.type === "Needed");
  const docsRequested = merged.filter((d) => d.type === "Needed-other");
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
  }, [auth, clientId, refreshing]);

  // Help button logic
  const handleHelpPress = async () => {
    const phoneNumber = "+14374349705";
    const message = "Can you help me with my mortgage application?";

    // Try SMS first
    const smsUrl = `sms:${phoneNumber}${
      Platform.OS === "ios" ? "&" : "?"
    }body=${encodeURIComponent(message)}`;
    const canOpenSms = await Linking.canOpenURL(smsUrl);

    if (canOpenSms) {
      await Linking.openURL(smsUrl);
    } else {
      // If SMS fails, try WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber.replace(
        "+",
        ""
      )}&text=${encodeURIComponent(message)}`;
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);

      if (canOpenWhatsapp) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "No messaging app available");
      }
    }
  };

  // Notifications button logic
  const handleNotifications = () => {
    setShowNotifications(true);
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
        variant="filled"
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
          {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.green} />
          ) : (
            <Text style={styles.addPillText}>Add</Text>
          )}
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
          {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.blue} />
          ) : (
            <Text style={styles.submittedPillText}>Submitted</Text>
          )}
        </TouchableOpacity>
      );
    } else if (status === "approved" || status === "complete") {
      action = (
        <TouchableOpacity
          style={[styles.completePill, actionLoading && styles.pillDisabled]}
          onPress={() => {
            setActionLoading(true);
            setSelectedCompleteDoc(doc);
            setShowCompleteModal(true);
            setTimeout(() => setActionLoading(false), 300); // Reset after animation
          }}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.completePillText}>Approved</Text>
          )}
        </TouchableOpacity>
      );
    }
    return (
      <View key={doc.docType} style={styles.docItem}>
        <Text style={styles.docLabel}>
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
                    <Text style={styles.noDocsText}>No documents needed.</Text>
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
                          <Text style={styles.noDocsText}>
                            No documents requested.
                          </Text>
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

      {/* Category Selection Modal - Using key to force remount and reset state */}
      {showCategorySelection && (
        <QuestionnaireProvider>
          <CategorySelectionModal
            key={`category-selection-${Date.now()}`}
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
      )}
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

  topHeader: {
    width: "100%",
    height: 126, // Exact height as specified
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 60, // Reserve 68px for mobile status bar
    paddingBottom: 8,
    backgroundColor: COLORS.black,
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
    color: "#A9A9A9",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    lineHeight: 25,
  },
  clientName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 500,
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
    paddingTop: 24,
    marginBottom: 64,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  statusContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,

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
    color: COLORS.black,
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
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
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
  docLabel: {
    fontSize: 12, // P size
    fontWeight: "700", // P weight
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
    fontFamily: "Futura",
  }, // Pill styles
  addPill: {
    backgroundColor: "transparent",
    borderRadius: 33,
    paddingTop: 13,
    paddingRight: 24,
    paddingBottom: 13,
    paddingLeft: 24,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: COLORS.green,
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
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    textAlign: "center",
    letterSpacing: 0,
  },
  submittedPillText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    textAlign: "center",
    letterSpacing: 0,
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
    backgroundColor: "transparent",
    borderRadius: 50,
    paddingTop: 13,
    paddingRight: 24,
    paddingBottom: 13,
    textAlign: "center",
    paddingLeft: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: COLORS.green,
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
  noDocsText: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.slate,
    textAlign: "center",
    marginVertical: 16,
    fontFamily: "Futura",
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
});
