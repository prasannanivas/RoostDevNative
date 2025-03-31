import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { useAuth } from "./context/AuthContext";
import { useRealtor } from "./context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

// These are placeholders for your actual components
import RealtorProfile from "./screens/RealtorProfile.js";
import RealtorRewards from "./screens/RealtorRewards.js";
import CSVUploadForm from "./screens/AddProfilePic";

const RealtorHome = () => {
  const { auth } = useAuth();
  const realtor = auth.realtor;
  const realtorFromContext = useRealtor();

  // console.log(realtorFromContext);
  const invited = realtorFromContext?.invitedClients || [];
  const navigation = useNavigation();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [showCSVUploadForm, setShowCSVUploadForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    referenceName: "",
    phone: "",
    email: "",
  });
  const [showRewards, setShowRewards] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Add animation values
  const leftSlideAnim = useRef(new Animated.Value(-1000)).current;
  const rightSlideAnim = useRef(new Animated.Value(1000)).current;

  // Animation functions
  const slideIn = (direction) => {
    const animValue = direction === "left" ? leftSlideAnim : rightSlideAnim;
    Animated.spring(animValue, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const slideOut = (direction) => {
    const animValue = direction === "left" ? leftSlideAnim : rightSlideAnim;
    Animated.timing(animValue, {
      toValue: direction === "left" ? -1000 : 1000,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Effect hooks for animations
  useEffect(() => {
    if (showProfile) slideIn("left");
    else slideOut("left");
  }, [showProfile]);

  useEffect(() => {
    if (showRewards) slideIn("right");
    else slideOut("right");
  }, [showRewards]);

  const handleInviteClient = async () => {
    setIsLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      const payload = {
        referenceName: formData.referenceName,
        phone: isEmail ? "" : formData.phone,
        email: isEmail ? formData.email : "",
        type: "Client",
      };

      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor.id}/invite-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setFeedback({
          message: "Client invited successfully!",
          type: "success",
        });

        // Refresh the realtor data to show the new client

        realtorFromContext?.fetchLatestRealtor();

        setTimeout(() => {
          setShowForm(false);
          setFormData({ referenceName: "", phone: "", email: "" });
          setFeedback({ message: "", type: "" });
        }, 2000);
      } else {
        setFeedback({
          message: "Failed to invite client. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error inviting client:", error);
      setFeedback({
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentCounts = (documents) => {
    const approved = documents.filter(
      (doc) => doc.status === "Approved"
    ).length;
    const pending = documents.filter(
      (doc) => doc.status === "Submitted"
    ).length;
    return { approved, pending };
  };

  const getInitials = (name) => {
    console.log("called getInitials", name);
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleClientClick = (clientId) => {
    if (clientId) {
      navigation.navigate("ClientDetails", { clientId });
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleRewardsClick = () => {
    setShowRewards(true);
  };

  return (
    <View style={styles.container}>
      {/* ================= TOP HEADER ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={handleProfileClick}
          activeOpacity={0.7}
        >
          {realtor.id && (
            <>
              {!imageLoadError ? (
                <Image
                  source={{
                    uri: `http://54.89.183.155:5000/realtor/profilepic/${realtor.id}`,
                  }}
                  style={styles.avatar}
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: "#23231A",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(realtor.name)}
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.nameAgencyContainer}>
            <Text style={styles.realtorName}>{realtor.name}</Text>
            <Text style={styles.agencyName}>ABC Realty</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuIconContainer}
          onPress={handleRewardsClick}
          activeOpacity={0.7}
        >
          <FontAwesome name="gift" size={24} color="#F99942" />
        </TouchableOpacity>
      </View>

      {/* ================= TITLE: CLIENTS ================= */}
      <View style={styles.clientsTitleContainer}>
        <Text style={styles.clientsTitle}>Clients</Text>
      </View>

      {/* ================= SCROLL CONTENT ================= */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* List of Clients */}
        {invited.map((client) => {
          const docCount = client.documents
            ? getDocumentCounts(client.documents)
            : null;
          const statusText =
            client.status === "PENDING"
              ? "Invited"
              : client.status === "ACCEPTED" &&
                (!client.documents || client.documents.length === 0)
              ? "Signed Up"
              : client.status === "ACCEPTED" && client.documents.length > 0
              ? `${docCount.approved}/${client.documents.length} Completed`
              : client.status;

          return (
            <TouchableOpacity
              key={client._id}
              style={styles.clientCard}
              onPress={() => handleClientClick(client.inviteeId)}
              activeOpacity={0.8}
            >
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>
                  {getInitials(client.referenceName)}
                </Text>
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{client.referenceName}</Text>
                <Text style={styles.clientStatus}>{statusText}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ================= BOTTOM BUTTON: ADD CLIENTS ================= */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addClientsButton}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addClientsButtonText}>ADD CLIENTS</Text>
        </TouchableOpacity>
      </View>

      {/* ================== MODALS ================== */}

      {/* Profile Modal - Slides from left */}
      <Modal visible={showProfile} animationType="none" transparent={true}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: leftSlideAnim.interpolate({
                inputRange: [-1000, 0],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.leftSlideModal,
              { transform: [{ translateX: leftSlideAnim }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProfile(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <RealtorProfile
                realtor={realtorFromContext.realtorInfo || {}}
                onClose={() => setShowProfile(false)}
              />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Rewards Modal - Slides from right */}
      <Modal visible={showRewards} animationType="none" transparent={true}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: rightSlideAnim.interpolate({
                inputRange: [0, 1000],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.rightSlideModal,
              { transform: [{ translateX: rightSlideAnim }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRewards(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <RealtorRewards
                realtor={realtorFromContext.realtorInfo || {}}
                invitedRealtors={realtorFromContext.invitedRealtors || []}
                getInitials={getInitials}
                onClose={() => setShowRewards(false)}
              />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        visible={showCSVUploadForm}
        animationType="slide"
        transparent={false}
      >
        <CSVUploadForm
          realtorId={realtor.id}
          setShowCSVUploadForm={setShowCSVUploadForm}
        />
      </Modal>

      {/* Invite Form Modal (Overlay) */}
      <Modal
        visible={showForm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.formOverlay}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Invite New Client</Text>
            {feedback.message ? (
              <Text
                style={[
                  styles.feedbackMessage,
                  feedback.type === "success"
                    ? styles.successMessage
                    : styles.errorMessage,
                ]}
              >
                {feedback.message}
              </Text>
            ) : null}

            {/* Nickname */}
            <TextInput
              style={styles.input}
              placeholder="Nickname"
              value={formData.referenceName}
              onChangeText={(text) =>
                setFormData({ ...formData, referenceName: text })
              }
            />

            {/* Toggle Email/Phone */}
            <Text style={styles.label}>Contact via:</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isEmail && styles.toggleButtonActive,
                ]}
                onPress={() => setIsEmail(true)}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    isEmail && styles.toggleButtonTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isEmail && styles.toggleButtonActive,
                ]}
                onPress={() => setIsEmail(false)}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    !isEmail && styles.toggleButtonTextActive,
                  ]}
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email or Phone Input */}
            <TextInput
              style={styles.input}
              placeholder={isEmail ? "Email" : "Phone"}
              keyboardType={isEmail ? "email-address" : "phone-pad"}
              value={isEmail ? formData.email : formData.phone}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  [isEmail ? "email" : "phone"]: text,
                })
              }
            />

            {/* Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, isLoading && styles.loadingButton]}
                onPress={handleInviteClient}
                disabled={isLoading}
              >
                <Text style={styles.formButtonText}>
                  {isLoading ? "Sending..." : "Send Invite"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formButton}
                onPress={() => setShowForm(false)}
                disabled={isLoading}
              >
                <Text style={styles.formButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3", // Light gray to match the screenshot background
  },

  /* ================= TOP HEADER STYLES ================= */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, // Extra top padding for status bar
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  nameAgencyContainer: {
    flexDirection: "column",
  },
  realtorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#23231A",
  },
  agencyName: {
    fontSize: 14,
    color: "#999999",
  },
  menuIconContainer: {
    padding: 5,
  },

  /* ================= CLIENTS TITLE ================= */
  clientsTitleContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  clientsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
  },

  /* ================= SCROLL CONTENT ================= */
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  /* ================= CLIENT CARD ================= */
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  initialsCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#23231A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#23231A",
    marginBottom: 4,
  },
  clientStatus: {
    fontSize: 14,
    color: "#666666",
  },

  /* ================= BOTTOM BUTTON ================= */
  bottomButtonContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 10,
  },
  addClientsButton: {
    flexDirection: "row",
    backgroundColor: "#F99942", // Orange button
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addClientsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  /* ================= MODALS & FORMS ================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  formOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: "#23231A",
  },
  toggleButtons: {
    flexDirection: "row",
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#019B8E",
  },
  toggleButtonActive: {
    backgroundColor: "#019B8E",
  },
  toggleButtonText: {
    textAlign: "center",
    color: "#019B8E",
  },
  toggleButtonTextActive: {
    color: "#fff",
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
  },
  loadingButton: {
    opacity: 0.7,
  },
  formButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  feedbackMessage: {
    textAlign: "center",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  successMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  leftSlideModal: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    backgroundColor: "#fff",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  rightSlideModal: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  closeButton: {
    padding: 5,
  },
});

export default RealtorHome;
