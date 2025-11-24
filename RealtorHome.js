import React, { useState, useRef, useEffect } from "react";
import * as MailComposer from "expo-mail-composer";
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
  Dimensions,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import * as Contacts from "expo-contacts";
import Svg, { Rect, Path, Circle } from "react-native-svg";
import { useAuth } from "./context/AuthContext";
import { useRealtor } from "./context/RealtorContext";
import { useNotification } from "./context/NotificationContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ProfileUpdateModal from "./components/modals/ProfileUpdateModal";
import NotificationBell from "./components/icons/NotificationBell";
import { Ionicons } from "@expo/vector-icons";
import GiftIcon from "./components/icons/GiftIcon";
import {
  EmptyProgressBar,
  MidProgressBar,
  CustomProgressBar,
  CompleteProgressBar,
} from "./components/progressBars";
import InviteRealtorModal from "./components/modals/InviteRealtorModal";
import CustomAdminMessagesModal from "./components/modals/CustomAdminMessagesModal";
import ChatModal from "./components/ChatModal";
import MortgageApplicationModal from "./components/modals/MortgageApplicationModal";
import InviteClientModal from "./components/modals/InviteClientModal";
import ShareOptionsModal from "./components/modals/ShareOptionsModal";
import FullyApprovedClientModal from "./components/FullyApprovedClientModal";
import PurchaseConfirmationModal from "./components/PurchaseConfirmationModal";
import PurchaseDetailsModal from "./components/PurchaseDetailsModal";

// These are placeholders for your actual components
import RealtorProfile from "./screens/RealtorProfile.js";
import RealtorRewards from "./screens/RealtorRewards.js";
import CSVUploadForm from "./screens/AddProfilePic";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { trimLeft, trimFull } from "./utils/stringUtils";

// Design System Colors
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#0E1D1D", //  "#1D2327",
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

import {
  formatPhoneNumber,
  unFormatPhoneNumber,
} from "./utils/phoneFormatUtils";
import { getClientStatusText } from "./utils/statusTextUtils";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const RealtorHome = React.forwardRef(({ onShowNotifications }, ref) => {
  // Blinking animation for FullyApproved clients with paperwork requested
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      blinkAnim.setValue(0);
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.delay(3000),
      ]).start((result) => {
        if (result.finished) {
          animate();
        }
      });
    };

    animate();

    return () => {
      blinkAnim.stopAnimation();
    };
  }, []);

  const blinkingBackgroundColor = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(253, 253, 253, 0.18)", "rgba(240, 146, 58, 0.18)"],
  });

  const { auth } = useAuth();
  const realtor = auth.realtor;
  const realtorFromContext = useRealtor();
  const { unreadCount, notifications, refreshNotifications } =
    useNotification();

  const invited = realtorFromContext?.invitedClients || [];
  const completedReferrals =
    realtorFromContext?.completedReferrals?.completedInvites || [];
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const profileChecked = await AsyncStorage.getItem(
          `profileChecked_${realtor.id}`
        );
        console.log("Profile checked status:", profileChecked);
        if (profileChecked === "false") {
          // Check if there's at least one fully approved client
          const hasFullyApprovedClient = invited.some(
            (client) => client.clientStatus === "FullyApproved"
          );
          console.log("Has fully approved client:", hasFullyApprovedClient);

          if (hasFullyApprovedClient) {
            setShowProfileUpdateModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking profile status:", error);
      }
    };

    checkProfileStatus();
    fetchCustomMessages();
  }, [realtor, invited]);

  // Button animation
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const navigation = useNavigation();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showMortgageModal, setShowMortgageModal] = useState(false);

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
        `https://signup.roostapp.io/realtor/${realtor.id}/invite-client-csv`,
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [feedback, setFeedback] = useState({ msg: "", type: "" });
  const [showProfile, setShowProfile] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [cachedImageBase64, setCachedImageBase64] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isMultiple, setIsMultiple] = useState(false); // New state for single/multiple toggle
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showInviteOptionsModal, setShowInviteOptionsModal] = useState(false);
  const [selectedClientCard, setSelectedClientCard] = useState(null);
  const [showClientCardModal, setShowClientCardModal] = useState(false);
  const [showResendInviteOptions, setShowResendInviteOptions] = useState(false);
  const resendButtonFadeAnim = useRef(new Animated.Value(1)).current;
  const resendButtonSlideAnim = useRef(new Animated.Value(0)).current;
  const inviteOptionsFadeAnim = useRef(new Animated.Value(0)).current;
  const inviteOptionsSlideAnim = useRef(new Animated.Value(20)).current;
  const [showClientReferralModal, setShowClientReferralModal] = useState(false);
  // For left slide (profile), start at -1000 (off-screen to the left)
  const leftSlideAnim = useRef(new Animated.Value(-1000)).current;
  // For right slide (rewards), start at 1000 (off-screen to the right)
  const rightSlideAnim = useRef(new Animated.Value(1000)).current;
  // For bottom slide (client card), start at 1000 (off-screen to the bottom)
  const bottomSlideAnim = useRef(new Animated.Value(1000)).current;

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

  useEffect(() => {
    if (showResendInviteOptions) {
      // Fade out and slide up the resend button
      Animated.parallel([
        Animated.timing(resendButtonFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(resendButtonSlideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade in and slide up the options
      Animated.parallel([
        Animated.timing(inviteOptionsFadeAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inviteOptionsSlideAnim, {
          toValue: 0,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      resendButtonFadeAnim.setValue(1);
      resendButtonSlideAnim.setValue(0);
      inviteOptionsFadeAnim.setValue(0);
      inviteOptionsSlideAnim.setValue(20);
    }
  }, [showResendInviteOptions]);

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

      // Try to load profile image from local storage
      const loadCachedProfileImage = async () => {
        try {
          if (realtor && realtor.id) {
            const cachedImageData = await AsyncStorage.getItem(
              `profileImage_${realtor.id}`
            );

            if (cachedImageData) {
              const { base64, timestamp } = JSON.parse(cachedImageData);

              // Check if cached image is less than 24 hours old
              const now = Date.now();
              const isRecent = now - timestamp < 24 * 60 * 60 * 1000; // 24 hours

              if (isRecent && base64) {
                console.log("Loaded profile image from local storage");
                setCachedImageBase64(base64);
              } else {
                // Clear outdated cache
                console.log("Cached image is outdated, clearing cache");
                await AsyncStorage.removeItem(`profileImage_${realtor.id}`);
              }
            }
          }
        } catch (error) {
          console.error("Error loading cached profile image:", error);
        }
      };

      loadCachedProfileImage();
    }
  }, [realtorFromContext?.realtorInfo]);

  useFocusEffect(
    React.useCallback(() => {
      console.log("useFocusEffect called");
      onRefresh();
      setRefreshing(false);
    }, [onRefresh])
  );

  const handleInviteClient = async () => {
    setIsLoading(true);
    setFeedback({ message, type: "" });

    // Validation
    let hasError = false;
    let newFieldErrors = {};
    if (!formData.firstName || formData.firstName.trim() === "") {
      newFieldErrors.firstName = "First name is required.";
      hasError = true;
    }
    if (!formData.email && !formData.phone) {
      newFieldErrors.emailPhone = "Email or phone is required.";
      hasError = true;
    }
    setFieldErrors(newFieldErrors);
    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      // Combine firstName and lastName into referenceName
      const fullName = `${formData.firstName || ""} ${
        formData.lastName || ""
      }`.trim();

      const payload = {
        referenceName: fullName, // Use combined name
        phone: formData.phone,
        email: formData.email,
        type: "Client",
      };

      console.log("Sending invite for:", payload);

      const response = await fetch(
        `https://signup.roostapp.io/realtor/${realtor.id}/invite-client`,
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

        console.log("RealtorHome - Client invited successfully!");
        console.log("RealtorHome - formData:", formData);

        // Show the invite options modal on top (keep form open)
        setTimeout(() => {
          console.log("RealtorHome - Setting showInviteOptionsModal to true");
          setShowInviteOptionsModal(true);
        }, 300);

        // Refresh the realtor data to show the new client
        realtorFromContext?.fetchLatestRealtor();

        // Update needed documents counts for all clients
        setTimeout(() => {
          updateNeededDocumentsCounts();
        }, 1000); // Small delay to ensure the new client is available
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
        `https://signup.roostapp.io/client/neededdocument/${clientId}`
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
      .slice(0, 2)
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

  // Handler for mortgage application
  const handleMortgageApplication = () => {
    setShowMortgageModal(true);
  };

  const handleMortgageConfirm = async () => {
    // Modal now handles the API call internally
    console.log("Mortgage application confirmed");
  };

  // Update the onRefresh function to also fetch realtor data and notifications
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      auth.refetch?.(),
      realtorFromContext?.fetchLatestRealtor(),
      refreshNotifications && refreshNotifications(),
    ])
      .then(() => {
        // After fetching realtor data, update needed documents counts
        updateNeededDocumentsCounts();
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [auth, realtorFromContext, refreshNotifications]);
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
            contact.firstName || contact.lastName
              ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
              : contact.name || "";

          setFormData({
            referenceName: contactName, // Set the nickname to the contact's name
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            phone: phoneNumber.slice(-10),
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

I'm sending you an invite to get a mortgage with Roost, here is the link to sign up: ${signupLink}`;

    const smsUrl = `sms:${formData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.openURL(smsUrl).catch((err) =>
      console.error("Error opening SMS:", err)
    );

    // Close both modals and schedule transactional email check
    setShowInviteOptionsModal(false);
    setShowForm(false);
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
    const emailBody = `Hi ${formData.firstName},

I'm sending you an invite to get a mortgage with Roost, here is the link to sign up: ${signupLink}. If you have any questions just ask.`;

    const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Error opening email:", err)
    );

    // Close both modals and schedule transactional email check
    setShowInviteOptionsModal(false);
    setShowForm(false);
    resetFormData();
    scheduleTransactionalEmailCheck();
  };

  const handleNoneOption = () => {
    // Send transactional email immediately
    // sendTransactionalEmail();
    setShowInviteOptionsModal(false);
    setShowForm(false);
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
        `https://signup.roostapp.io/realtor/${realtor.id}/send-transactional-email`,
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
  // Fully Approved Modal state
  const [showFullyApprovedModal, setShowFullyApprovedModal] = useState(false);
  const [selectedFullyApprovedClient, setSelectedFullyApprovedClient] =
    useState(null);
  const [showPurchaseConfirmationModal, setShowPurchaseConfirmationModal] =
    useState(false);
  const [showPurchaseDetailsModal, setShowPurchaseDetailsModal] =
    useState(false);
  // Custom admin messages modal state (re-added)
  const [customMessages, setCustomMessages] = useState([]);
  const [currentCustomMsgIndex, setCurrentCustomMsgIndex] = useState(0);
  const [showCustomMessageModal, setShowCustomMessageModal] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  // Chat modal state
  const [showChat, setShowChat] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Handler for chat unread changes
  const handleChatUnreadChange = (hasUnread) => {
    console.log("🏠 [RealtorHome] Chat unread status changed:", hasUnread);
    setHasUnreadChat(hasUnread);
  };

  // Monitor badge state changes
  useEffect(() => {
    console.log(
      "🔴 [RealtorHome] BADGE STATE:",
      hasUnreadChat ? "SHOWING" : "HIDDEN"
    );
  }, [hasUnreadChat]);

  // Expose methods to parent components via ref
  React.useImperativeHandle(ref, () => ({
    openProfile: () => {
      console.log("🔵 [RealtorHome] openProfile called via ref");
      setShowProfile(true);
    },
    openRewards: () => {
      console.log("🔵 [RealtorHome] openRewards called via ref");
      setShowRewards(true);
    },
  }));

  // Hardcoded documents list for Fully Approved modal (no API call)
  const fullyApprovedDocs = [
    "Agreement of Purchase and Sale",
    "MLS Data Sheet",
    "Receipt of Funds",
  ];

  // Add this useEffect to segregate clients
  useEffect(() => {
    if (invited.length > 0) {
      const completed = invited.filter(
        (client) => client.clientStatus === "Completed"
      );
      const active = invited.filter(
        (client) => client.clientStatus !== "Completed"
      );
      // Sort active so FullyApproved always on top
      const sortedActive = [...active].sort((a, b) => {
        const aFA = a.clientStatus === "FullyApproved" ? 2 : 0;
        const aPA = a.clientStatus === "PreApproved" ? 1 : 0;
        const bFA = b.clientStatus === "FullyApproved" ? 2 : 0;
        const bPA = b.clientStatus === "PreApproved" ? 1 : 0;
        const pref = bFA - aFA || bPA - aPA; // put FullyApproved (2) first, then PreApproved (1)
        if (pref !== 0) return pref;
        // fallback alphabetical by referenceName
        return (a.referenceName || "").localeCompare(b.referenceName || "");
      });
      setCompletedClients(completed);
      setActiveClients(sortedActive);
    } else {
      setCompletedClients([]);
      setActiveClients([]);
    }
  }, [invited]);

  const openFullyApprovedModal = (client) => {
    setSelectedFullyApprovedClient(client);
    // If paperWorkRequested is true, show old modal (FullyApprovedClientModal)
    // If paperWorkRequested is false/undefined, show new modal (PurchaseConfirmationModal)
    if (client?.fullyApprovedDetails?.paperWorkRequested) {
      setShowFullyApprovedModal(true);
    } else {
      setShowPurchaseConfirmationModal(true);
    }
  };

  // Fetch custom messages for realtor
  const fetchCustomMessages = async () => {
    console.log("Fetching custom messages for realtor:", realtor.id);
    if (!realtor?.id) return;
    try {
      const res = await fetch(
        `https://signup.roostapp.io/admin/custom-messages?userId=${realtor.id}`
      );
      if (res.ok) {
        const data = await res.json();
        const unread = (data.messages || []).filter((m) => !m.read);
        if (unread.length > 0) {
          setCustomMessages(unread);
          setCurrentCustomMsgIndex(0);
          setShowCustomMessageModal(true);
        }
      } else {
        console.log("Failed to fetch custom messages", res.status);
      }
    } catch (e) {
      console.log("Error fetching custom messages", e.message);
    }
  };

  const acknowledgeCurrentMessage = async () => {
    setShowCustomMessageModal(false);
    if (!customMessages.length) return;
    const msg = customMessages[currentCustomMsgIndex];
    if (!msg?._id) return;
    setAckLoading(true);
    try {
      await fetch(
        `https://signup.roostapp.io/admin/custom-messages/${msg._id}/read`,
        { method: "PUT" }
      );
    } catch (e) {
      console.log("Error marking message read", e.message);
    } finally {
      setAckLoading(false);
      const next = currentCustomMsgIndex + 1;
      if (next < customMessages.length) {
        // Close then reopen for next message to avoid showing a counter
        setShowCustomMessageModal(false);
        setTimeout(() => {
          setCurrentCustomMsgIndex(next);
          setShowCustomMessageModal(true);
        }, 50);
      } else {
        setShowCustomMessageModal(false);
        setCustomMessages([]);
      }
    }
  };

  // Chat handler
  const handleChatPress = () => {
    setShowChat(true);
  };

  return (
    <View style={styles.container}>
      <ProfileUpdateModal
        isVisible={showProfileUpdateModal}
        onClose={() => setShowProfileUpdateModal(false)}
        realtorId={realtor.id}
      />

      <CustomAdminMessagesModal
        visible={showCustomMessageModal}
        messages={customMessages}
        currentIndex={currentCustomMsgIndex}
        onAcknowledge={acknowledgeCurrentMessage}
        onRequestClose={() => setShowCustomMessageModal(false)}
        loading={ackLoading}
        colors={{
          backdrop: "rgba(0,0,0,0.5)",
          surface: COLORS.white,
          title: COLORS.black,
          body: COLORS.black,
          primary: COLORS.green,
          primaryText: COLORS.white,
          counter: COLORS.slate,
        }}
      />

      {/* ================= TOP HEADER ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={handleProfileClick}
          activeOpacity={0.7}
        >
          {realtor.id && (
            <>
              {/* Always show initials avatar, overlay image when loaded */}
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: "#2271B1",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                  },
                ]}
              >
                <Text style={styles.avatarText}>
                  {getInitials(
                    realtorFromContext?.realtorInfo?.name || realtor.name
                  )}
                </Text>
                {!imageLoadError && (
                  <Image
                    source={
                      cachedImageBase64
                        ? { uri: `data:image/jpeg;base64,${cachedImageBase64}` }
                        : {
                            uri: `https://signup.roostapp.io/realtor/profilepic/${realtor.id}?t=${imageRefreshKey}`,
                          }
                    }
                    style={[
                      styles.avatar,
                      { position: "absolute", top: 0, left: 0 },
                    ]}
                    onError={() => setImageLoadError(true)}
                    onLoad={async () => {
                      try {
                        // Only download if we don't have cached image
                        if (!cachedImageBase64) {
                          const imageUri = `https://signup.roostapp.io/realtor/profilepic/${realtor.id}?t=${imageRefreshKey}`;
                          const localUri =
                            FileSystem.cacheDirectory +
                            `profile_${realtor.id}.jpg`;

                          // Download the image to local cache
                          await FileSystem.downloadAsync(imageUri, localUri);

                          // Read the file as base64
                          const base64 = await FileSystem.readAsStringAsync(
                            localUri,
                            {
                              encoding: FileSystem.EncodingType.Base64,
                            }
                          );

                          // Save to state
                          setCachedImageBase64(base64);

                          // Also save to AsyncStorage for persistence
                          const imageData = {
                            base64: base64,
                            timestamp: Date.now(),
                          };

                          await AsyncStorage.setItem(
                            `profileImage_${realtor.id}`,
                            JSON.stringify(imageData)
                          );
                        }
                      } catch (error) {
                        console.log("Error caching profile image:", error);
                      }
                    }}
                  />
                )}
              </View>
            </>
          )}
          <View style={styles.nameAgencyContainer}>
            <Text
              style={styles.realtorName}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {realtorFromContext?.realtorInfo?.name || realtor.name}
            </Text>
            <Text
              style={styles.agencyName}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {realtorFromContext?.realtorInfo?.brokerageInfo?.brokerageName ||
                realtor?.brokerageInfo?.brokerageName ||
                null}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.iconsContainer}>
          <NotificationBell
            size={26}
            bellColor="#ffffff"
            badgeColor="#F0913A"
            showBadge={unreadCount > 0}
            badgeCount={unreadCount}
            style={styles.notificationBell}
            onPress={onShowNotifications}
          />
          {/* <TouchableOpacity
            style={styles.chatIconContainer}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={COLORS.white}
            />
            {hasUnreadChat && (
              <View style={styles.chatUnreadBadge}>
                <View style={styles.chatUnreadDot} />
              </View>
            )}
          </TouchableOpacity> */}
          <GiftIcon
            onPress={handleRewardsClick}
            width={46}
            height={46}
            backgroundColor="#0E1D1D"
            strokeColor="#377473"
            pathColor="#FDFDFD"
          />
        </View>
      </View>
      <View style={styles.headerExtendedBackground} />
      <View style={styles.inviteBanner}>
        <TouchableOpacity
          style={styles.inviteRealtorsButton}
          onPress={() => setShowInviteForm(true)}
        >
          <Text style={styles.inviteRealtorsText}>Invite Realtors</Text>
        </TouchableOpacity>
        <Text style={styles.inviteBannerText}>
          Earn an additional 5% from any from realtor that you refer, once one
          of their clients completes a mortgage.
        </Text>
      </View>

      {/* ================= INVITE REALTORS BANNER ================= */}
      <Animated.ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.green]} // Android
            tintColor={COLORS.green} // iOS
          />
        }
      >
        {/* <View style={styles.inviteBanner}>
          <TouchableOpacity
            style={styles.inviteRealtorsButton}
            onPress={handleMortgageApplication}
          >
            <Text style={styles.inviteRealtorsText}>Apply</Text>
          </TouchableOpacity>
          <Text style={styles.inviteBannerText}>
            Realtors need some extra cash? 8% financing available just for you!
          </Text>
        </View> */}
        {/* ================= TITLE: CLIENTS ================= */}

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
          <View style={styles.clientsTitleContainer}>
            {/* <Text style={styles.clientsTitle}>Clients</Text> */}
            <Text style={styles.ActiveText}>ACTIVE CLIENTS</Text>
          </View>
          {activeClients.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Client activity will show here
              </Text>
              <Text style={styles.emptyStateSubText}>
                Add your first client by pressing the button below
              </Text>
              {/* <TouchableOpacity
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
              </TouchableOpacity> */}
            </View>
          ) : (
            <View style={styles.clientsGroupWrapper}>
              {activeClients.map((client, index) => {
                const docCount = client.documents
                  ? getDocumentCounts(client.documents)
                  : { approved: 0, pending: 0 };

                const totalNeeded =
                  neededDocumentsCount[client.inviteeId] || 10;

                const statusText = getClientStatusText(client, {
                  docCount,
                  totalNeeded,
                });

                const isPaperWorkRequested =
                  client.clientStatus === "FullyApproved" &&
                  client.fullyApprovedDetails?.paperWorkRequested;

                return (
                  <AnimatedTouchableOpacity
                    key={client.id || client._id || client.inviteeId}
                    style={[
                      styles.clientCard,
                      isPaperWorkRequested && {
                        backgroundColor: blinkingBackgroundColor,
                      },
                    ]}
                    onPress={() =>
                      client.clientStatus === "FullyApproved"
                        ? openFullyApprovedModal(client)
                        : handleClientClick(client)
                    }
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
                      {client.clientStatus === "FullyApproved" &&
                      client.fullyApprovedDetails?.paperWorkRequested ? (
                        <CompleteProgressBar text="Share Documents" />
                      ) : client.clientStatus === "FullyApproved" ? (
                        <CompleteProgressBar
                          text={`Fully Approved - $${parseFloat(
                            client.fullyApprovedDetails?.amount
                          ).toFixed(0)}`}
                        />
                      ) : client.clientStatus === "Completed" ? (
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
                      ) : client.clientStatus === "PreApproved" ? (
                        <MidProgressBar text="Pre approved" progress={100} />
                      ) : client.status === "ACCEPTED" &&
                        client.documents &&
                        client.documents.length > 0 ? (
                        <MidProgressBar
                          text={`${docCount.approved}/${totalNeeded} Documents`}
                          progress={(docCount.approved / totalNeeded) * 100}
                        />
                      ) : (
                        <EmptyProgressBar
                          text={statusText}
                          progress={
                            client.status === "PENDING"
                              ? 10
                              : client.status === "ACCEPTED"
                              ? 30
                              : 50
                          }
                        />
                      )}
                    </View>
                    {index !== activeClients.length - 1 && (
                      <View style={styles.clientCardBorder} />
                    )}
                  </AnimatedTouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.completedClientsContainer}>
            <View style={[styles.clientsTitleContainer]}>
              <Text style={styles.ActiveText}>COMPLETED</Text>
            </View>

            {completedClients.length > 0 ? (
              <View style={styles.clientsGroupWrapper}>
                {completedClients.map((client, index) => {
                  return (
                    <TouchableOpacity
                      key={client.id || client._id || client.inviteeId}
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
                      </View>
                      {index !== completedClients.length - 1 && (
                        <View style={styles.clientCardBorder} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Currently no mortgages have been completed.
                </Text>
              </View>
            )}
          </View>

          {completedReferrals.length > 0 && (
            <View style={styles.completedReferralsContainer}>
              <View style={[styles.clientsTitleContainer]}>
                <Text style={styles.ActiveText}>COMPLETED - REFERRAL</Text>
              </View>
              <View style={styles.clientsGroupWrapper}>
                {completedReferrals.map((client, index) => (
                  <TouchableOpacity
                    key={client.id || client._id || client.inviteeId}
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
                    {index !== completedReferrals.length - 1 && (
                      <View style={styles.clientCardBorder} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        {/* ================= FLOATING ADD CLIENT BUTTON ================= */}
      </Animated.ScrollView>
      {activeClients.length > 0 || completedClients.length > 0 ? (
        <Animated.View
          style={[
            styles.floatingAddButton,
            {
              width: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenWidth * 0.9, 59],
                extrapolate: "clamp",
              }),
              height: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [56, 58],
                extrapolate: "clamp",
              }),
              backgroundColor: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#377473", "rgba(55, 116, 115, 0)"],
                extrapolate: "clamp",
              }),
              shadowOpacity: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
                extrapolate: "clamp",
              }),
              elevation: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateX: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      0,
                      screenWidth * 0.9 - 59, // Move to right side
                    ],
                    extrapolate: "clamp",
                  }),
                },
              ],
              minWidth: 0, // Override minWidth from styles
              paddingHorizontal: 0,
            },
          ]}
        >
          <TouchableOpacity
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
            }}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <View style={{ marginRight: 0 }}>
              <Svg width="56" height="56" viewBox="0 0 59 58" fill="none">
                <Rect
                  x="1"
                  y="1"
                  width="54"
                  height="54"
                  rx="27"
                  fill="#377473"
                />
                <Path
                  d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                  stroke="#FDFDFD"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Animated.Text
              style={[
                styles.addClientButtonText,
                {
                  opacity: buttonAnim.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                  }),
                  maxWidth: buttonAnim.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: [100, 0],
                    extrapolate: "clamp",
                  }),
                  marginLeft: buttonAnim.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: [10, 0],
                    extrapolate: "clamp",
                  }),
                },
              ]}
              numberOfLines={1}
            >
              ADD CLIENT
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <View style={styles.floatingAddButtonEmptyClients}>
            <Svg width="59" height="58" viewBox="0 0 59 58" fill="none">
              <Rect x="1" y="1" width="54" height="54" rx="27" fill="#377473" />
              <Path
                d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
                stroke="#FDFDFD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
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
            onClose={async (imageWasUpdated) => {
              // If the profile picture was updated, refresh our cached image
              if (imageWasUpdated) {
                try {
                  // Reset the image load error flag
                  setImageLoadError(false);
                  // Update the timestamp to force a refresh
                  setImageRefreshKey(Date.now());

                  // Try to load the updated image from AsyncStorage first
                  const cachedImageData = await AsyncStorage.getItem(
                    `profileImage_${realtor.id}`
                  );

                  if (cachedImageData) {
                    const { base64 } = JSON.parse(cachedImageData);
                    if (base64) {
                      // Use the freshly saved image immediately
                      setCachedImageBase64(base64);
                      console.log(
                        "Using freshly updated image from AsyncStorage"
                      );
                    } else {
                      // If somehow we don't have base64 data, trigger a re-download
                      setCachedImageBase64(null);
                    }
                  } else {
                    // If no cached image exists yet, trigger a download
                    setCachedImageBase64(null);

                    // Download the image directly
                    const imageUri = `https://signup.roostapp.io/realtor/profilepic/${
                      realtor.id
                    }?t=${Date.now()}`;
                    const localUri =
                      FileSystem.cacheDirectory + `profile_${realtor.id}.jpg`;

                    await FileSystem.downloadAsync(imageUri, localUri);

                    // Read the file as base64
                    const base64 = await FileSystem.readAsStringAsync(
                      localUri,
                      {
                        encoding: FileSystem.EncodingType.Base64,
                      }
                    );

                    // Save to state
                    setCachedImageBase64(base64);

                    // Also save to AsyncStorage
                    const imageData = {
                      base64: base64,
                      timestamp: Date.now(),
                    };

                    await AsyncStorage.setItem(
                      `profileImage_${realtor.id}`,
                      JSON.stringify(imageData)
                    );
                  }
                } catch (error) {
                  console.error("Error handling profile image update:", error);
                  // Clear the cached image so it will be re-downloaded on next render
                  setCachedImageBase64(null);
                }
              }
              setShowProfile(false);
            }}
            preloadedImage={
              cachedImageBase64
                ? {
                    uri: `data:image/jpeg;base64,${cachedImageBase64}`,
                  }
                : null
            }
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
        key={Date.now()} // Force remount on each open
        visible={showInviteForm}
        onClose={() => setShowInviteForm(false)}
        realtorInfo={realtorFromContext?.realtorInfo}
        realtorId={realtor.id}
      />

      {/* Invite Client Modal */}
      {!showInviteOptionsModal && (
        <InviteClientModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          formData={formData}
          setFormData={setFormData}
          isMultiple={isMultiple}
          setIsMultiple={setIsMultiple}
          handleInviteClient={handleInviteClient}
          pickContact={pickContact}
          handlePickInviteFile={handlePickInviteFile}
          handleMultipleInvites={handleMultipleInvites}
          isLoading={isLoading}
          multiInviteLoading={multiInviteLoading}
          selectedInviteFile={selectedInviteFile}
          multiInviteFeedback={multiInviteFeedback}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          formatPhoneNumber={formatPhoneNumber}
          unFormatPhoneNumber={unFormatPhoneNumber}
          trimLeft={trimLeft}
          trimFull={trimFull}
        />
      )}

      {/* Share Options Modal for Client Invite */}
      {console.log(
        "RealtorHome Render - showInviteOptionsModal:",
        showInviteOptionsModal,
        "formData:",
        { phone: formData.phone, email: formData.email }
      )}
      {showInviteOptionsModal && (
        <ShareOptionsModal
          visible={showInviteOptionsModal}
          onClose={() => {
            console.log("ShareOptionsModal - onClose called");
            setShowInviteOptionsModal(false);
            setShowForm(false);
          }}
          title="Client invite via"
          subtitle="We have sent an invite! However its always best to reach out directly. Sending a personalized message is simple just click one of the options below."
          hasPhone={!!formData.phone}
          hasEmail={!!formData.email}
          onPersonalText={handlePersonalText}
          onPersonalEmail={handlePersonalEmail}
          onSkip={handleNoneOption}
        />
      )}

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
                onPress={() => {
                  setShowClientCardModal(false);
                  setShowResendInviteOptions(false);
                }}
              >
                <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                  <Circle cx="18.5" cy="18.5" r="18.5" fill="#ffffffff" />
                  <Path
                    d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                    fill="#5a5959ff"
                  />
                </Svg>
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
                      {/* {(() => {
                        const docCount = selectedClientCard.documents
                          ? getDocumentCounts(selectedClientCard.documents)
                          : { approved: 0, pending: 0 };
                        const totalNeeded =
                          neededDocumentsCount[selectedClientCard.inviteeId] ||
                          10;

                        // Show date for Invited status
                        if (selectedClientCard.status === "PENDING") {
                          return (
                            <EmptyProgressBar
                              text={getClientStatusText(selectedClientCard)}
                            />
                          );
                        }

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
                        ) : selectedClientCard.clientStatus ===
                          "FullyApproved" ? (
                          <CompleteProgressBar
                            text={`FULLY APPROVED - $${selectedClientCard.fullyApprovedDetails?.amount}`}
                          />
                        ) : selectedClientCard.clientStatus ===
                          "PreApproved" ? (
                          <MidProgressBar
                            text={`Pre approved`}
                            progress={100}
                          />
                        ) : selectedClientCard.status === "ACCEPTED" &&
                          selectedClientCard.documents &&
                          selectedClientCard.documents.length > 0 ? (
                          <MidProgressBar
                            text={`${docCount.approved}/${totalNeeded} Documents`}
                            progress={(docCount.approved / totalNeeded) * 100}
                          />
                        ) : (
                          <EmptyProgressBar
                            text={getClientStatusText(selectedClientCard)}
                            progress={
                              selectedClientCard.status === "PENDING"
                                ? 10
                                : selectedClientCard.status === "ACCEPTED" &&
                                  (!selectedClientCard.documents ||
                                    selectedClientCard.documents.length === 0)
                                ? 30
                                : 50
                            }
                          />
                        );
                      })()} */}
                    </View>
                  </View>

                  <View style={styles.clientCardActions}>
                    {selectedClientCard.status === "PENDING" ? (
                      showResendInviteOptions ? (
                        <Animated.View
                          style={{
                            width: "100%",
                            gap: 12,
                            alignItems: "center",
                            opacity: inviteOptionsFadeAnim,
                            transform: [
                              {
                                translateY: inviteOptionsSlideAnim,
                              },
                            ],
                          }}
                        >
                          {selectedClientCard.email && (
                            <TouchableOpacity
                              style={styles.inviteOptionButton}
                              onPress={async () => {
                                const email = selectedClientCard.email;
                                const link =
                                  selectedClientCard.inviteLink || "";
                                if (!link) {
                                  Alert.alert(
                                    "No Link",
                                    "No invite link available."
                                  );
                                  return;
                                }
                                const message = `Please accept my invitation to sign up and complete your details: ${link}`;
                                const subject = encodeURIComponent(
                                  "Invitation from Roost"
                                );
                                const body = encodeURIComponent(message);
                                const url = `mailto:${email}?subject=${subject}&body=${body}`;
                                try {
                                  const supported = await Linking.canOpenURL(
                                    url
                                  );
                                  if (supported) await Linking.openURL(url);
                                  else
                                    Alert.alert(
                                      "Not Supported",
                                      "Email is not available on this device."
                                    );
                                } catch (e) {
                                  Alert.alert("Error", "Unable to open email.");
                                }
                              }}
                            >
                              <Text style={styles.inviteOptionButtonText}>
                                Send Personal Email
                              </Text>
                            </TouchableOpacity>
                          )}

                          {selectedClientCard.phone && (
                            <TouchableOpacity
                              style={styles.inviteOptionButton}
                              onPress={async () => {
                                const phone = selectedClientCard.phone || "";
                                const link =
                                  selectedClientCard.inviteLink || "";
                                if (!link) {
                                  Alert.alert(
                                    "No Link",
                                    "No invite link available."
                                  );
                                  return;
                                }
                                const message = encodeURIComponent(
                                  `Please accept my invitation to sign up and complete your details: ${link}`
                                );
                                const delimiter =
                                  Platform.OS === "ios" ? "&" : "?";
                                const url = `sms:${phone}${delimiter}body=${message}`;
                                try {
                                  const supported = await Linking.canOpenURL(
                                    url
                                  );
                                  if (supported) await Linking.openURL(url);
                                  else
                                    Alert.alert(
                                      "Not Supported",
                                      "SMS is not available on this device."
                                    );
                                } catch (e) {
                                  Alert.alert("Error", "Unable to open SMS.");
                                }
                              }}
                            >
                              <Text style={styles.inviteOptionButtonText}>
                                Send Personal Text
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.inviteSkipButton}
                            onPress={() => {
                              setShowClientCardModal(false);
                              setShowResendInviteOptions(false);
                            }}
                          >
                            <Text style={styles.inviteSkipButtonText}>
                              Roost Invite
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      ) : (
                        <Animated.View
                          style={{
                            opacity: resendButtonFadeAnim,
                            transform: [
                              {
                                translateY: resendButtonSlideAnim,
                              },
                            ],
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => {
                              setShowResendInviteOptions(true);
                            }}
                          >
                            <Text style={styles.viewDetailsButtonText}>
                              Resend Invite
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      )
                    ) : (
                      <TouchableOpacity
                        style={styles.viewDetailsButton}
                        onPress={() => {
                          setShowClientCardModal(false);
                          navigation.navigate("ClientDetails", {
                            clientId: selectedClientCard.inviteeId,
                            clientData: selectedClientCard,
                            inviteId: selectedClientCard.inviteId,
                            onDelete: onRefresh,
                            statusText: getClientStatusText(
                              selectedClientCard,
                              {
                                isShortForm: true,
                              }
                            ),
                          });
                        }}
                      >
                        <Text style={styles.viewDetailsButtonText}>
                          View Details
                        </Text>
                      </TouchableOpacity>
                    )}
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
                        setDownloadProgress(0);
                        try {
                          // Use XMLHttpRequest for progress
                          const xhr = new XMLHttpRequest();
                          xhr.open(
                            "POST",
                            "https://signup.roostapp.io/pdf/download-filled-pdf",
                            true
                          );
                          xhr.setRequestHeader(
                            "Content-Type",
                            "application/json"
                          );
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
                                    const base64data =
                                      reader.result.split(",")[1];
                                    const fileUri =
                                      FileSystem.cacheDirectory +
                                      "referral.pdf";
                                    await FileSystem.writeAsStringAsync(
                                      fileUri,
                                      base64data,
                                      {
                                        encoding:
                                          FileSystem.EncodingType.Base64,
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
                              clientId: selectedClientCard?.id,
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
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                          <Text
                            style={[
                              styles.viewDetailsButtonText,
                              { marginLeft: 10 },
                            ]}
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
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
      {/* Fully Approved Client Modal (when paperWorkRequested = true) */}
      <Modal
        visible={showFullyApprovedModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFullyApprovedModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "flex-end" }]}>
          {selectedFullyApprovedClient && (
            <FullyApprovedClientModal
              client={selectedFullyApprovedClient}
              fullyApprovedDocs={fullyApprovedDocs}
              onClose={() => setShowFullyApprovedModal(false)}
              onViewDetails={() => {
                setShowFullyApprovedModal(false);
                navigation.navigate("ClientDetails", {
                  clientId: selectedFullyApprovedClient.inviteeId,
                  client: selectedFullyApprovedClient,
                  inviteId: selectedFullyApprovedClient.inviteId,
                  onDelete: onRefresh,
                  statusText: "Fully Approved",
                });
              }}
            />
          )}
        </View>
      </Modal>

      {/* Purchase Confirmation Modal (when paperWorkRequested = false) */}
      <Modal
        visible={showPurchaseConfirmationModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPurchaseConfirmationModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "flex-end" }]}>
          {selectedFullyApprovedClient && (
            <PurchaseConfirmationModal
              client={selectedFullyApprovedClient}
              onClose={() => setShowPurchaseConfirmationModal(false)}
              onViewDetails={() => {
                setShowPurchaseConfirmationModal(false);
                navigation.navigate("ClientDetails", {
                  clientId: selectedFullyApprovedClient.inviteeId,
                  client: selectedFullyApprovedClient,
                  inviteId: selectedFullyApprovedClient.inviteId,
                  onDelete: onRefresh,
                  statusText: "Fully Approved",
                });
              }}
              onPurchased={() => {
                setShowPurchaseConfirmationModal(false);
                setShowPurchaseDetailsModal(true);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Purchase Details Modal */}
      <Modal
        visible={showPurchaseDetailsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPurchaseDetailsModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "flex-end" }]}>
          {selectedFullyApprovedClient && (
            <PurchaseDetailsModal
              client={selectedFullyApprovedClient}
              onClose={() => {
                setShowPurchaseDetailsModal(false);
                setSelectedFullyApprovedClient(null);
              }}
              onConfirm={(purchaseDetails) => {
                // Handle the purchase details submission here
                console.log("Purchase details:", purchaseDetails);
                // Close the purchase details modal
                setShowPurchaseDetailsModal(false);
                // Open the FullyApprovedClientModal (old modal)
                setShowFullyApprovedModal(true);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Chat Modal */}
      <ChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        userId={realtor.id}
        userName={realtorFromContext?.realtorInfo?.name || realtor.name}
        userType="realtor"
        onUnreadChange={handleChatUnreadChange}
      />

      {/* Mortgage Application Modal */}
      <MortgageApplicationModal
        visible={showMortgageModal}
        onClose={() => setShowMortgageModal(false)}
        onConfirm={handleMortgageConfirm}
        realtorInfo={realtorFromContext?.realtorInfo || realtor}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  // Styles removed and moved to ProfileUpdateModal component
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
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBell: {
    marginRight: 15,
  },
  chatIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.green,
    backgroundColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    position: "relative",
  },
  chatUnreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#F0913A",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  chatUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
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
    flex: 1,
    maxWidth: 140,
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
    marginHorizontal: 8,
    marginTop: 8, // To overlap with header
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    shadowColor: "#0E1D1D",
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
    fontSize: 14,
    fontFamily: "Futura",
    textAlign: "center", // Ensure text is centered
    flexShrink: 1, // Allow text to shrink if needed
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: 500, // P weight
    color: "#4D4D4D",
    fontFamily: "Futura",
  },

  // Clients section
  clientsTitleContainer: {
    width: "95%",
    alignItems: "flex-start",
    marginTop: 16,
    alignSelf: "center",
    marginBottom: 4,
  },
  clientsTitle: {
    fontSize: 24, // H1 size
    fontWeight: 700, // H1 weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  ActiveText: {
    fontSize: 11, // P size
    fontWeight: 700, // P weight
    color: "#797979",
    fontFamily: "Futura",
    marginTop: 6,
    letterSpacing: "0.8",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 64, // Increased vertical padding to add more space
    //  gap: 16, // Gap between items in the scroll view
  },
  clientsScrollView: {
    flex: 1,
    paddingBottom: 16, // Padding at the bottom of the scroll view
    marginBottom: 64, // Space for the floating button
  },
  clientsGroupWrapper: {
    alignSelf: "center",
    width: "95%",
    minWidth: 358,
    maxWidth: 528,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 16,
    width: "100%",
    minHeight: 78,
    position: "relative",
  },
  clientCardBorder: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    width: "80%",
    height: 0.5,
    backgroundColor: "#686767ff",
  },
  lastClientCard: {
    borderBottomWidth: 0,
  },
  initialsCircle: {
    width: 49,
    height: 49,
    borderRadius: 45,
    backgroundColor: "#4D4D4D",
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
    fontWeight: "500", // Bolder
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
    bottom: 16,
    left: "5%",
    minWidth: 271,
    width: "90%",
    height: 56,
    borderRadius: 30,
    backgroundColor: "#377473", // Orange color
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingAddButtonEmptyClients: {
    position: "absolute",
    bottom: 34,
    right: "5%",
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
    fontSize: 14,
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
    padding: 16,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    borderRadius: 6,
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
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
    margin: 16,
    marginBottom: 48,
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
    paddingTop: 16,
    padding: 8,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 100,
  },
  clientCardDetails: {
    alignItems: "center",
    marginBottom: 16,
  },
  clientCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  clientCardInfo: {
    flex: 1,
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
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    width: "90%",
  },
  viewDetailsButtonText: {
    color: COLORS.green,
    fontSize: 12, // H3 size
    fontWeight: "700", // H3 weight
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
    marginTop: 8,
    borderRadius: 16,
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
    color: "#797979",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Futura",
    color: "#797979",
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
  /* Fully Approved Modal Styles */
  fullyApprovedModalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 24,
    width: "90%",
    maxWidth: 520,
    alignItems: "center",
  },
  fullyApprovedHeaderInitialsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  fullyApprovedClientName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  fullyApprovedDivider: {
    marginTop: 12,
    height: 48,
    width: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fullyApprovedDividerTextButton: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  fullyApprovedDividerTextButton: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "700",
    fontFamily: "Futura",
  },
  fullyApprovedDividerText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "Futura",
  },
  fullyApprovedSubtitle: {
    marginTop: 24,
    fontSize: 14,
    textAlign: "center",
    color: COLORS.slate,
    fontWeight: "500",
    fontFamily: "Futura",
  },
  fullyApprovedDocItem: {
    fontSize: 18,
    color: COLORS.black,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
    fontFamily: "Futura",
  },
  fullyApprovedFooterInfo: {
    marginTop: 32,
    fontSize: 12,
    color: COLORS.slate,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "Futura",
  },
  fullyApprovedEmail: {
    marginTop: 8,
    fontSize: 18,
    color: COLORS.black,
    textAlign: "center",
    fontWeight: "700",
    fontFamily: "Futura",
  },
  fullyApprovedPrimaryButton: {
    marginTop: 32,
    backgroundColor: COLORS.orange,
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  fullyApprovedPrimaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  inviteOptionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 23,
    alignItems: "center",
    minWidth: 120,
    width: "90%",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  inviteOptionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    fontFamily: "Futura",
    textAlign: "center",
  },
  inviteSkipButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 12,
    paddingHorizontal: 13,
    alignItems: "center",
    width: "90%",
  },
  inviteSkipButtonText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  headerExtendedBackground: {
    position: "absolute",
    top: 126, // Position it to align with the header above
    left: 0, // Compensate for ScrollView paddingHorizontal
    right: 0, // Compensate for ScrollView paddingHorizontal
    height: 55, // Extends to cover header (126px) + half of statusContainer padding/content
    backgroundColor: COLORS.black,
    zIndex: 0,
  },
});

export default RealtorHome;
