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

  const clientFromContext = clientInfo || auth.client;

  console.log("Client from context:", clientFromContext);
  const clientId = clientFromContext.id;

  const [documentsFromApi, setDocumentsFromApi] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [clientDocs, setClientDocs] = useState(contextDocuments || []);

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });
      if (res.type === "success") {
        setSelectedFile({ uri: res.uri, name: res.name, type: res.mimeType });
      }
    } catch (e) {
      Alert.alert("File error", "Could not pick file");
    }
  };

  // Scan & PDF
  const pickCameraFile = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission denied", "Camera needed");
    }

    const snap = async () => {
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!r.canceled && r.assets?.length) return r.assets[0].uri;
      return null;
    };

    let pages = [],
      again = true;
    while (again) {
      const uri = await snap();
      if (uri) {
        pages.push(uri);
        // ask
        // eslint-disable-next-line no-await-in-loop
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
  };

  // Choose method
  const handleFileSelection = () =>
    Alert.alert("Attach document", "", [
      { text: "Upload PDF", onPress: pickDocumentFile },
      { text: "Scan Document", onPress: pickCameraFile },
      { text: "Cancel", style: "cancel" },
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
          <Text style={styles.welcomeName}>
            Welcome {clientFromContext.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent}>
        <Text style={styles.bigTitle}>Everything need for a mortgage</Text>
        <Text style={styles.subTitle}>
          We understand we are asking for a lot but it’s what’s needed for all
          mortgages in Ontario
        </Text>

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

        {loadingDocuments ? (
          <ActivityIndicator
            size="large"
            color="#019B8E"
            style={styles.loadingIndicator}
          />
        ) : (
          <>
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
                <>
                  {" "}
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
                </>
              )}
          </>
        )}
      </ScrollView>

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
              style={styles.selectFileButton}
              onPress={handleFileSelection}
            >
              <Text style={styles.selectFileButtonText}>
                {selectedFile?.name || "Select File"}
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
