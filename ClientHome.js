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
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
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
  const [showQuestionnairePreview, setShowQuestionnairePreview] =
    useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const clientFromContext = clientInfo || auth.client;

  const clientId = clientFromContext.id;

  const [documentsFromApi, setDocumentsFromApi] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [clientDocs, setClientDocs] = useState(contextDocuments || []);
  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);

  // Button loading states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedCompleteDoc, setSelectedCompleteDoc] = useState(null);

  // Submitted modal state
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [selectedSubmittedDoc, setSelectedSubmittedDoc] = useState(null); // Keep client docs updated from context
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
  const handleAdd = (docType) => {
    setSelectedDocType(docType);
    setSelectedFile(null);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedDocType(null);
    setSelectedFile(null);
    setCapturedImages([]);
  };

  // Pick PDF
  const pickDocumentFile = async () => {
    try {
      setIsLoading(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      console.log("Document picker result:", res);

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        // Verify file is actually a PDF
        if (
          !file.mimeType?.includes("pdf") &&
          !file.name?.toLowerCase().endsWith(".pdf")
        ) {
          Alert.alert("Invalid File", "Please select a PDF file");
          return;
        }

        // Verify file size (limit to 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert(
            "File Too Large",
            "Please select a file smaller than 10MB"
          );
          return;
        }

        setSelectedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        });
        Alert.alert("Success", "File selected successfully");
      } else {
        Alert.alert("Cancelled", "No file was selected");
      }
    } catch (e) {
      console.error("File pick error:", e);
      Alert.alert("Error", "Could not pick file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Scan & PDF
  const pickCameraFile = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to scan documents.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3], // Set a fixed aspect ratio
        allowsMultipleSelection: false,
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets?.length) {
        setCapturedImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(
        "Scanner Error",
        "An unexpected error occurred while accessing the camera.",
        [{ text: "OK" }]
      );
    }
  };

  // Remove image from gallery
  const removeImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert images to PDF
  const convertImagesToPDF = async () => {
    if (capturedImages.length === 0) return;
    const html = await Promise.all(
      capturedImages.map(async (u) => {
        const blob = await (await fetch(u)).blob();
        const b64 = await new Promise((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(blob);
        });
        return `<img src="${b64}" style="page-break-after: always;" />`;
      })
    ).then(
      (arr) => `<html><body style="margin:0">${arr.join("")}</body></html>`
    );

    const { uri: pdfUri } = await Print.printToFileAsync({ html });
    setSelectedFile({
      uri: pdfUri,
      name: `scan-${Date.now()}.pdf`,
      type: "application/pdf",
    });
    setCapturedImages([]);
  };

  // Choose method
  const handleFileSelection = () =>
    Alert.alert("Attach document", "", [
      {
        text: "Upload PDF",
        onPress: pickDocumentFile,
        disabled: isLoading,
      },
      {
        text: "Scan Document",
        onPress: pickCameraFile,
        disabled: isLoading,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]); // Upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      return Alert.alert("Select file/type");
    }

    setUploadLoading(true);

    const data = new FormData();
    data.append("docType", selectedDocType);
    data.append("pdfFile", {
      uri:
        Platform.OS === "android"
          ? selectedFile.uri
          : selectedFile.uri.replace("file://", ""),
      name: selectedFile.name || "file.pdf",
      type: "application/pdf",
    });

    try {
      const resp = await fetch(
        `http://159.203.58.60:5000/documents/${clientId}/documents`,
        {
          method: "POST",
          body: data,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (!resp.ok) throw new Error("upload failed");

      // Sync with backend after successful upload
      const refreshResult = await fetchRefreshData(clientId);

      // Update needed documents if available
      if (refreshResult?.neededDocsResponse?.documents_needed) {
        setDocumentsFromApi(refreshResult.neededDocsResponse.documents_needed);
      }

      Alert.alert("Success", "Document uploaded successfully");
      closeModal();
    } catch (e) {
      console.error("Upload error:", e);
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  }; // Delete document
  const handleDeleteDocument = async (documentDetails) => {
    console.log("Deleting document:", documentDetails);
    setDeleteLoading(true);

    try {
      if (!documentDetails || !documentDetails._id) {
        Alert.alert("Error", "Document ID is missing");
        console.error("Document ID is missing:", documentDetails);
        return;
      }

      const response = await fetch(
        `http://159.203.58.60:5000/documents/${clientId}/documents/${documentDetails._id}`,
        {
          method: "DELETE",
        }
      );

      // Clone the response before consuming the body
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => ({}));
      console.log("Delete response:", responseData);
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

      // Sync with backend after successful deletion
      const refreshResult = await fetchRefreshData(clientId);

      // Update needed documents if available
      if (refreshResult?.neededDocsResponse?.documents_needed) {
        setDocumentsFromApi(refreshResult.neededDocsResponse.documents_needed);
      }

      setShowSubmittedModal(false);
      Alert.alert("Success", "Document deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete document");
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
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
    const phoneNumber = "+16475730423";
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
  // Render notification button with badge
  const renderNotificationButton = () => {
    return (
      <NotificationBell
        size={24}
        bellColor={COLORS.white}
        badgeColor={COLORS.orange}
        showBadge={unreadCount > 0}
        badgeCount={unreadCount}
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
          onPress={() => setShowQuestionnaire(true)}
        >
          <Ionicons name="play" size={24} color={COLORS.white} />
          <Text style={styles.questionnaireButtonText}>Test Questionnaire</Text>
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
            handleAdd(doc.docType);
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
        <Text style={styles.docLabel}>{doc.displayName || doc.docType}</Text>
        {action}
      </View>
    );
  };

  // Component for displaying the questionnaire in read-only mode
  const QuestionnairePreview = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showQuestionnairePreview}
      onRequestClose={() => setShowQuestionnairePreview(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 10,
            padding: 20,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                Your Questionnaire Responses
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowQuestionnairePreview(false)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.slate} />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 15 }}>
            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}
              >
                Applying on Behalf:
              </Text>
              <Text>
                {questionnaireData.applyingbehalf === "other"
                  ? `Me and ${questionnaireData.otherDetails?.name}`
                  : "Self"}
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}
              >
                Employment Status:
              </Text>
              <Text>
                {questionnaireData.employmentStatus || "Not specified"}
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}
              >
                Own Another Property:
              </Text>
              <Text>{questionnaireData.ownAnotherProperty ? "Yes" : "No"}</Text>
            </View>

            {questionnaireData.otherDetails && (
              <View>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}
                >
                  {questionnaireData.otherDetails.name}'s Details:
                </Text>
                <Text>
                  Relationship:
                  {questionnaireData.otherDetails.relationship || "N/A"}
                </Text>
                <Text>
                  Employment details:
                  {questionnaireData.otherDetails.employmentStatus || "N/A"}
                </Text>
                <Text>
                  Own another property:
                  {questionnaireData.otherDetails.ownAnotherProperty || "N/A"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Apple Logo Area - Top 63px blank space */}
      <View style={styles.appleLogoSpace} />
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
        {renderQuestionnaireButton()}

        {/* Right Section: Notification Bell and Help Button */}
        <View style={styles.rightSection}>
          {renderNotificationButton()}
          <HelpButton
            borderColor={COLORS.white}
            textColor={COLORS.white}
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
          <Text style={styles.bigTitle}>Everything need for a mortgage</Text>
          <Text style={styles.subTitle}>
            We understand we are asking for a lot but it’s what’s needed for all
            mortgages in Ontario
          </Text>
          {loadingDocuments ? (
            <ActivityIndicator
              size="large"
              color={COLORS.green}
              style={styles.loadingIndicator}
            />
          ) : (
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
                clientFromContext.applyingbehalf.toLowerCase() === "other" && (
                  <View>
                    <Text style={styles.sectionHeader}>
                      {"WHAT'S NEEDED FOR " +
                        (clientFromContext.otherDetails?.name || "")}
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
          )}
        </View>
      </ScrollView>
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
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            <ClientProfile onClose={() => setShowProfile(false)} />
          </View>
        </View>
      </ReactNativeModal>
      {/* Upload Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              capturedImages.length > 0 && styles.modalContentFullscreen,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDocType}</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeModal}
              >
                <Text style={styles.closeModalText}>X</Text>
              </TouchableOpacity>
            </View>
            {capturedImages.length > 0 ? (
              <>
                <ScrollView style={styles.imageScrollView}>
                  <View style={styles.imageGrid}>
                    {capturedImages.map((uri, index) => (
                      <View key={index} style={styles.gridItem}>
                        <Image
                          source={{ uri }}
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <View style={styles.bottomButtonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.backButton]}
                    onPress={() => setCapturedImages([])}
                  >
                    <Text style={styles.backButtonText}>{"<-"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addMoreButton]}
                    onPress={pickCameraFile}
                  >
                    <Text style={styles.actionButtonText}>
                      Add Another Photo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.doneButton]}
                    onPress={convertImagesToPDF}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : !selectedFile ? (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonHalf]}
                  onPress={pickCameraFile}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText}>Take Picture</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonHalf]}
                  onPress={pickDocumentFile}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText}>Upload from files</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.fileSelected}>
                {selectedFile?.name || "File selected"}
              </Text>
            )}
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={COLORS.green}
                style={styles.loadingIndicator}
              />
            )}
            {selectedFile && (
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  uploadLoading && styles.buttonDisabled,
                ]}
                onPress={handleUpload}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      {/* Complete Document Modal */}
      <Modal
        visible={showCompleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCompleteDoc?.displayName ||
                  selectedCompleteDoc?.docType}
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.closeModalText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.completeModalText}>
              You have already submitted this document and accepted as valid
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCompleteModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Submitted Document Modal */}
      <Modal
        visible={showSubmittedModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSubmittedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSubmittedDoc?.displayName ||
                  selectedSubmittedDoc?.docType}
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowSubmittedModal(false)}
              >
                <Text style={styles.closeModalText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.completeModalText}>
              You have already submitted this document. If you wish to reupload
              it, delete the existing doc and try again.
            </Text>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  deleteLoading && styles.buttonDisabled,
                ]}
                onPress={() => handleDeleteDocument(selectedSubmittedDoc)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.nevermindButton]}
                onPress={() => setShowSubmittedModal(false)}
              >
                <Text style={styles.modalButtonText}>Never Mind</Text>
              </TouchableOpacity>
            </View>
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
        onRequestClose={() => setShowQuestionnaire(false)}
      >
        <QuestionnaireProvider>
          <Questionnaire
            navigation={{
              goBack: () => setShowQuestionnaire(false),
            }}
          />
        </QuestionnaireProvider>
      </Modal>
      <NotificationComponent
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={clientFromContext.id}
      />
    </SafeAreaView>
  );
};

export default ClientHome;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6F6", // Updated to your preferred background color
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 32,
    paddingTop: 60, // Reserve 68px for mobile status bar
    paddingBottom: 8,
    justifyContent: "space-between",
    width: "100%",
    height: 126, // Exact height as specified
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    maxWidth: "70%",
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
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
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "Futura",
    lineHeight: 14,
  },
  clientName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    lineHeight: 16,
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
    marginRight: 8,
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
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
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
    marginBottom: 32,
    fontFamily: "Futura",
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
    fontSize: 14, // P size
    fontWeight: "500", // P weight
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
    width: 75,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: 0,
  },
  submittedPillText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: 0,
  },
  completePillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: 0,
  },
  submittedPill: {
    backgroundColor: "transparent",
    borderRadius: 50,
    paddingTop: 13,
    paddingRight: 24,
    paddingBottom: 13,
    paddingLeft: 24,
    width: 114,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  completePill: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    borderRadius: 50,
    paddingTop: 13,
    paddingRight: 24,
    paddingBottom: 13,
    paddingLeft: 24,
    width: 114,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
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
    backgroundColor: COLORS.white,
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
  questionnaireButtonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  questionnaireButton: {
    backgroundColor: COLORS.green,
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
    justifyContent: "center",
  },
  testQuestionnaireButton: {
    backgroundColor: COLORS.orange,
  },
  questionnaireButtonText: {
    color: COLORS.white,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    fontFamily: "Futura",
  },
});
