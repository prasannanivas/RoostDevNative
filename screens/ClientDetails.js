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
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../context/AuthContext";
import RequestDocumentModal from "./RequestDocumentModal.js"; // Ensure this is a React Native component
import Toast from "react-native-toast-message"; // Make sure to set up this library if used
import { generateInitialsFromFullName } from "../utils/initialsUtils";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Svg, { Circle, G, Rect, Path, Defs, ClipPath } from "react-native-svg";
import { formatPhoneNumber } from "../utils/phoneFormatUtils.js";

const COLORS = {
  green: "#377473",
  teal: "#4A8B8A",
  background: "#F6F6F6",
  black: "#1D2327",
  slate: "#707070",
  gray: "#5A5A5A",
  lightGray: "#CCCCCC",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#C41E3A",
  noticeContainer: "rgba(55, 116, 115, 0.25)", // 25% green opacity
  coloredBackgroundFill: "rgba(55, 116, 115, 0.1)", // 10% green opacity
};

// Custom SVG Icons
const ApprovedIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#377473" />
    <Path
      d="M17.3333 8L9.99996 15.3333L6.66663 12"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RejectedIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_1825_1898)">
      <Rect width="24" height="24" rx="12" fill="#A20E0E" />
      <Path
        d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16"
        stroke="#FDFDFD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1825_1898">
        <Rect width="24" height="24" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

const ClientDetails = ({
  visible,
  onClose,
  clientId,
  statusText,
  inviteId,
  onDelete,
  clientData,
}) => {
  console.log("Client Data:", clientData); // Debugging line to check clientData
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
        `https://signup.roostapp.io/client/${clientId}`
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
        `https://signup.roostapp.io/realtor/requesteddocument/${realtorId}`,
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

  // Helpers for invite actions (copy/send)
  const getInviteLink = () => clientData?.inviteLink || "";
  const buildInviteMessage = () =>
    `Please accept my invitation to sign up and complete your details: ${getInviteLink()}`;

  const copyLink = async () => {
    const link = getInviteLink();
    if (!link) {
      Alert.alert("No Link", "No invite link available to copy.");
      return;
    }
    try {
      await Clipboard.setStringAsync(link);
      Toast.show({ type: "success", text1: "Invite link copied" });
    } catch (e) {
      Alert.alert("Copy Failed", "Unable to copy the invite link.");
    }
  };

  const handleSendEmail = async () => {
    const email = clientData?.email;
    const link = getInviteLink();
    if (!link) {
      Alert.alert(
        "No Link",
        "No invite link available to include in the email."
      );
      return;
    }
    const body = encodeURIComponent(buildInviteMessage());
    const subject = encodeURIComponent("Invitation from Roost");
    if (!email) {
      Alert.alert("No Email", "This client does not have an email on file.");
      return;
    }
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else
        Alert.alert("Not Supported", "Email is not available on this device.");
    } catch (e) {
      Alert.alert("Error", "Unable to open email composer.");
    }
  };

  const handleSendSms = async () => {
    const phone = clientData?.phone || "";
    const link = getInviteLink();
    if (!link) {
      Alert.alert(
        "No Link",
        "No invite link available to include in the message."
      );
      return;
    }
    const body = encodeURIComponent(buildInviteMessage());
    if (!phone) {
      Alert.alert(
        "No Phone",
        "This client does not have a phone number on file."
      );
      return;
    }
    // iOS uses '&body=' when number is present; Android uses '?body='
    const delimiter = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${phone}${delimiter}body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Not Supported", "SMS is not available on this device.");
    } catch (e) {
      Alert.alert("Error", "Unable to open SMS composer.");
    }
  };

  const handleRequestDocument = async ({ docType, description }) => {
    try {
      const response = await fetch(
        `https://signup.roostapp.io/realtor/requestdocument/${realtorId}`,
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
        `https://signup.roostapp.io/admin/documents/${clientId}/${docId}/review`,
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
        `https://signup.roostapp.io/documents/${clientId}/documents/${doc.fileId}`
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
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
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
                          `https://signup.roostapp.io/Realtor/DeleteClient`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ inviteId, realtorId }),
                          }
                        );
                        setLoading(false);
                        console.log("Delete response:", response.json());
                        if (response.ok) {
                          Alert.alert(
                            "Success",
                            "Client deleted successfully",
                            [
                              {
                                text: "OK",
                                onPress: () => {
                                  if (onDelete) onDelete();
                                  onClose();
                                },
                              },
                            ]
                          );
                          // Optionally, navigate back or refresh
                        } else {
                          Alert.alert("Error", "Failed to delete client", [
                            {
                              text: "OK",
                              onPress: async () => {
                                if (onDelete) await onDelete();
                                onClose();
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
          <Text style={styles.errorText}>
            {statusText || "Client not found"}
          </Text>
          <View style={styles.detailsCard}>
            {clientData?.referenceName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{clientData.referenceName}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <View style={styles.infoValueWithActions}>
                <Text
                  style={styles.infoValue}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {clientData?.email || "—"}
                </Text>
                {clientData?.email && clientData?.inviteLink ? (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleSendEmail}
                    accessibilityLabel="Send email invitation"
                  >
                    <Ionicons name="send" size={18} color="#2271B1" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <View style={styles.infoValueWithActions}>
                <Text
                  style={styles.infoValue}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {clientData?.phone || "—"}
                </Text>
                {clientData?.phone && clientData?.inviteLink ? (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleSendSms}
                    accessibilityLabel="Send SMS invitation"
                  >
                    <Ionicons name="send" size={18} color="#2271B1" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invite Link</Text>
              <View style={styles.infoValueWithActions}>
                <Text
                  style={[styles.infoValue, styles.linkValue]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {clientData?.inviteLink || "—"}
                </Text>
                {clientData?.inviteLink ? (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={copyLink}
                    accessibilityLabel="Copy invite link"
                  >
                    <Ionicons name="copy" size={18} color="#2271B1" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {!!clientData?.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{clientData.status}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalWrapper}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M13 0C5.82075 0 0 5.8201 0 13C0 20.1799 5.8201 26 13 26C20.1799 26 26 20.1799 26 13C26 5.8201 20.1799 0 13 0ZM13 24.401C6.7275 24.401 1.625 19.2725 1.625 13C1.625 6.7275 6.7275 1.625 13 1.625C19.2725 1.625 24.375 6.7275 24.375 13C24.375 19.2725 19.2725 24.401 13 24.401ZM17.5961 8.4045C17.2793 8.08763 16.7648 8.08763 16.4473 8.4045L13.0007 11.8511L9.55402 8.4045C9.23715 8.08763 8.72202 8.08763 8.4045 8.4045C8.08698 8.72138 8.08763 9.2365 8.4045 9.55338L11.8511 13L8.4045 16.4466C8.08763 16.7635 8.08763 17.2786 8.4045 17.5955C8.72138 17.9124 9.2365 17.9124 9.55402 17.5955L13.0007 14.1489L16.4473 17.5955C16.7642 17.9124 17.2786 17.9124 17.5961 17.5955C17.9137 17.2786 17.913 16.7635 17.5961 16.4466L14.1495 13L17.5961 9.55338C17.914 9.23585 17.914 8.72138 17.5961 8.4045Z"
                fill="#797979"
              />
            </Svg>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>
                  {generateInitialsFromFullName(client.name)}
                </Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.statusLabel}>
                  {statusText || "Invited"}
                </Text>
              </View>
            </View>

            {/* Client Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionHeader}>CLIENT DETAILS</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <Path
                      d="M7.50246 2.25722C7.19873 1.4979 6.46332 1 5.64551 1H2.89474C1.8483 1 1 1.8481 1 2.89453C1 11.7892 8.21078 19 17.1055 19C18.1519 19 19 18.1516 19 17.1052L19.0005 14.354C19.0005 13.5361 18.5027 12.8009 17.7434 12.4971L15.1069 11.4429C14.4249 11.1701 13.6483 11.2929 13.0839 11.7632L12.4035 12.3307C11.6089 12.9929 10.4396 12.9402 9.7082 12.2088L7.79222 10.2911C7.06079 9.55962 7.00673 8.39134 7.66895 7.59668L8.23633 6.9163C8.70661 6.35195 8.83049 5.57516 8.55766 4.89309L7.50246 2.25722Z"
                      stroke="#4D4D4D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>

                  <Text style={styles.detailText}>
                    {formatPhoneNumber(client.phone) || "(416)829-0000"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <Path
                      d="M4 6L10.1076 10.6123L10.1097 10.614C10.7878 11.1113 11.1271 11.3601 11.4988 11.4562C11.8272 11.5412 12.1725 11.5412 12.501 11.4562C12.8729 11.36 13.2132 11.1105 13.8926 10.6123C13.8926 10.6123 17.8101 7.60594 20 6M3 15.8002V8.2002C3 7.08009 3 6.51962 3.21799 6.0918C3.40973 5.71547 3.71547 5.40973 4.0918 5.21799C4.51962 5 5.08009 5 6.2002 5H17.8002C18.9203 5 19.4796 5 19.9074 5.21799C20.2837 5.40973 20.5905 5.71547 20.7822 6.0918C21 6.5192 21 7.07899 21 8.19691V15.8036C21 16.9215 21 17.4805 20.7822 17.9079C20.5905 18.2842 20.2837 18.5905 19.9074 18.7822C19.48 19 18.921 19 17.8031 19H6.19691C5.07899 19 4.5192 19 4.0918 18.7822C3.71547 18.5905 3.40973 18.2842 3.21799 17.9079C3 17.4801 3 16.9203 3 15.8002Z"
                      stroke="#4D4D4D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>

                  <Text style={styles.detailText}>
                    {client.email || "Email@gmail.com"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <Path
                      d="M2 20H4M4 20H14M4 20V6.2002C4 5.08009 4 4.51962 4.21799 4.0918C4.40973 3.71547 4.71547 3.40973 5.0918 3.21799C5.51962 3 6.08009 3 7.2002 3H10.8002C11.9203 3 12.4796 3 12.9074 3.21799C13.2837 3.40973 13.5905 3.71547 13.7822 4.0918C14 4.5192 14 5.07899 14 6.19691V12M14 20H20M14 20V12M20 20H22M20 20V12C20 11.0681 19.9999 10.6024 19.8477 10.2349C19.6447 9.74481 19.2557 9.35523 18.7656 9.15224C18.3981 9 17.9316 9 16.9997 9C16.0679 9 15.6019 9 15.2344 9.15224C14.7443 9.35523 14.3552 9.74481 14.1522 10.2349C14 10.6024 14 11.0681 14 12M7 10H11M7 7H11"
                      stroke="#4D4D4D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>

                  <Text style={styles.detailText}>
                    {client.employmentType || "Employment type: unknown"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Documents Section */}
            <View style={styles.documentsSection}>
              <Text style={styles.sectionHeader}>DOCUMENTS SUBMITTED</Text>
              <View style={styles.documentsCard}>
                {client.documents && client.documents.length > 0 ? (
                  client.documents.map((doc, index) => (
                    <View key={index} style={styles.documentRow}>
                      <Text style={styles.documentText}>{doc.docType}</Text>
                      {doc.status.toLowerCase() === "approved" ? (
                        <ApprovedIcon />
                      ) : (
                        <RejectedIcon />
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDocumentsText}>
                    No documents submitted
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            {/* Download Button */}
            <TouchableOpacity
              style={styles.downloadButton}
              disabled={loadingDownload}
              onPress={async () => {
                setLoadingDownload(true);
                setDownloadProgress(0);
                try {
                  const xhr = new XMLHttpRequest();
                  xhr.open(
                    "POST",
                    "https://signup.roostapp.io/pdf/download-filled-pdf",
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
                  <ActivityIndicator size="small" color={COLORS.gray} />
                  <Text style={[styles.downloadButtonText, { marginLeft: 10 }]}>
                    {`Downloading... ${downloadProgress}%`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.downloadButtonText}>
                  Download referral document
                </Text>
              )}
            </TouchableOpacity>

            {/* Delete Button */}
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
                            `https://signup.roostapp.io/Realtor/DeleteClient`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ inviteId, realtorId }),
                            }
                          );
                          setLoading(false);
                          if (response.ok) {
                            Alert.alert(
                              "Success",
                              "Client deleted successfully",
                              [
                                {
                                  text: "OK",
                                  onPress: () => {
                                    navigation.goBack();
                                  },
                                },
                              ]
                            );
                          } else {
                            Alert.alert("Error", "Failed to delete client");
                          }
                        } catch (error) {
                          setLoading(false);
                          Alert.alert("Error", "Failed to delete client");
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.deleteButtonText}>Delete user</Text>
            </TouchableOpacity>
          </View>

          <RequestDocumentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleRequestDocument}
          />
        </View>
      </View>
    </Modal>
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
  modalWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 0,
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FDFDFD",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 0,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    backgroundColor: "#FDFDFD",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "none",
    justifyContent: "center",
    alignItems: "center",
  },
  noDocumentsText: {
    alignSelf: "center",
    fontSize: 14,
    fontFamily: "Futura",
    color: "#797979",
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 16,
    height: 75,
  },
  initialsCircle: {
    width: 75,
    height: 75,
    borderRadius: 45,
    backgroundColor: "#4D4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontFamily: "Futura",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    color: "#FDFDFD",
  },
  nameContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
  clientName: {
    fontFamily: "Futura",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
    color: "#1D2327",
    textAlign: "center",
  },
  statusLabel: {
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
    color: "#797979",
    textAlign: "center",
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontFamily: "Futura",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    letterSpacing: 0.88,
    textTransform: "uppercase",
    color: "#797979",
    marginBottom: 10,
  },
  detailsCard: {
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailText: {
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
    color: "#202020",
    flex: 1,
  },
  documentsSection: {
    marginBottom: 32,
  },
  documentsCard: {
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentText: {
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
    color: "#000000",
    flex: 1,
  },
  downloadButton: {
    backgroundColor: "#E8E8E8",
    borderRadius: 999,
    height: 43,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  downloadButtonText: {
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    color: "#797979",
  },
  deleteButton: {
    backgroundColor: "#A20E0E",
    borderRadius: 999,
    height: 43,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  deleteButtonText: {
    fontFamily: "Futura",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    color: "#FDFDFD",
  },
  loadingContainer: {
    backgroundColor: "#FDFDFD",
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
    backgroundColor: "#FDFDFD",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#5A5A5A",
  },
  infoValue: {
    color: "#1D2327",
    flex: 1,
    textAlign: "right",
  },
  infoValueWithActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  iconButton: {
    marginLeft: 8,
  },
  linkValue: {
    color: "#2271B1",
    textDecorationLine: "underline",
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    backgroundColor: "#FDFDFD",
  },
});

export default ClientDetails;
