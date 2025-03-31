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
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useAuth } from "./context/AuthContext";
import { useClient } from "./context/ClientContext";
import ClientProfile from "./ClientProfile";

const ClientHome = () => {
  const { auth } = useAuth();
  const { documents: contextDocuments } = useClient();
  const [showProfile, setShowProfile] = useState(false);

  const clientFromContext = auth.client;
  const clientId = clientFromContext.id;

  const [documentsFromApi, setDocumentsFromApi] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [clientDocs, setClientDocs] = useState(contextDocuments || []);

  // Modal state for file upload
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // State for scanned pages (for camera scanning option)
  const [scannedPages, setScannedPages] = useState([]);

  // Update clientDocs when context changes
  useEffect(() => {
    setClientDocs(contextDocuments || []);
  }, [contextDocuments]);

  // Fetch needed documents from API
  useEffect(() => {
    if (clientId) {
      setLoadingDocuments(true);
      fetch(`http://54.89.183.155:5000/client/neededdocument/${clientId}`)
        .then((response) => response.json())
        .then((data) => {
          setDocumentsFromApi(data.documents_needed || []);
          setLoadingDocuments(false);
        })
        .catch((err) => {
          console.error("Error fetching needed documents:", err);
          setLoadingDocuments(false);
        });
    }
  }, [clientId]);

  // Merge API documents with clientDocs (case-insensitive)
  const getMergedDocuments = () => {
    return documentsFromApi.map((apiDoc) => {
      const clientDoc = clientDocs.find(
        (doc) => doc.docType?.toLowerCase() === apiDoc.docType?.toLowerCase()
      );
      return clientDoc ? { ...apiDoc, ...clientDoc } : apiDoc;
    });
  };

  const mergedDocuments = getMergedDocuments();
  const docsNeeded = mergedDocuments.filter((doc) => doc.type === "Needed");
  const docsRequested = mergedDocuments.filter(
    (doc) => doc.type === "Requested"
  );

  // Handlers for file upload modal
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

  // Option 1: Pick a PDF file using DocumentPicker
  const pickDocumentFile = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (
        result.type === "success" &&
        result.assets &&
        result.assets.length > 0
      ) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
        };
        setSelectedFile(file);
      }
    } catch (error) {
      console.error("DocumentPicker error:", error);
      Alert.alert(
        "File Selection Error",
        "Failed to select PDF file. Please try again."
      );
    }
  };

  // Option 2: Use the camera to scan pages and convert them into a PDF
  const pickCameraFile = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permissions are required to scan a document."
        );
        return;
      }

      const scanPage = async () => {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          return asset.uri;
        }
        return null;
      };

      let pages = [];
      let scanning = true;
      while (scanning) {
        const pageUri = await scanPage();
        if (pageUri) {
          pages.push(pageUri);
          scanning = await new Promise((resolve) => {
            Alert.alert(
              "Add Another Page?",
              `Page ${pages.length} scanned. Would you like to scan another page?`,
              [
                { text: "Done", onPress: () => resolve(false) },
                { text: "Scan Next", onPress: () => resolve(true) },
              ]
            );
          });
        } else {
          scanning = false;
        }
      }

      if (pages.length > 0) {
        // Convert each page to base64 image and embed into HTML for PDF conversion
        const pagesHtml = await Promise.all(
          pages.map(async (pageUri) => {
            const response = await fetch(pageUri);
            const blob = await response.blob();
            const base64Image = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            return `<img src="${base64Image}" style="page-break-after: always;" />`;
          })
        );

        const html = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body, html { margin: 0; padding: 0; }
                img { width: 100%; height: auto; max-width: 595px; display: block; margin: 0 auto; object-fit: contain; }
              </style>
            </head>
            <body>
              ${pagesHtml.join("")}
            </body>
          </html>
        `;

        const { uri: pdfUri } = await Print.printToFileAsync({
          html,
          width: 595,
          height: 842,
          base64: false,
        });

        setSelectedFile({
          uri: pdfUri,
          name: `scanned-document-${Date.now()}.pdf`,
          type: "application/pdf",
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Camera Error", "Failed to capture image. Please try again.");
    }
  };

  // Show an alert to choose between PDF upload and scanning
  const handleFileSelection = () => {
    Alert.alert("Select Option", "Choose how to attach the document", [
      { text: "Upload PDF", onPress: pickDocumentFile },
      { text: "Scan Document", onPress: pickCameraFile },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      alert("No file or document type selected");
      return;
    }
    try {
      let formData = new FormData();
      formData.append("docType", selectedDocType);
      // Normalize URI for iOS if needed
      const fileToUpload = {
        uri:
          Platform.OS === "android"
            ? selectedFile.uri
            : selectedFile.uri.replace("file://", ""),
        name: selectedFile.name || "document.pdf",
        type: "application/pdf",
      };
      formData.append("pdfFile", fileToUpload);
      const response = await fetch(
        `http://54.89.183.155:5000/documents/${clientId}/documents`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        alert("Upload failed: " + (errData.error || "Unknown error"));
        return;
      }
      const data = await response.json();
      setClientDocs((prevDocs) => {
        const existingIndex = prevDocs.findIndex(
          (d) => d.docType.toLowerCase() === selectedDocType.toLowerCase()
        );
        if (existingIndex === -1) {
          return [...prevDocs, data.document];
        } else {
          const updated = [...prevDocs];
          updated[existingIndex] = data.document;
          return updated;
        }
      });
      alert("Document uploaded successfully!");
      closeModal();
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert(
        "Upload Error",
        "Something went wrong uploading the document."
      );
    }
  };

  // Render a single document row
  const renderDocumentRow = (doc) => {
    const getStatusPill = () => {
      const lowerStatus = doc.status?.toLowerCase();
      if (lowerStatus === "pending" || lowerStatus === "rejected") {
        return (
          <TouchableOpacity
            style={styles.addPill}
            onPress={() => handleAdd(doc.docType)}
          >
            <Text style={styles.addPillText}>Add</Text>
          </TouchableOpacity>
        );
      } else if (lowerStatus === "submitted") {
        return (
          <View style={styles.submittedPill}>
            <Text style={styles.submittedPillText}>Submitted</Text>
          </View>
        );
      } else if (lowerStatus === "approved" || lowerStatus === "complete") {
        return (
          <View style={styles.completePill}>
            <Text style={styles.completePillText}>Complete</Text>
          </View>
        );
      } else {
        return (
          <TouchableOpacity
            style={styles.addPill}
            onPress={() => handleAdd(doc.docType)}
          >
            <Text style={styles.addPillText}>Add</Text>
          </TouchableOpacity>
        );
      }
    };

    return (
      <View key={doc.docType} style={styles.docItem}>
        <Text style={styles.docLabel}>{doc.docType}</Text>
        {getStatusPill()}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.initials}
          onPress={() => setShowProfile(true)}
        >
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>
              {clientFromContext?.name
                ? clientFromContext.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "SM"}
            </Text>
          </View>
          <Text style={styles.welcomeName}>
            Welcome {clientFromContext.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView style={styles.mainContent}>
        <Text style={styles.bigTitle}>Everything need for a mortgage</Text>
        <Text style={styles.subTitle}>
          We understand we are asking for a lot but it’s what’s needed for all
          mortgages in Ontario
        </Text>

        {/* Profile Modal */}
        <Modal
          visible={showProfile}
          animationType="slide"
          transparent={true}
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

        {loadingDocuments ? (
          <ActivityIndicator
            size="large"
            color="#019B8E"
            style={styles.loadingIndicator}
          />
        ) : (
          <>
            {/* SECTION 1: WHAT'S NEEDED FOR YOU */}
            <Text style={styles.sectionHeader}>WHAT’S NEEDED FOR YOU</Text>
            <View style={styles.docsContainer}>
              {docsNeeded.length > 0 ? (
                docsNeeded.map(renderDocumentRow)
              ) : (
                <Text style={styles.noDocsText}>No documents needed.</Text>
              )}
            </View>

            {/* SECTION 2: WHAT'S NEEDED FOR YOUR REALTOR */}
            <Text style={styles.sectionHeader}>
              WHAT’S NEEDED FOR YOUR REALTOR
            </Text>
            <View style={styles.docsContainer}>
              {docsRequested.length > 0 ? (
                docsRequested.map(renderDocumentRow)
              ) : (
                <Text style={styles.noDocsText}>No documents requested.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* FILE UPLOAD MODAL */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
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
              style={styles.selectFileButton}
              onPress={handleFileSelection}
            >
              <Text style={styles.selectFileButtonText}>
                {selectedFile ? selectedFile.name : "Select File"}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
  },
  initials: {
    flexDirection: "row",
    alignItems: "center",
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  welcomeName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helpButton: {
    backgroundColor: "#019B8E",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  docLabel: {
    fontSize: 14,
    color: "#23231A",
    fontWeight: "500",
  },
  // Pill styles
  addPill: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
