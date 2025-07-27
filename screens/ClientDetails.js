import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
  Button,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import RequestDocumentModal from "./RequestDocumentModal.js"; // Ensure this is a React Native component
import Toast from "react-native-toast-message"; // Make sure to set up this library if used
import { generateInitialsFromFullName } from "../utils/initialsUtils";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",
  noticeContainer: "rgba(55, 116, 115, 0.25)", // 25% green opacity
  coloredBackgroundFill: "rgba(55, 116, 115, 0.1)", // 10% green opacity
};

const ClientDetails = () => {
  const navigation = useNavigation();
  // Get clientId from navigation route parameters
  const { clientId, statusText, inviteId } = useRoute().params;
  console.log("Invite ID:", inviteId); // Debugging line to check inviteId
  const { auth } = useAuth();
  const { realtor } = auth;
  const realtorId = realtor.id; // Keep this line as it is the correct declaration

  const [client, setClient] = useState(null);
  const [requestedDocs, setRequestedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [showClientReferralModal, setShowClientReferralModal] = useState(false);
  // Properly declare downloadProgress state
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/client/${clientId}`
      );
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  const fetchRequestedDocuments = async () => {
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/requesteddocument/${realtorId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRequestedDocs(data);
      }
    } catch (error) {
      console.error("Error fetching requested documents:", error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchClientDetails();
    await fetchRequestedDocuments();
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [clientId, realtorId]);

  const handleRequestDocument = async ({ docType, description }) => {
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/requestdocument/${realtorId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docType, description, clientId }),
        }
      );
      if (response.ok) {
        setIsModalOpen(false);
        await refreshData(); // Add this line to refresh the data
        Toast.show({
          // Add success feedback
          type: "success",
          text1: "Document requested successfully",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Error requesting document:", error);
      Toast.show({
        // Add error feedback
        type: "error",
        text1: "Failed to request document",
        position: "top",
      });
    }
  };

  const handleReview = async (clientId, docId, newStatus) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/admin/documents/${clientId}/${docId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      await refreshData();
      Toast.show({
        type: "success",
        text1: `Document ${newStatus}`,
        position: "top",
      });
    } catch (error) {
      console.error("Error updating document status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update document status",
        position: "top",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleView = (doc) => {
    console.log("viewing doc", doc);
    if (doc.fileId) {
      Linking.openURL(
        `http://159.203.58.60:5000/documents/${clientId}/documents/${doc.fileId}`
      );
    }
  };

  const handleApprove = (doc) => {
    handleReview(clientId, doc.fileId, "Approved");
  };

  const handleReject = (doc) => {
    handleReview(clientId, doc.fileId, "Rejected");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#019B8E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            Alert.alert(
              "Delete Client",
              "Are you sure you want to delete this client?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setLoading(true);
                      const response = await fetch(
                        `http://159.203.58.60:5000/Realtor/DeleteClient`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ inviteId, realtorId }),
                        }
                      );
                      setLoading(false);
                      console.log("Delete response:", response.json());
                      if (response.ok) {
                        Alert.alert("Success", "Client deleted successfully", [
                          {
                            text: "OK",
                            onPress: () => {
                              navigation.goBack();
                            },
                          },
                        ]);
                        // Optionally, navigate back or refresh
                      } else {
                        Alert.alert("Error", "Failed to delete client", [
                          {
                            text: "OK",
                            onPress: () => {
                              navigation.goBack();
                            },
                          },
                        ]);
                      }
                    } catch (error) {
                      setLoading(false);
                      Alert.alert("Error", "Failed to delete client", [
                        { text: "OK", onPress: () => {} },
                      ]);
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>Delete Client</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{statusText || "Client not found"}</Text>
      </View>
    );
  }

  // Merge the client's submitted documents with the requested documents by comparing document type (case-insensitive)
  const mergedDocs = requestedDocs.map((reqDoc) => {
    const matchingClientDoc = client.documents.find(
      (clientDoc) =>
        clientDoc.docType.toLowerCase() === reqDoc.docType.toLowerCase()
    );
    return {
      docType: reqDoc.docType,
      requestedStatus: reqDoc.status,
      clientStatus: matchingClientDoc
        ? matchingClientDoc.status
        : "Not Submitted",
      fileId: matchingClientDoc ? matchingClientDoc._id : null,
      fileName: matchingClientDoc ? matchingClientDoc.fileName : null,
      requestId: reqDoc._id,
    };
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.clientHeader}>
        <Text style={styles.clientName}>{client.name}</Text>
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText}>
            {generateInitialsFromFullName(client.name)}
          </Text>
        </View>
      </View>

      <RequestDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRequestDocument}
      />

      <View style={styles.contentWrapper}>
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Review</Text>
          {mergedDocs && mergedDocs.length > 0 ? (
            mergedDocs.map((doc, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.docTitle}>{doc.docType}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusColor(doc.clientStatus) },
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {doc.clientStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  {doc.fileId && (
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleView(doc)}
                    >
                      <Text style={styles.viewButtonText}>View Document</Text>
                    </TouchableOpacity>
                  )}
                  {doc.clientStatus === "Submitted" && (
                    <View style={styles.approvalButtons}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(doc)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.approveButtonText}>
                          {isProcessing ? "Processing..." : "Approve"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(doc)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.rejectButtonText}>
                          {isProcessing ? "Processing..." : "Reject"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>No documents to review</Text>
          )}
        </View> */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Submitted</Text>
          {client.documents && client.documents.length > 0 ? (
            client.documents.map((doc, index) => (
              <View key={index} style={styles.documentCard}>
                <View style={styles.documentInfo}>
                  <Text style={styles.docTitle}>{doc.docType}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusColor(doc.status) },
                    ]}
                  >
                    <Text style={styles.statusPillText}>{doc.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>No documents submitted yet</Text>
          )}
        </View>
        {statusText === "Completed" && (
          <TouchableOpacity
            style={[
              styles.viewDetailsButton,
              {
                backgroundColor: COLORS.blue,
                borderRadius: 33,
              },
            ]}
            onPress={async () => {
              setLoadingDownload(true);
              setDownloadProgress(0);
              try {
                // Use XMLHttpRequest for progress
                const xhr = new XMLHttpRequest();
                xhr.open(
                  "POST",
                  "http://159.203.58.60:5000/pdf/download-filled-pdf",
                  true
                );
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.responseType = "blob";
                xhr.onprogress = (event) => {
                  if (event.lengthComputable) {
                    setDownloadProgress(
                      Math.round((event.loaded / event.total) * 100)
                    );
                  }
                };
                xhr.onload = async function () {
                  if (xhr.status === 200) {
                    try {
                      const blob = xhr.response;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          const base64data = reader.result.split(",")[1];
                          const fileUri =
                            FileSystem.cacheDirectory + "referral.pdf";
                          await FileSystem.writeAsStringAsync(
                            fileUri,
                            base64data,
                            {
                              encoding: FileSystem.EncodingType.Base64,
                            }
                          );
                          if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(fileUri);
                          }
                          setLoadingDownload(false);
                          setShowClientReferralModal(false);
                        } catch (err) {
                          console.log(err);
                          setLoadingDownload(false);
                        }
                      };
                      reader.readAsDataURL(blob);
                    } catch (err) {
                      console.log(err);
                      setLoadingDownload(false);
                    }
                  } else {
                    setLoadingDownload(false);
                  }
                };
                xhr.onerror = function () {
                  setLoadingDownload(false);
                };
                xhr.send(
                  JSON.stringify({
                    clientId: clientId,
                    type: "realtorRewardPdf",
                  })
                );
              } catch (err) {
                console.log(err);
                setLoadingDownload(false);
              }
            }}
          >
            {loadingDownload ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text
                  style={[styles.viewDetailsButtonText, { marginLeft: 10 }]}
                >
                  {`Downloading... ${downloadProgress}%`}
                </Text>
              </View>
            ) : (
              <Text style={styles.viewDetailsButtonText}>
                DOWNLOAD REFERRAL
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

// Helper function to map status to colors
const getStatusColor = (status) => {
  const s = status.toLowerCase();
  if (s === "approved") return "#28a745";
  if (s === "submitted") return "#ffc107";
  if (s === "rejected") return "#dc3545";
  return "#6c757d";
};

const styles = StyleSheet.create({
  deleteButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#dc3545",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  clientHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  clientName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#23231A",
  },
  statusBadge: {
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    color: "#23231A",
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2271B1", // Blue color
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  initialsText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF", // White text
  },
  requestButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  contentWrapper: {
    marginTop: 20,
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
  },
  statusPill: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  viewButton: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  approvalButtons: {
    flexDirection: "row",
  },
  approveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  emptyState: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  documentCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  documentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#23231A",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
  },
  // Modal styles
  formOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 8,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#23231A",
  },
  toggleButtons: {
    flexDirection: "row",
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#019B8E",
    padding: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#019B8E",
  },
  toggleButtonText: {
    color: "#019B8E",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formButton: {
    flex: 1,
    backgroundColor: "#019B8E",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
  },
  formButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingButton: {
    opacity: 0.7,
  },
  feedbackMessage: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  viewDetailsButton: {
    position: "absolute",
    bottom: 30,
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    width: "80%",
  },
  viewDetailsButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
});

export default ClientDetails;
