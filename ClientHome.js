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
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";
import ClientProfile from "./ClientProfile";

const ClientHome = () => {
  const { auth } = useAuth();
  const { documents: contextDocuments, clientInfo } = useClient();
  const [showProfile, setShowProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Pull in contextDocs when they change
  useEffect(() => {
    setClientDocs(contextDocuments || []);
  }, [contextDocuments]);

  // Fetch what's needed
  useEffect(() => {
    if (!clientId) return;
    setLoadingDocuments(true);
    fetch(`http://54.89.183.155:5000/client/neededdocument/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setDocumentsFromApi(data.documents_needed || []);
        setLoadingDocuments(false);
      })
      .catch((e) => {
        console.error(e);
        setLoadingDocuments(false);
      });
  }, [clientId]);

  // Merge API + client uploads
  const merged = documentsFromApi.map((apiDoc) => {
    const match = clientDocs.find(
      (d) => d.docType?.toLowerCase() === apiDoc.docType?.toLowerCase()
    );
    return match ? { ...apiDoc, ...match } : apiDoc;
  });

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

      const snap = async () => {
        try {
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            allowsEditing: true,
            quality: 0.8,
          });
          if (!r.canceled && r.assets?.length) return r.assets[0].uri;
          return null;
        } catch (err) {
          console.error("Camera error:", err);
          Alert.alert(
            "Camera Error",
            "Failed to capture image. Please try again.",
            [{ text: "OK" }]
          );
          return null;
        }
      };

      let pages = [],
        again = true;
      while (again) {
        const uri = await snap();
        if (uri) {
          pages.push(uri);
          again = await new Promise((res) =>
            Alert.alert("Another page?", `Scanned ${pages.length}. More?`, [
              { text: "No", onPress: () => res(false) },
              { text: "Yes", onPress: () => res(true) },
            ])
          );
        } else again = false;
      }

      if (pages.length) {
        const html = await Promise.all(
          pages.map(async (u) => {
            const blob = await (await fetch(u)).blob();
            const b64 = await new Promise((res) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result);
              r.readAsDataURL(blob);
            });
            return `<img src="${b64}" style="page-break-after: always;" />`;
          })
        ).then(
          (arr) => `
        <html><body style="margin:0">${arr.join("")}</body></html>
      `
        );

        const { uri: pdfUri } = await Print.printToFileAsync({ html });
        setSelectedFile({
          uri: pdfUri,
          name: `scan-${Date.now()}.pdf`,
          type: "application/pdf",
        });
      }
    } catch (error) {
      Alert.alert(
        "Scanner Error",
        "An unexpected error occurred while accessing the camera.",
        [{ text: "OK" }]
      );
    }
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
    ]);

  // Upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      return Alert.alert("Select file/type");
    }
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
        `http://54.89.183.155:5000/documents/${clientId}/documents`,
        {
          method: "POST",
          body: data,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (!resp.ok) throw new Error("upload failed");
      const json = await resp.json();
      setClientDocs((prev) => {
        const i = prev.findIndex(
          (d) => d.docType.toLowerCase() === selectedDocType.toLowerCase()
        );
        if (i < 0) return [...prev, json.document];
        const upd = [...prev];
        upd[i] = json.document;
        return upd;
      });
      Alert.alert("Uploaded!");
      closeModal();
    } catch (e) {
      Alert.alert("Error", "Upload failed");
    }
  };

  // Refresh logic
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    auth.refetch?.().finally(() => setRefreshing(false));
  }, [auth]);

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

  // Render row
  const renderDocumentRow = (doc) => {
    const status = doc.status?.toLowerCase();
    let action = null;
    if (status === "pending" || status === "rejected") {
      action = (
        <TouchableOpacity
          style={styles.addPill}
          onPress={() => handleAdd(doc.docType)}
        >
          <Text style={styles.addPillText}>Add</Text>
        </TouchableOpacity>
      );
    } else if (status === "submitted") {
      action = (
        <View style={styles.submittedPill}>
          <Text style={styles.submittedPillText}>Submitted</Text>
        </View>
      );
    } else if (status === "approved" || status === "complete") {
      action = (
        <View style={styles.completePill}>
          <Text style={styles.completePillText}>Complete</Text>
        </View>
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
                      WHAT’S NEEDED FOR{" "}
                      {clientFromContext.otherDetails?.name || ""}
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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Document</Text>
            <Text style={styles.modalSubtitle}>
              You are uploading for:{" "}
              <Text style={{ fontWeight: "bold" }}>{selectedDocType}</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.selectFileButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleFileSelection}
              disabled={isLoading}
            >
              <Text style={styles.selectFileButtonText}>
                {isLoading ? "Loading..." : selectedFile?.name || "Select File"}
              </Text>
            </TouchableOpacity>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color="#019B8E"
                style={styles.loadingIndicator}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
              >
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  helpButton: {
    backgroundColor: "#019B8E",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
    marginLeft: "auto", // Push to the right
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
    gap: 8, // Add gap between label and button
  },
  docLabel: {
    fontSize: 14,
    color: "#23231A",
    fontWeight: "500",
    flex: 1, // Allow label to take available space
    marginRight: 8, // Add margin to separate from button
  },
  // Pill styles
  addPill: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 85, // Add minimum width
    alignItems: "center", // Center text
    flexShrink: 0, // Prevent shrinking
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
    minWidth: 85, // Add minimum width
    alignItems: "center", // Center text
    flexShrink: 0, // Prevent shrinking
  },
  submittedPillText: {
    color: "blue",
    fontSize: 14,
    fontWeight: "600",
  },
  completePill: {
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 85, // Add minimum width
    alignItems: "center", // Center text
    flexShrink: 0, // Prevent shrinking
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: "#666",
  },
  selectFileButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  selectFileButtonText: {
    textAlign: "center",
    color: "#333",
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  uploadButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#666",
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
});
