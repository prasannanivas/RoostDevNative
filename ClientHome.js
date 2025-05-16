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

const ClientHome = () => {
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
        `http://44.202.249.124:5000/documents/${clientId}/documents`,
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
        `http://44.202.249.124:5000/documents/${clientId}/documents/${documentDetails._id}`,
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
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleNotifications}
      >
        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
            <ActivityIndicator size="small" color="blue" />
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
            <ActivityIndicator size="small" color="blue" />
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
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.completePillText}>Complete</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.initials}
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
          <Text
            style={styles.welcomeName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Welcome {clientFromContext.name}
          </Text>
        </TouchableOpacity>

        {renderNotificationButton()}

        <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              color="#019B8E"
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
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            <TouchableOpacity
              style={styles.closeProfileButton}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.closeProfileText}>×</Text>
            </TouchableOpacity>
            <ClientProfile />
          </View>
        </View>
      </Modal>

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
                color="#019B8E"
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
    backgroundColor: "#FFFFFF",
  },
  /* TOP HEADER STYLING */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23231A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    width: "100%",
    paddingRight: Platform.OS === "ios" ? 24 : 16, // Add more padding on iOS
  },
  initials: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    maxWidth: "80%", // Limit width to prevent overlap
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  welcomeName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  removeButtonText: {
    backgroundColor: "#019B8E",
    color: "#FFFFFF",
    textAlign: "center",
    borderRadius: 50,
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
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  helpButton: {
    backgroundColor: "#019B8E",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  bigTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#23231A",
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  docsContainer: {
    marginBottom: 25,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    gap: 8,
  },
  docLabel: {
    fontSize: 14,
    color: "#23231A",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  // Pill styles
  addPill: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 85,
    alignItems: "center",
    flexShrink: 0,
  },
  closeModalButton: {
    color: "#23231A",
    fontWeight: "600",
    fontSize: 24,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  closeModalText: {
    color: "#23231A",
  },
  addPillText: {
    color: "blue",
    fontSize: 14,
    fontWeight: "600",
  },
  submittedPill: {
    borderColor: "blue",
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 85,
    alignItems: "center",
    flexShrink: 0,
  },
  submittedPillText: {
    color: "blue",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  completePill: {
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 85,
    alignItems: "center",
    flexShrink: 0,
  },
  completePillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  noDocsText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginVertical: 10,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  /* FILE UPLOAD MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    position: "relative",
  },
  modalContentFullscreen: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    borderRadius: 0,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 40 : 20, // Add more padding for iOS notch
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#23231A",
    flex: 1,
  },
  removeButton: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  removeButtonText: {
    backgroundColor: "#019B8E",
    color: "#FFFFFF",
    textAlign: "center",
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  imageScrollView: {
    flex: 1,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#ffffff",
  },
  gridItem: {
    width: "48%",
    aspectRatio: 0.75,
    marginBottom: 24,
    position: "relative",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
    padding: 4,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#000",
  },
  bottomButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#666",
    fontSize: 14,
  },
  addMoreButton: {
    backgroundColor: "#019B8E",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 12,
  },
  doneButton: {
    backgroundColor: "#019B8E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginVertical: 15,
  },
  actionButtonText: {
    backgroundColor: "#019B8E",
    color: "#fff",
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#019B8E",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  actionButtonHalf: {
    flex: 1,
  },
  fileSelected: {
    textAlign: "center",
    marginVertical: 15,
    color: "#666",
  },
  uploadButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 15,
    width: "100%",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  /* PROFILE MODAL */
  profileModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  profileModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeProfileButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  closeProfileText: {
    fontSize: 24,
    color: "#333",
  },
  completeModalText: {
    fontSize: 16,
    color: "#23231A",
    textAlign: "center",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 15,
    width: "100%",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  nevermindButton: {
    backgroundColor: "#019B8E",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pillDisabled: {
    opacity: 0.7,
  },
});
