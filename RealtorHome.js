import React, { useState, useRef, useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
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
  Easing,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import * as Contacts from "expo-contacts";
import Svg, { Rect, Path, Circle } from "react-native-svg";
import { useAuth } from "./context/AuthContext";
import { useRealtor } from "./context/RealtorContext";
import { useNavigation } from "@react-navigation/native";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";
import GiftIcon from "./components/icons/GiftIcon";
import {
  EmptyProgressBar,
  MidProgressBar,
  CustomProgressBar,
  CompleteProgressBar,
} from "./components/progressBars";
import InviteRealtorModal from "./components/modals/InviteRealtorModal";

// These are placeholders for your actual components
import RealtorProfile from "./screens/RealtorProfile.js";
import RealtorRewards from "./screens/RealtorRewards.js";
import CSVUploadForm from "./screens/AddProfilePic";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Design System Colors
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

const RealtorHome = () => {
  const { auth } = useAuth();
  const realtor = auth.realtor;
  const realtorFromContext = useRealtor();

  const invited = realtorFromContext?.invitedClients || [];
  const completedReferrals =
    realtorFromContext?.completedReferrals?.completedInvites || [];

  console.log(
    "Realtor Home invited clients:",
    invited,
    "completed referrals:",
    completedReferrals
  );

  const navigation = useNavigation();
  // Local state
  const [showForm, setShowForm] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [showCSVUploadForm, setShowCSVUploadForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    referenceName: "",
    phone: "",
    email: "",
    type: "Client",
    inviteLink: "",
    inviteCode: "",
  });

  // State for file upload feedback

  const [multiInviteLoading, setMultiInviteLoading] = useState(false);
  const [multiInviteFeedback, setMultiInviteFeedback] = useState("");
  const [selectedInviteFile, setSelectedInviteFile] = useState(null);

  // State for needed documents count for each client
  const [neededDocumentsCount, setNeededDocumentsCount] = useState({});

  // Handler for picking the file (Upload File button)
  const handlePickInviteFile = async () => {
    setMultiInviteFeedback("");
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.oasis.opendocument.spreadsheet",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets || !res.assets[0]) {
        setMultiInviteFeedback("No file selected.");
        setSelectedInviteFile(null);
        return;
      }
      const file = res.assets[0];
      // For web, use the File object directly if available
      if (Platform.OS === "web" && file.file) {
        setSelectedInviteFile(file.file);
      } else {
        setSelectedInviteFile({
          uri: file.uri,
          name: file.name || "invite-clients.csv",
          type: file.mimeType || "text/csv",
        });
      }
      setMultiInviteFeedback("");
    } catch (e) {
      setMultiInviteFeedback("Error picking file: " + (e?.message || e));
      setSelectedInviteFile(null);
    }
  };

  // Handler for sending multiple invites via file upload (Send Invites button)
  const handleMultipleInvites = async () => {
    if (!selectedInviteFile) {
      setMultiInviteFeedback("Please select a file first.");
      return;
    }
    setMultiInviteLoading(true);
    setMultiInviteFeedback("");
    try {
      const formData = new FormData();
      if (Platform.OS === "web" && selectedInviteFile instanceof File) {
        // On web, append the File object directly
        formData.append("file", selectedInviteFile, selectedInviteFile.name);
      } else {
        // On native, append the { uri, name, type } object
        formData.append("file", selectedInviteFile);
      }
      const resp = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor.id}/invite-client-csv`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            // Do NOT set Content-Type, let fetch handle it
          },
        }
      );
      if (!resp.ok) {
        const errText = await resp.text();
        setMultiInviteFeedback("Upload failed: " + errText);
      } else {
        setMultiInviteFeedback(
          "Invites sent successfully to the Admin. Please wait for confirmation. This may take 2-3 business days."
        );
        setSelectedInviteFile(null);
        realtorFromContext?.fetchLatestRealtor?.();
      }
    } catch (e) {
      setMultiInviteFeedback("Error: " + (e?.message || e));
    } finally {
      setMultiInviteLoading(false);
    }
  };

  // Refs for text inputs to handle focus
  const lastNameInputRef = useRef();
  const emailInputRef = useRef();
  const phoneInputRef = useRef();
  const [showRewards, setShowRewards] = useState(false);
  const [feedback, setFeedback] = useState({ msg: "", type: "" });
  const [showProfile, setShowProfile] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isMultiple, setIsMultiple] = useState(false); // New state for single/multiple toggle
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showInviteOptionsModal, setShowInviteOptionsModal] = useState(false);
  const [selectedClientCard, setSelectedClientCard] = useState(null);
  const [showClientCardModal, setShowClientCardModal] = useState(false); // Animation values - initial positions for different slide directions
  const [showClientReferralModal, setShowClientReferralModal] = useState(false);
  // For left slide (profile), start at -1000 (off-screen to the left)
  const leftSlideAnim = useRef(new Animated.Value(-1000)).current;
  // For right slide (rewards), start at 1000 (off-screen to the right)
  const rightSlideAnim = useRef(new Animated.Value(1000)).current;
  // For bottom slide (client card), start at 1000 (off-screen to the bottom)
  const bottomSlideAnim = useRef(new Animated.Value(1000)).current;

  console.log("sss", selectedClientCard);
  // Track whether we're in the middle of animations
  const isAnimating = useRef({
    profile: false,
    rewards: false,
    clientCard: false,
    clientReferral: false,
  }).current;
  // Animation functions
  const slideIn = (direction) => {
    const animValue =
      direction === "left"
        ? leftSlideAnim
        : direction === "right"
        ? rightSlideAnim
        : bottomSlideAnim;

    // Ensure we start from the correct position
    if (direction === "left") {
      leftSlideAnim.setValue(-1000);
      // Mark animation as in progress
      isAnimating.profile = true;
    } else if (direction === "right") {
      rightSlideAnim.setValue(1000);
      isAnimating.rewards = true;
    } else {
      bottomSlideAnim.setValue(1000);
      isAnimating.clientCard = true;
    }

    // Use consistent animation with platform-specific settings
    Animated.timing(animValue, {
      toValue: 0,
      // Slightly faster on iOS for better response
      duration: Platform.OS === "ios" ? 250 : 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(({ finished }) => {
      if (finished) {
        // Reset animation state
        if (direction === "left") isAnimating.profile = false;
        else if (direction === "right") isAnimating.rewards = false;
        else isAnimating.clientCard = false;
      }
    });
  };

  const slideOut = (direction, callback) => {
    const animValue =
      direction === "left"
        ? leftSlideAnim
        : direction === "right"
        ? rightSlideAnim
        : bottomSlideAnim;

    // For "left" direction, exit to left (-1000) on both iOS and Android
    // For "right" direction, exit to right (1000)
    // For "bottom" direction, exit to bottom (1000)
    const toValue = direction === "left" ? -1000 : 1000;

    // Mark the appropriate animation as in-progress
    if (direction === "left") isAnimating.profile = true;
    else if (direction === "right") isAnimating.rewards = true;
    else isAnimating.clientCard = true;

    // Run animation with callback to reset state when done
    Animated.timing(animValue, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(({ finished }) => {
      // Only execute callback if animation completed and wasn't interrupted
      if (finished) {
        if (direction === "left") isAnimating.profile = false;
        else if (direction === "right") isAnimating.rewards = false;
        else isAnimating.clientCard = false;

        // If there's a callback, execute it
        if (callback) callback();
      }
    });
  }; // Effect hooks for animations
  useEffect(() => {
    if (showProfile) {
      slideIn("left");
    } else if (!isAnimating.profile) {
      // Only trigger slideOut if we're not already animating
      slideOut("left");
    }
  }, [showProfile]);

  useEffect(() => {
    if (showRewards) {
      slideIn("right");
    } else if (!isAnimating.rewards) {
      slideOut("right");
    }
  }, [showRewards]);

  useEffect(() => {
    if (showClientCardModal) {
      slideIn("bottom");
    } else if (!isAnimating.clientCard) {
      slideOut("bottom");
    }
  }, [showClientCardModal]);

  useEffect(() => {
    if (showClientReferralModal) {
      slideIn("bottom");
    } else if (!isAnimating.clientReferral) {
      slideOut("bottom");
    }
  }, [showClientReferralModal]);

  // Effect to fetch needed documents counts when invited clients change
  useEffect(() => {
    if (invited.length > 0) {
      updateNeededDocumentsCounts();
    }
  }, [invited]);

  // Effect to refresh profile picture when realtor data changes
  useEffect(() => {
    if (realtorFromContext?.realtorInfo) {
      // Reset image load error state and refresh key when realtor data updates
      setImageLoadError(false);
      setImageRefreshKey(Date.now());
    }
  }, [realtorFromContext?.realtorInfo]);

  const handleInviteClient = async () => {
    setIsLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      // Combine firstName and lastName into referenceName
      const fullName = `${formData.firstName || ""} ${
        formData.lastName || ""
      }`.trim();

      const payload = {
        referenceName: fullName, // Use combined name
        phone: isEmail ? "" : formData.phone,
        email: isEmail ? formData.email : "",
        type: "Client",
      };

      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor.id}/invite-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Client invited successfully", data.inviteLink);
        setFormData({
          ...formData,
          inviteLink: data.inviteLink,
          inviteCode: data.invite.inviteCode,
        });
        setFeedback({
          message: "Client invited successfully!",
          type: "success",
        });

        // Close current modal and show the invite options modal
        setShowForm(false);
        setShowInviteOptionsModal(true);

        // Refresh the realtor data to show the new client
        realtorFromContext?.fetchLatestRealtor();

        // Update needed documents counts for all clients
        setTimeout(() => {
          updateNeededDocumentsCounts();
        }, 1000); // Small delay to ensure the new client is available

        // Don't close the modal automatically - user will click "Done" now
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

  const handleShareMessage = (type) => {
    // Create message with invite code if available
    const inviteCode = realtorFromContext?.realtorInfo?.inviteCode
      ? `Use my invite code: ${realtorFromContext.realtorInfo.inviteCode}`
      : "";

    const message = `Hey, I am inviting you to join me on Roost. ${inviteCode} Please accept my invitation to get started!`;

    if (!isEmail && formData.phone) {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (type === "whatsapp") {
        const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(
          message
        )}`;
        Linking.canOpenURL(whatsappUrl)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(whatsappUrl);
            }
            Alert.alert("Please install WhatsApp to use this feature");
          })
          .catch((err) => console.error("Error opening WhatsApp:", err));
      } else {
        const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
        Linking.openURL(smsUrl);
      }
    } else if (isEmail && formData.email) {
      const emailUrl = `mailto:${formData.email}?subject=${encodeURIComponent(
        "Invitation to Roost"
      )}&body=${encodeURIComponent(message)}`;
      Linking.openURL(emailUrl);
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

  // Function to fetch needed documents count for a client
  const fetchNeededDocumentsCount = async (clientId) => {
    try {
      const response = await fetch(
        `http://159.203.58.60:5000/client/neededdocument/${clientId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Count documents with type "Needed" from the documents_needed array
        const neededDocs = data.documents_needed || [];
        const neededCount = neededDocs.length;
        return neededCount || 10; // fallback to 10 if no needed documents found
      }
      return 10; // fallback to 10 if request fails
    } catch (error) {
      console.error("Error fetching needed documents:", error);
      return 10; // fallback to 10 if error
    }
  };

  // Function to update needed documents count for all clients
  const updateNeededDocumentsCounts = async () => {
    const counts = {};
    for (const client of invited) {
      if (client.inviteeId) {
        counts[client.inviteeId] = await fetchNeededDocumentsCount(
          client.inviteeId
        );
      }
    }
    setNeededDocumentsCount(counts);
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };
  const handleClientClick = (client) => {
    console.log("Selected client:", client);
    setSelectedClientCard(client);
    setShowClientCardModal(true);
  };

  const handleClientReferralClick = (client) => {
    console.log("Selected client:", client);
    setSelectedClientCard(client);
    setShowClientReferralModal(true);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleRewardsClick = () => {
    setShowRewards(true);
  };

  // Update the onRefresh function to also fetch realtor data
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([auth.refetch?.(), realtorFromContext?.fetchLatestRealtor()])
      .then(() => {
        // After fetching realtor data, update needed documents counts
        updateNeededDocumentsCounts();
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [auth, realtorFromContext]);

  const pickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const contact = await Contacts.presentContactPickerAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
            Contacts.Fields.FirstName,
            Contacts.Fields.LastName,
          ],
        });

        if (contact) {
          console.log(contact);
          // Contact was selected
          const phoneNumber = contact.phoneNumbers?.[0]?.number || "";
          const email = contact.emails?.[0]?.email || "";
          const contactName =
            contact.name ||
            `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

          setFormData({
            referenceName: contactName, // Set the nickname to the contact's name
            phone: phoneNumber,
            email: email,
          });
          setIsEmail(!!email);
          setSelectedContact(contact);
        }
      } else {
        Alert.alert(
          "Permission Required",
          "Please enable contact permissions to access your contacts."
        );
      }
    } catch (error) {
      console.error("Contact picker error:", error);
      Alert.alert("Error", "Failed to access contacts: " + error.message);
    }
  };

  const handlePersonalText = () => {
    // Updated SMS message content
    const signupLink =
      formData.inviteLink ||
      `https://signup.roostapp.io/?realtorCode=${
        realtorFromContext?.realtorInfo?.inviteCode || ""
      }`;
    const smsMessage = `Hi ${formData.firstName},

I'm sending you an invite to get a mortgage with Roost, here is the link to sign up ${signupLink}.`;

    const smsUrl = `sms:${formData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.openURL(smsUrl).catch((err) =>
      console.error("Error opening SMS:", err)
    );

    // Close modal and schedule transactional email check
    setShowInviteOptionsModal(false);
    resetFormData();
    scheduleTransactionalEmailCheck();
  };

  const handlePersonalEmail = () => {
    // Updated email content
    const signupLink =
      formData.inviteLink ||
      `https://signup.roostapp.io/?realtorCode=${
        realtorFromContext?.realtorInfo?.inviteCode || ""
      }`;
    const emailSubject = "Invitation to get a mortgage with Roost";
    const emailBody = `Hi ${formData.firstName}

I'm sending you an invite to get a mortgage with Roost, here is the link to sign up ${signupLink}. If you have any questions just ask.`;

    const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Error opening email:", err)
    );

    // Close modal and schedule transactional email check
    setShowInviteOptionsModal(false);
    resetFormData();
    scheduleTransactionalEmailCheck();
  };

  const handleNoneOption = () => {
    // Send transactional email immediately
    sendTransactionalEmail();
    setShowInviteOptionsModal(false);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      referenceName: "",
      phone: "",
      email: "",
      type: "Client",
      inviteLink: "",
      inviteCode: "",
    });
  };

  const scheduleTransactionalEmailCheck = () => {
    // Wait 15 minutes to check if client signed up
    setTimeout(() => {
      checkClientSignupAndSendEmail();
    }, 15 * 60 * 1000); // 15 minutes
  };

  const checkClientSignupAndSendEmail = async () => {
    try {
      // Check if client has signed up by checking their status
      const updatedRealtor = await realtorFromContext?.fetchLatestRealtor();
      const clientStillPending = updatedRealtor?.invitedClients?.find(
        (client) =>
          client.referenceName ===
            `${formData.firstName} ${formData.lastName}` &&
          client.status === "PENDING"
      );

      if (clientStillPending) {
        // Client hasn't signed up, send transactional email
        sendTransactionalEmail();
      }
      // If client signed up, do nothing
    } catch (error) {
      console.error("Error checking client signup status:", error);
      // If there's an error checking, send the email anyway
      sendTransactionalEmail();
    }
  };

  const sendTransactionalEmail = async () => {
    try {
      // Call backend API to send transactional email
      const response = await fetch(
        `http://159.203.58.60:5000/realtor/${realtor.id}/send-transactional-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientFirstName: formData.firstName,
            clientEmail: formData.email,
            inviteLink: formData.inviteLink,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to send transactional email");
      }
    } catch (error) {
      console.error("Error sending transactional email:", error);
    }
  };
  const [completedClients, setCompletedClients] = useState([]);
  const [activeClients, setActiveClients] = useState([]);

  // Add this useEffect to segregate clients
  useEffect(() => {
    if (invited.length > 0) {
      const completed = invited.filter(
        (client) => client.clientStatus === "Completed"
      );
      const active = invited.filter(
        (client) => client.clientStatus !== "Completed"
      );
      setCompletedClients(completed);
      setActiveClients(active);
    } else {
      setCompletedClients([]);
      setActiveClients([]);
    }
  }, [invited]);

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
                    uri: `http://159.203.58.60:5000/realtor/profilepic/${realtor.id}?t=${imageRefreshKey}`,
                  }}
                  style={styles.avatar}
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: "#2271B1",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(
                      realtorFromContext?.realtorInfo?.name || realtor.name
                    )}
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.nameAgencyContainer}>
            <Text style={styles.realtorName}>
              {realtorFromContext?.realtorInfo?.name || realtor.name}
            </Text>
            <Text style={styles.agencyName}>
              {realtorFromContext?.realtorInfo?.brokerageInfo?.brokerageName ||
                realtor?.brokerageInfo?.brokerageName ||
                null}
            </Text>
          </View>
        </TouchableOpacity>
        <GiftIcon
          onPress={handleRewardsClick}
          width={46}
          height={46}
          backgroundColor="#1D2327"
          strokeColor="#377473"
          pathColor="#FDFDFD"
        />
      </View>
      {/* ================= INVITE REALTORS BANNER ================= */}
      <ScrollView>
        <View style={styles.inviteBanner}>
          <TouchableOpacity
            style={styles.inviteRealtorsButton}
            onPress={() => setShowInviteForm(true)}
          >
            <Text style={styles.inviteRealtorsText}>Invite Realtors</Text>
          </TouchableOpacity>
          <Text style={styles.inviteBannerText}>
            Earn an additional 5% pts from any activity from your fellow realtor
            referrals*
          </Text>
        </View>
        {/* ================= TITLE: CLIENTS ================= */}
        <View style={styles.clientsTitleContainer}>
          <Text style={styles.clientsTitle}>Clients</Text>
          <Text style={styles.ActiveText}>ACTIVE</Text>
        </View>
        {/* ================= SCROLLABLE CLIENT LIST ================= */}
        <ScrollView
          style={styles.clientsScrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.green]} // Android
              tintColor={COLORS.green} // iOS
            />
          }
        >
          {activeClients.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Client activity will show here
              </Text>
              <Text style={styles.emptyStateSubText}>
                Add your first client by pressing the button below
              </Text>
              <TouchableOpacity
                style={styles.addClientsButton}
                onPress={() => setShowForm(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addButtonContent}>
                  <Svg width="59" height="58" viewBox="0 0 59 58" fill="none">
                    <Rect
                      x="1"
                      y="1"
                      width="54"
                      height="54"
                      rx="27"
                      fill="#F0913A"
                    />
                    <Path
                      d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                      stroke="#FDFDFD"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.addClientButtonText}>ADD CLIENTS</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            activeClients.map((client) => {
              const docCount = client.documents
                ? getDocumentCounts(client.documents)
                : { approved: 0, pending: 0 };

              const totalNeeded = neededDocumentsCount[client.inviteeId] || 10;

              const statusText =
                client?.clientStatus === "Completed"
                  ? "Completed"
                  : client.status === "PENDING"
                  ? "Invited"
                  : client.clientAddress === null
                  ? "Account Deleted"
                  : client.status === "ACCEPTED" &&
                    (!client.documents ||
                      client.documents.length === 0 ||
                      client?.clientAddress !== null)
                  ? "Signed Up"
                  : client.status === "ACCEPTED" && client.documents.length > 0
                  ? `${docCount.approved}/${totalNeeded} Documents`
                  : client.clientAddress === null
                  ? "Account Deleted"
                  : client.status;

              return (
                <TouchableOpacity
                  key={client._id}
                  style={styles.clientCard}
                  onPress={() => handleClientClick(client)}
                  activeOpacity={0.8}
                >
                  <View style={styles.initialsCircle}>
                    <Text style={styles.initialsText}>
                      {getInitials(client.referenceName)}
                    </Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientName}>
                      {client.referenceName}
                    </Text>
                    {client.clientStatus === "Completed" ? (
                      <CompleteProgressBar
                        text="COMPLETED"
                        points={client?.completionDetails?.realtorAward || ""}
                        date={
                          client?.completionDetails?.date
                            ? new Date(
                                client.completionDetails.date
                              ).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })
                            : ""
                        }
                      />
                    ) : client.status === "ACCEPTED" &&
                      client.documents &&
                      client.documents.length > 0 ? (
                      <MidProgressBar
                        text={`${docCount.approved}/${totalNeeded} DOCUMENTS`}
                        progress={(docCount.approved / totalNeeded) * 100}
                        style={styles.statusProgressBar}
                      />
                    ) : (
                      <EmptyProgressBar
                        text={statusText.toUpperCase()}
                        progress={
                          client.status === "PENDING"
                            ? 10
                            : client.status === "ACCEPTED"
                            ? 30
                            : 50
                        }
                        style={styles.statusProgressBar}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={[styles.clientsTitleContainer]}>
            <Text style={styles.ActiveText}>COMPLETED</Text>
          </View>

          {completedClients.length > 0 ? (
            <>
              {completedClients.map((client) => {
                const docCount = client.documents
                  ? getDocumentCounts(client.documents)
                  : { approved: 0, pending: 0 };

                const totalNeeded =
                  neededDocumentsCount[client.inviteeId] || 10;

                const statusText =
                  client?.clientStatus === "Completed"
                    ? "Completed"
                    : client.status === "PENDING"
                    ? "Invited"
                    : client.clientAddress === null
                    ? "Account Deleted"
                    : client.status === "ACCEPTED" &&
                      (!client.documents ||
                        client.documents.length === 0 ||
                        client?.clientAddress !== null)
                    ? "Signed Up"
                    : client.status === "ACCEPTED" &&
                      client.documents.length > 0
                    ? `${docCount.approved}/${totalNeeded} Documents`
                    : client.clientAddress === null
                    ? "Account Deleted"
                    : client.status;

                return (
                  <TouchableOpacity
                    key={client._id}
                    style={styles.clientCard}
                    onPress={() => handleClientClick(client)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>
                        {getInitials(client.referenceName)}
                      </Text>
                    </View>
                    <View style={styles.clientDetails}>
                      <Text style={styles.clientName}>
                        {client.referenceName}
                      </Text>
                      {client.clientStatus === "Completed" ? (
                        <CompleteProgressBar
                          text="COMPLETED"
                          points={client?.completionDetails?.realtorAward || ""}
                          date={
                            client?.completionDetails?.date
                              ? new Date(
                                  client.completionDetails.date
                                ).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                              : ""
                          }
                        />
                      ) : client.status === "ACCEPTED" &&
                        client.documents &&
                        client.documents.length > 0 ? (
                        <MidProgressBar
                          text={`${docCount.approved}/${totalNeeded} DOCUMENTS`}
                          progress={(docCount.approved / totalNeeded) * 100}
                          style={styles.statusProgressBar}
                        />
                      ) : (
                        <EmptyProgressBar
                          text={statusText.toUpperCase()}
                          progress={
                            client.status === "PENDING"
                              ? 10
                              : client.status === "ACCEPTED"
                              ? 30
                              : 50
                          }
                          style={styles.statusProgressBar}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Currently no mortgages have been completed.
              </Text>
            </View>
          )}

          {completedReferrals.length > 0 && (
            <View style={styles.completedReferralsContainer}>
              <View style={[styles.clientsTitleContainer]}>
                <Text style={styles.ActiveText}>COMPLETED - REFERRAL</Text>
              </View>
              {completedReferrals.map((client) => (
                <TouchableOpacity
                  key={client._id}
                  style={styles.clientCard}
                  onPress={() => handleClientReferralClick(client)}
                  activeOpacity={0.8}
                >
                  <View style={styles.initialsCircle}>
                    <Text style={styles.initialsText}>
                      {getInitials(client.name)}
                    </Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <CompleteProgressBar
                      text="COMPLETED"
                      points={client?.completionDetails?.referralReward || ""}
                      date={
                        client?.completionDetails?.date
                          ? new Date(
                              client.completionDetails.date
                            ).toLocaleDateString("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            })
                          : ""
                      }
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        {/* ================= FLOATING ADD CLIENT BUTTON ================= */}
      </ScrollView>
      {(activeClients.length > 0 || completedClients.length > 0) && (
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setShowForm(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <Svg width="59" height="58" viewBox="0 0 59 58" fill="none">
              <Rect x="1" y="1" width="54" height="54" rx="27" fill="#F0913A" />
              <Path
                d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                stroke="#FDFDFD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.addClientButtonText}>ADD CLIENTS</Text>
          </View>
        </TouchableOpacity>
      )}
      {/* ================== MODALS ================== */}
      {/* Profile Modal - Slides from left using react-native-modal */}
      <ReactNativeModal
        isVisible={showProfile}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        animationInTiming={400}
        animationOutTiming={400}
        // backdropOpacity={0.7}
        // onBackButtonPress={() => setShowProfile(false)}
        // onBackdropPress={() => setShowProfile(false)}
        // onSwipeComplete={() => setShowProfile(false)}
        //swipeDirection={["left"]}
        useNativeDriver={false}
        statusBarTranslucent
        style={styles.sideModal}
      >
        <View style={styles.modalContainer}>
          <RealtorProfile
            realtor={realtorFromContext.realtorInfo || {}}
            onClose={() => setShowProfile(false)}
          />
        </View>
      </ReactNativeModal>
      {/* Rewards Modal - Slides from right */}
      <ReactNativeModal
        isVisible={showRewards}
        animationIn="slideInRight"
        animationOut="slideOutRight"
        animationInTiming={400}
        animationOutTiming={400}
        // backdropOpacity={0.7}
        // onBackButtonPress={() => setShowRewards(false)}
        // onBackdropPress={() => setShowRewards(false)}
        // onSwipeComplete={() => setShowRewards(false)}
        // swipeDirection={["right"]}
        useNativeDriver={false}
        statusBarTranslucent
        style={[styles.sideModal, styles.rightSideModal]}
      >
        <View style={styles.modalContainer}>
          {/* Rewards Component with Split Structure */}
          <RealtorRewards
            realtor={realtorFromContext.realtorInfo || {}}
            invitedRealtors={realtorFromContext.invitedRealtors || []}
            invitedClients={realtorFromContext.invitedClients || []}
            getInitials={getInitials}
            onClose={() => setShowRewards(false)}
            useFixedHeader={true}
          />
        </View>
      </ReactNativeModal>
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
      <InviteRealtorModal
        visible={showInviteForm}
        onClose={() => setShowInviteForm(false)}
        realtorInfo={realtorFromContext?.realtorInfo}
        realtorId={realtor.id}
      />

      {/* New Invite Options Modal */}
      <Modal
        visible={showInviteOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInviteOptionsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inviteOptionsContainer}>
              <TouchableOpacity
                style={styles.closeFormButton}
                onPress={() => setShowInviteOptionsModal(false)}
              >
                <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                  <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                  <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                  <Path
                    d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                    fill="#A9A9A9"
                  />
                </Svg>
              </TouchableOpacity>

              <Text style={styles.inviteOptionsTitle}>Client invite via</Text>
              <Text style={styles.inviteOptionsSubtitle}>
                Its always best to send personal invite to your client, if you
                choose none we will just send them an email in 5 minutes
              </Text>

              <View style={styles.contactOptions}>
                {formData.phone && (
                  <TouchableOpacity
                    style={styles.primaryOptionBtn}
                    onPress={handlePersonalText}
                  >
                    <MaterialIcons name="sms" size={32} color="#2196F3" />
                    <Text style={styles.primaryOptionText}>Personal Text</Text>
                  </TouchableOpacity>
                )}

                {formData.email && (
                  <TouchableOpacity
                    style={styles.primaryOptionBtn}
                    onPress={handlePersonalEmail}
                  >
                    <Entypo name="mail" size={32} color="#F44336" />
                    <Text style={styles.primaryOptionText}>Personal Email</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.noneOptionContainer}>
                <TouchableOpacity
                  style={styles.noneButton}
                  onPress={handleNoneOption}
                >
                  <Text style={styles.noneButtonText}>None</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      {/* Invite Form Modal (Overlay) */}
      <Modal
        visible={showForm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "height" : "height"}
          style={styles.formOverlay}
          keyboardVerticalOffset={Platform.OS === "ios" ? -200 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formContainer}>
              {/* Add close button here */}
              <TouchableOpacity
                style={styles.closeFormButton}
                onPress={() => setShowForm(false)}
              >
                <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                  <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                  <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                  <Path
                    d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                    fill="#A9A9A9"
                  />
                </Svg>
              </TouchableOpacity>

              <Text style={styles.formTitle}>ADD A CLIENT</Text>
              <Text style={styles.formSubtitle}>
                Send your client an invite to view and share listing with you.
              </Text>
              {/* One/Multiple Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !isMultiple && styles.toggleOptionActive,
                  ]}
                  onPress={() => setIsMultiple(false)}
                >
                  <Text
                    style={
                      !isMultiple ? styles.toggleTextActive : styles.toggleText
                    }
                  >
                    One
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    isMultiple && styles.toggleOptionActive,
                  ]}
                  onPress={() => setIsMultiple(true)}
                >
                  <Text
                    style={
                      isMultiple ? styles.toggleTextActive : styles.toggleText
                    }
                  >
                    Multiple
                  </Text>
                </TouchableOpacity>
              </View>

              {!isMultiple ? (
                /* Single Client Form */
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                >
                  <>
                    <TextInput
                      style={styles.inputField}
                      placeholder="First Name"
                      placeholderTextColor={COLORS.gray}
                      value={formData.firstName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, firstName: text })
                      }
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => lastNameInputRef.current?.focus()}
                    />
                    <TextInput
                      ref={lastNameInputRef}
                      style={styles.inputField}
                      placeholder="Last Name"
                      placeholderTextColor={COLORS.gray}
                      value={formData.lastName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, lastName: text })
                      }
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                    />
                    <TextInput
                      ref={emailInputRef}
                      style={styles.inputField}
                      placeholder="Email"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="email-address"
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text })
                      }
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => phoneInputRef.current?.focus()}
                    />
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.inputField}
                      placeholder="Phone"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData({ ...formData, phone: text })
                      }
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    {/* Send invite button */}
                    <TouchableOpacity
                      style={styles.sendInviteButton}
                      onPress={handleInviteClient}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.sendInviteButtonText}>
                          Send Invite
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Use contactInviteContainer instead of dividerContainer */}
                    <View style={styles.contactInviteContainer}>
                      <Text style={styles.orText}>
                        Or you can invite the contact you have on your phone
                      </Text>

                      <TouchableOpacity
                        style={styles.contactsButton}
                        onPress={pickContact}
                      >
                        <Text style={styles.contactsButtonText}>
                          Invite my contacts
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                </ScrollView>
              ) : (
                /* Multiple Clients Form */
                <>
                  <TouchableOpacity
                    style={styles.uploadFileButton}
                    onPress={handlePickInviteFile}
                  >
                    <Text style={styles.uploadFileText}>Upload File</Text>
                  </TouchableOpacity>
                  {selectedInviteFile && (
                    <Text
                      style={{
                        color: COLORS.slate,
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      Selected: {selectedInviteFile.name}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.sendInviteButton}
                    onPress={handleMultipleInvites}
                    disabled={multiInviteLoading}
                  >
                    {multiInviteLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.sendInviteButtonText}>
                        Send Invites
                      </Text>
                    )}
                  </TouchableOpacity>
                  {!!multiInviteFeedback && (
                    <Text
                      style={{
                        color: multiInviteFeedback.includes("success")
                          ? COLORS.green
                          : COLORS.red,
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      {multiInviteFeedback}
                    </Text>
                  )}
                  <Text style={styles.orDivider}>OR</Text>
                  <Text style={styles.alternativeText}>
                    You can always email a file (Excel or .CSV) to us at
                    <Text style={{ fontWeight: "bold" }}>
                      files@roostapp.io
                    </Text>
                    and we can take care of it for you
                  </Text>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Invite Options Modal */}
      <Modal
        visible={showInviteOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInviteOptionsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inviteOptionsContainer}>
              <TouchableOpacity
                style={styles.closeFormButton}
                onPress={() => setShowInviteOptionsModal(false)}
              >
                <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                  <Circle cx="18.5" cy="18.5" r="18.5" fill="#FFFFFF" />
                  <Circle cx="18.5" cy="18.5" r="17.5" fill="#FDFDFD" />
                  <Path
                    d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                    fill="#A9A9A9"
                  />
                </Svg>
              </TouchableOpacity>

              <Text style={styles.inviteOptionsTitle}>Client invite via</Text>
              <Text style={styles.inviteOptionsSubtitle}>
                Its always best to send personal invite to your client, if you
                choose none we will just send them an email in 5 minutes
              </Text>

              <View style={styles.contactOptions}>
                {formData.phone && (
                  <TouchableOpacity
                    style={styles.primaryOptionBtn}
                    onPress={handlePersonalText}
                  >
                    <MaterialIcons name="sms" size={32} color="#2196F3" />
                    <Text style={styles.primaryOptionText}>Personal Text</Text>
                  </TouchableOpacity>
                )}

                {formData.email && (
                  <TouchableOpacity
                    style={styles.primaryOptionBtn}
                    onPress={handlePersonalEmail}
                  >
                    <Entypo name="mail" size={32} color="#F44336" />
                    <Text style={styles.primaryOptionText}>Personal Email</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.noneOptionContainer}>
                <TouchableOpacity
                  style={styles.noneButton}
                  onPress={handleNoneOption}
                >
                  <Text style={styles.noneButtonText}>None</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Client Card Detail Modal - Slides from bottom */}
      <Modal
        visible={showClientCardModal}
        animationType="none"
        transparent={true}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: bottomSlideAnim.interpolate({
                inputRange: [0, 1000],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.bottomSlideModal,
              { transform: [{ translateY: bottomSlideAnim }] },
            ]}
          >
            <View style={styles.clientCardModalContent}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowClientCardModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>

              {selectedClientCard && (
                <View style={styles.clientCardDetails}>
                  <View style={styles.clientCardHeader}>
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>
                        {getInitials(selectedClientCard.referenceName)}
                      </Text>
                    </View>
                    <View style={styles.clientCardInfo}>
                      <Text style={styles.clientCardName}>
                        {selectedClientCard.referenceName}
                      </Text>
                      {(() => {
                        const docCount = selectedClientCard.documents
                          ? getDocumentCounts(selectedClientCard.documents)
                          : { approved: 0, pending: 0 };
                        const totalNeeded =
                          neededDocumentsCount[selectedClientCard.inviteeId] ||
                          10;

                        return selectedClientCard.clientStatus ===
                          "Completed" ? (
                          <CompleteProgressBar
                            text="COMPLETED"
                            points={
                              selectedClientCard?.completionDetails
                                ?.realtorAward || ""
                            }
                            date={
                              selectedClientCard?.completionDetails?.date
                                ? new Date(
                                    selectedClientCard.completionDetails.date
                                  ).toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    year: "numeric",
                                  })
                                : ""
                            }
                          />
                        ) : selectedClientCard.status === "ACCEPTED" &&
                          selectedClientCard.documents &&
                          selectedClientCard.documents.length > 0 ? (
                          <MidProgressBar
                            text={`${docCount.approved}/${totalNeeded} DOCUMENTS`}
                            progress={(docCount.approved / totalNeeded) * 100}
                            style={styles.detailStatusProgressBar}
                          />
                        ) : (
                          <EmptyProgressBar
                            text={
                              selectedClientCard.status === "PENDING"
                                ? "INVITED"
                                : selectedClientCard.clientAddress === null
                                ? "ACCOUNT DELETED"
                                : selectedClientCard.status === "ACCEPTED" &&
                                  (!selectedClientCard.documents ||
                                    selectedClientCard.documents.length === 0 ||
                                    selectedClientCard?.clientAddress !== null)
                                ? "SIGNED UP"
                                : selectedClientCard.clientAddress === null
                                ? "ACCOUNT DELETED"
                                : selectedClientCard.status.toUpperCase()
                            }
                            progress={
                              selectedClientCard.status === "PENDING"
                                ? 10
                                : selectedClientCard.status === "ACCEPTED" &&
                                  (!selectedClientCard.documents ||
                                    selectedClientCard.documents.length === 0)
                                ? 30
                                : 50
                            }
                            style={styles.detailStatusProgressBar}
                          />
                        );
                      })()}
                    </View>
                  </View>

                  <View style={styles.clientCardActions}>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => {
                        setShowClientCardModal(false);
                        navigation.navigate("ClientDetails", {
                          clientId: selectedClientCard.inviteeId,
                          client: selectedClientCard,
                          statusText:
                            selectedClientCard.status === "PENDING"
                              ? "Client Invited"
                              : selectedClientCard.clientAddress === null
                              ? "Account Deleted"
                              : selectedClientCard.status === "ACCEPTED" &&
                                (!selectedClientCard.documents ||
                                  selectedClientCard.documents.length === 0 ||
                                  selectedClientCard?.clientAddress !== null)
                              ? "Client Signed Up"
                              : selectedClientCard.clientAddress === null
                              ? "Account Deleted"
                              : selectedClientCard.status.toUpperCase(),
                        });
                      }}
                    >
                      <Text style={styles.viewDetailsButtonText}>
                        View Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal
        visible={showClientReferralModal}
        animationType="none"
        transparent={true}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: bottomSlideAnim.interpolate({
                inputRange: [0, 1000],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.bottomSlideModal,
              { transform: [{ translateY: bottomSlideAnim }] },
            ]}
          >
            <View style={styles.clientCardModalContent}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowClientReferralModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>

              {selectedClientCard && (
                <View style={styles.clientCardDetails}>
                  <View style={styles.clientCardHeader}>
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>
                        {getInitials(selectedClientCard.name)}
                      </Text>
                    </View>
                    <View style={styles.clientCardInfo}>
                      <Text style={styles.clientCardName}>
                        {selectedClientCard.name}
                      </Text>
                      {(() => {
                        return (
                          <CompleteProgressBar
                            text="COMPLETED"
                            points={
                              selectedClientCard?.completionDetails
                                ?.referralReward || ""
                            }
                            date={
                              selectedClientCard?.completionDetails?.date
                                ? new Date(
                                    selectedClientCard.completionDetails.date
                                  ).toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    year: "numeric",
                                  })
                                : ""
                            }
                          />
                        );
                      })()}
                    </View>
                  </View>
                  <View style={styles.clientCardActions}>
                    <TouchableOpacity
                      style={[
                        styles.viewDetailsButton,
                        { backgroundColor: COLORS.blue, borderRadius: 33 },
                      ]}
                      onPress={async () => {
                        setLoadingDownload(true);
                        try {
                          const response = await fetch(
                            "http://159.203.58.60:5000/pdf/download-filled-pdf",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                clientId: selectedClientCard?.id,
                                type: "realtorRewardPdf",
                              }),
                            }
                          );
                          if (!response.ok)
                            throw new Error("Failed to download PDF");
                          const blob = await response.blob();
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const base64data = reader.result.split(",")[1];
                              const fileUri =
                                FileSystem.cacheDirectory + "referral.pdf";
                              await FileSystem.writeAsStringAsync(
                                fileUri,
                                base64data,
                                { encoding: FileSystem.EncodingType.Base64 }
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
                      }}
                    >
                      {loadingDownload ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.viewDetailsButtonText}>
                          DOWNLOAD REFERRAL
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: "relative", // To position absolute elements
  },
  /* ================= TOP HEADER STYLES ================= */
  headerContainer: {
    width: "100%",
    height: 126,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 60, // Reserve 68px for mobile status bar
    paddingBottom: 8,
    backgroundColor: COLORS.black,
    // Content area is 64px high starting at top: 68px
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 50,
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14, // H3 size
    fontWeight: "700", // H3 weight
    fontFamily: "Futura",
  },
  nameAgencyContainer: {
    flexDirection: "column",
  },
  realtorName: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.white,
    fontFamily: "Futura",
  },
  agencyName: {
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.slate,
    fontFamily: "Futura",
  },
  menuIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.green,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    gap: 10,
  },

  // Invite Banner
  inviteBanner: {
    backgroundColor: COLORS.white,
    minHeight: 80,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: "#1D2327",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  inviteRealtorsButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 33,
    marginRight: 16,
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    // Slightly increased width to prevent potential text wrapping
    flexDirection: "row", // Ensures text flows horizontally
  },
  inviteRealtorsText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
    fontFamily: "Futura",
    textAlign: "center", // Ensure text is centered
    flexShrink: 1, // Allow text to shrink if needed
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 500, // P weight
    color: COLORS.green,
    lineHeight: 20,
    fontFamily: "Futura",
  },

  // Clients section
  clientsTitleContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  clientsTitle: {
    fontSize: 24, // H1 size
    fontWeight: 700, // H1 weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  ActiveText: {
    fontSize: 14, // P size
    fontWeight: 700, // P weight
    color: COLORS.slate,
    fontFamily: "Futura",
    marginTop: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 64, // Increased vertical padding to add more space
    gap: 16, // Gap between items in the scroll view
  },
  clientsScrollView: {
    flex: 1,
    paddingBottom: 16, // Padding at the bottom of the scroll view
    marginBottom: 64, // Space for the floating button
  },
  clientCard: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginVertical: 2, // Increased vertical margin for more space between cards
    padding: 8,
    width: "95%",
    minWidth: 358,
    maxWidth: 528,
    height: 78,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 }, // Added slight vertical offset for better shadow effect
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    gap: 2,
  },
  initialsCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: COLORS.slate,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 14, // H3 size
    fontWeight: "700", // H3 weight
    fontFamily: "Futura",
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18, // Slightly larger
    fontWeight: "600", // Bolder
    color: COLORS.black,
    marginBottom: 0,
    fontFamily: "Futura",
  },
  clientStatus: {
    fontSize: 12, // H4 size
    color: COLORS.black,
    fontWeight: "500", // Medium weight
    backgroundColor: COLORS.coloredBackgroundFill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    fontFamily: "Futura",
  },
  statusProgressBar: {
    marginTop: 4,
    width: "100%",
  },
  // Bottom button
  bottomButtonContainer: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 48,
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 34,
    right: 24,
    minWidth: 271,
    height: 56,
    borderRadius: 30,
    backgroundColor: "#F0913A", // Orange color
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 16,
    //gap: 8, // Space between icon and text
  },
  addClientButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Futura",
    marginLeft: 0,
  },
  contactInviteContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
  },
  /* ================= MODALS & FORMS ================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  formOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 8,
    width: "90%",
    maxHeight: "90%",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "visible",
    position: "relative",
  },
  formTitle: {
    fontSize: 14, // H1 size
    fontWeight: 700, // H1 weight
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0,
    color: COLORS.black,
    fontFamily: "Futura",
  },
  formSubtitle: {
    textAlign: "center",
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    color: COLORS.slate,
    marginBottom: 32,
    paddingHorizontal: 24,
    fontFamily: "Futura",
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    color: COLORS.black,
    borderRadius: 8,
    padding: 12,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginBottom: 16,
    minHeight: 48,
    fontFamily: "Futura",
  },
  label: {
    marginBottom: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 60,
    borderWidth: 1,
    borderColor: COLORS.gray,
    overflow: "hidden",
    marginBottom: 32,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 60,
    backgroundColor: COLORS.white,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.black,
  },
  toggleText: {
    color: COLORS.black,
    fontWeight: "700", // P weight
    fontSize: 12, // P size
    fontFamily: "Futura",
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: "700", // P weight
    fontSize: 12, // P size
    fontFamily: "Futura",
  },
  formActions: {
    flexDirection: "column",
    gap: 16,
  },
  sendInviteButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    alignSelf: "center",
    alignItems: "center",
    minWidth: 120,
    marginVertical: 24,
  },
  loadingButton: {
    opacity: 0.7,
  },
  sendInviteButtonText: {
    color: COLORS.white,
    fontSize: 12, // H3 size
    borderRadius: 50,
    fontWeight: 700, // H3 weight
    fontFamily: "Futura",
  },
  feedbackMessage: {
    textAlign: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: COLORS.noticeContainer,
    color: COLORS.green,
  },
  errorMessage: {
    backgroundColor: COLORS.noticeContainer,
    color: COLORS.red,
  },
  modalContent: {
    width: "100%", // Changed from 90% to 100%
    backgroundColor: "#F6F6F6",
  },
  modalTitle: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  feedbackMsg: {
    textAlign: "center",
    marginVertical: 8,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  success: { color: COLORS.green },
  error: { color: COLORS.red },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    height: 48,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    backgroundColor: COLORS.white,
    fontFamily: "Futura",
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  modalBtnTxt: {
    color: COLORS.white,
    fontWeight: "500",
    fontSize: 14,
    fontFamily: "Futura",
  },
  modalBtnDisabled: { opacity: 0.6 },
  // New modal styles for react-native-modal
  sideModal: {
    margin: 0, // Remove default margin to make it full width
    justifyContent: "flex-start", // Align to the side
    flex: 1,
  },
  rightSideModal: {
    alignItems: "flex-end", // Align to the right side
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    height: "100%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  modalContentForRealtorInvite: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 8,
    width: "90%",
    maxHeight: "90%",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },
  rightSlideModal: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  closeButton: {
    padding: 8,
  },
  contactPickerButton: {
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  contactPickerText: {
    color: COLORS.white,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginLeft: 8,
    fontFamily: "Futura",
  },
  selectedContactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.silver,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedContactName: {
    flex: 1,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  clearContactButton: {
    padding: 8,
  },
  dividerContainer: {
    marginVertical: 24,
    alignItems: "center",
  },
  orText: {
    textAlign: "center",
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginBottom: 24,
    fontFamily: "Futura",
  },
  contactsButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "90%",
  },
  contactsButtonText: {
    color: COLORS.white,
    fontSize: 12, // P size
    fontWeight: 700, // P weight
    fontFamily: "Futura",
  },
  uploadFileButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 6,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 13,
    minHeight: 42,
  },
  uploadFileText: {
    color: COLORS.white,
    fontSize: 12, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  orDivider: {
    textAlign: "center",
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginVertical: 16,
    fontFamily: "Futura",
  },
  alternativeText: {
    textAlign: "center",
    color: COLORS.slate,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginTop: 16,
    fontFamily: "Futura",
  },
  closeFormButton: {
    position: "absolute",
    top: -10, // Half of the circle height (37/2) to position it 50% outside
    right: -10, // Half of the circle width (37/2) to position it 50% outside
    zIndex: 10,
  },
  contactOptions: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  contactOptionsTitle: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    marginBottom: 16,
    color: COLORS.black,
    fontFamily: "Futura",
  },
  contactOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 48, // 48px gap before None button
  },
  primaryOptionBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    minWidth: 120,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryOptionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
    fontFamily: "Futura",
    textAlign: "center",
  },
  noneOptionContainer: {
    alignItems: "center",
    width: "100%",
  },
  noneButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "80%",
  },
  noneButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  contactIconBtn: {
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 16,
  },
  contactIconText: {
    marginTop: 8,
    fontSize: 12, // H4 size
    fontWeight: "bold", // H4 weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  doneButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  doneButtonText: {
    color: COLORS.white,
    borderRadius: 50,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  inviteOptionsContainer: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 8,
    width: "90%",
    maxHeight: "90%",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 18.5,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "visible",
    position: "relative",
    alignItems: "center",
  },
  inviteOptionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0,
    color: COLORS.green,
    fontFamily: "Futura",
  },
  inviteOptionsSubtitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 24,
    paddingHorizontal: 16,
    fontFamily: "Futura",
  },
  contactInviteContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
  },
  bottomSlideModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
    // Animation styles
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rewardsSideModal: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "100%", // Takes full width of the screen
    backgroundColor: COLORS.white,
    overflow: "hidden",
    height: "100%",
    // Animation styles
    shadowColor: "#000",
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  clientCardModalContent: {
    padding: 24,
    paddingTop: 16,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 16,
  },
  clientCardDetails: {
    alignItems: "center",
    marginBottom: 16,
  },
  clientCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  clientCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  clientCardName: {
    fontSize: 20, // H2 size
    fontWeight: "bold", // H2 weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  clientCardStatus: {
    fontSize: 14, // P size
    color: COLORS.green,
    fontWeight: "500", // P weight
    backgroundColor: COLORS.coloredBackgroundFill,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    fontFamily: "Futura",
  },
  detailStatusProgressBar: {
    marginTop: 8,
    width: "100%",
  },
  clientCardActions: {
    width: "100%",
    alignItems: "center",
  },
  viewDetailsButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  viewDetailsButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  addClientButton: {
    position: "absolute",
    top: 0, // Based on the Swift code positioning
    right: 3, // Based on the Swift code positioning
    width: 271,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  addClientButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 10, // Space between icon and text
  },
  addClientButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Futura",
    marginLeft: 6,
  },
  closeButtonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 100,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 100,
  },
  emptyStateContainer: {
    marginTop: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    color: "#FDFDFD",
    paddingVertical: 30,
    paddingHorizontal: 20,
    // iOS shadow
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
    backgroundColor: "#FDFDFD", // Required for Android shadow
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#A9A9A9",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#A9A9A9",
    textAlign: "center",
    marginBottom: 8,
  },
  addClientsButton: {
    backgroundColor: "#F0913A",
    marginTop: 16,
    minWidth: 271,
    minHeight: 56,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addClientsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RealtorHome;
