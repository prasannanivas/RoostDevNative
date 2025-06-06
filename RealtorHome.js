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
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import * as Contacts from "expo-contacts";
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

// These are placeholders for your actual components
import RealtorProfile from "./screens/RealtorProfile.js";
import RealtorRewards from "./screens/RealtorRewards.js";
import CSVUploadForm from "./screens/AddProfilePic";

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
  const navigation = useNavigation();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [showCSVUploadForm, setShowCSVUploadForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    referenceName: "",
    phone: "",
    email: "",
  });
  const [showRewards, setShowRewards] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isMultiple, setIsMultiple] = useState(false); // New state for single/multiple toggle
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState({ msg: "", type: "" });

  const [showInviteForm, setShowInviteForm] = useState(false);

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

  const handleInviteRealtor = async () => {
    setInviteLoading(true);
    setInviteFeedback({ msg: "", type: "" });
    setShowContactOptions(false);

    // Validate that either email or phone is provided
    if (!inviteData.email && !inviteData.phone) {
      setInviteFeedback({ msg: "Phone or Email required", type: "error" });
      setInviteLoading(false);
      return;
    }

    try {
      // Build the message text
      const inviteMessage = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients`;

      // Construct the API payload - keep the format the same by combining first and last name
      const payload = {
        referenceName: `${inviteData.firstName} ${inviteData.lastName}`.trim(),
        email: inviteData.email,
        phone: inviteData.phone,
        type: "Realtor",
      };

      // Send the invite via the API - keep loading indicator showing
      const resp = await fetch(
        `http://44.202.249.124:5000/realtor/${realtor.id}/invite-realtor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      // Handle the response and set feedback
      if (resp.ok) {
        setInviteFeedback({ msg: "Realtor invited!", type: "success" });

        // Instead of automatically opening apps, show contact option icons
        setShowContactOptions(true);

        // Don't automatically close the form so the user can use the contact options
        // The user can manually close the form when they're done
      } else {
        setInviteFeedback({
          msg: "Failed – try again",
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setInviteFeedback({ msg: "Error occurred", type: "error" });
    } finally {
      // Always ensure the loading indicator is removed when complete
      setInviteLoading(false);
    }
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
        `http://44.202.249.124:5000/realtor/${realtor.id}/invite-client`,
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

        // Show contact options instead of closing modal
        setShowContactOptions(true);

        // Refresh the realtor data to show the new client
        realtorFromContext?.fetchLatestRealtor();

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

  const getInitials = (name) => {
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

  // Update the onRefresh function to also fetch realtor data
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      auth.refetch?.(),
      realtorFromContext?.fetchLatestRealtor?.(),
    ]).finally(() => {
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

  const openWhatsApp = () => {
    // Get realtor invite code if available
    const inviteCode = realtorFromContext?.realtorInfo?.inviteCode || "";
    const signupLink = `http://44.202.249.124:5000/signup.html?realtorCode=${inviteCode}`;

    const whatsappMessage = `Hey ${formData.firstName}, I'm sharing a link to view and share listings with me on Roost. Click here to get started: ${signupLink}`;
    const phone = formData.phone.replace(/[^0-9]/g, "");
    let whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(
      whatsappMessage
    )}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            "WhatsApp not installed",
            "Please install WhatsApp to use this feature",
            [{ text: "OK" }]
          );
        }
      })
      .catch((err) => console.error("Error opening WhatsApp:", err));
  };

  const openSMS = () => {
    // Get realtor invite code if available
    const inviteCode = realtorFromContext?.realtorInfo?.inviteCode || "";
    const signupLink = `http://44.202.249.124:5000/signup.html?realtorCode=${inviteCode}`;

    const smsMessage = `Hey ${formData.firstName}, I'm sharing a link to view and share listings with me on Roost. Click here to get started: ${signupLink}`;
    const smsUrl = `sms:${formData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.openURL(smsUrl).catch((err) =>
      console.error("Error opening SMS:", err)
    );
  };

  const openEmail = () => {
    // Get realtor invite code if available
    const inviteCode = realtorFromContext?.realtorInfo?.inviteCode || "";
    const signupLink = `http://44.202.249.124:5000/signup.html?realtorCode=${inviteCode}`;

    const emailSubject = "Join Roost";
    const emailBody = `Hey ${formData.firstName},

I'm sharing a link to view and share listings with me on Roost.

Click here to get started: ${signupLink}

Looking forward to working with you!`;

    const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Error opening email:", err)
    );
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
                    uri: `http://44.202.249.124:5000/realtor/profilepic/${realtor.id}`,
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

      {/* ================= INVITE REALTORS BANNER ================= */}
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
        <Text style={{ color: "#666666", marginTop: 5, fontSize: 16 }}>
          ACTIVE
        </Text>
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
        {/* List of Clients */}
        {invited.map((client) => {
          const docCount = client.documents
            ? getDocumentCounts(client.documents)
            : null;
          const statusText =
            client.status === "PENDING"
              ? "Invited"
              : client.clientAddress === null
              ? "Account Deleted"
              : client.status === "ACCEPTED" &&
                (!client.documents ||
                  client.documents.length === 0 ||
                  client?.clientAddress !== null)
              ? "Signed Up"
              : client.status === "ACCEPTED" && client.documents.length > 0
              ? `${docCount.approved}/${client.documents.length} Completed`
              : client.clientAddress === null
              ? "Account Deleted"
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

        {/* Add spacing at the bottom to prevent content from being hidden behind the button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ================= FIXED BOTTOM BUTTON: ADD CLIENTS ================= */}
      <View style={styles.fixedBottomButtonContainer}>
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
            <ScrollView style={styles.modalContent}>
              <RealtorRewards
                realtor={realtorFromContext.realtorInfo || {}}
                invitedRealtors={realtorFromContext.invitedRealtors || []}
                invitedClients={realtorFromContext.invitedClients || []}
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
      <Modal visible={showInviteForm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentForRealtorInvite}>
            <Text style={styles.modalTitle}>Invite New Realtor</Text>
            {inviteFeedback.msg ? (
              <Text
                style={[
                  styles.feedbackMsg,
                  inviteFeedback.type === "success"
                    ? styles.success
                    : styles.error,
                ]}
              >
                {inviteFeedback.msg}
              </Text>
            ) : null}
            <Text style={styles.label}>First Name:</Text>
            <TextInput
              style={styles.input}
              value={inviteData.firstName}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  firstName: t,
                }))
              }
            />
            <Text style={styles.label}>Last Name:</Text>
            <TextInput
              style={styles.input}
              value={inviteData.lastName}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  lastName: t,
                }))
              }
            />
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              value={inviteData.email}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  email: t,
                }))
              }
            />
            <Text style={styles.label}>Phone:</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={inviteData.phone}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  phone: t,
                }))
              }
            />
            {showContactOptions && inviteFeedback.type === "success" ? (
              <View style={styles.contactOptions}>
                <Text style={styles.contactOptionsTitle}>Contact via:</Text>
                <View style={styles.contactIcons}>
                  {inviteData.phone && (
                    <>
                      <TouchableOpacity
                        style={styles.contactIconBtn}
                        onPress={openWhatsApp}
                      >
                        <MaterialCommunityIcons
                          name="whatsapp"
                          size={32}
                          color="#25D366"
                        />
                        <Text style={styles.contactIconText}>WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactIconBtn}
                        onPress={openSMS}
                      >
                        <MaterialIcons name="sms" size={32} color="#2196F3" />
                        <Text style={styles.contactIconText}>SMS</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {inviteData.email && (
                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={openEmail}
                    >
                      <Entypo name="mail" size={32} color="#F44336" />
                      <Text style={styles.contactIconText}>Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => {
                    setShowInviteForm(false);
                    setShowContactOptions(false);
                    setInviteData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                    });
                    setInviteFeedback({ msg: "", type: "" });
                  }}
                >
                  <Text style={styles.closeModalBtnTxt}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    inviteLoading && styles.modalBtnDisabled,
                  ]}
                  disabled={inviteLoading}
                  onPress={handleInviteRealtor}
                >
                  {inviteLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalBtnTxt}>Send Invite</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setShowInviteForm(false)}
                  disabled={inviteLoading}
                >
                  <Text style={styles.modalBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
            {/* Add close button here */}
            <TouchableOpacity
              style={styles.closeFormButton}
              onPress={() => setShowForm(false)}
            >
              <Ionicons name="close" size={24} color="#23231A" />
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
              <>
                <TextInput
                  style={styles.inputField}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstName: text })
                  }
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastName: text })
                  }
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Email"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                />

                {/* Replace the send invite button with this conditional rendering */}
                {!showContactOptions ? (
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
                ) : (
                  /* Contact options when showContactOptions is true */
                  <View style={styles.contactOptions}>
                    <Text style={styles.contactOptionsTitle}>Contact via:</Text>
                    <View style={styles.contactIcons}>
                      {formData.phone && (
                        <>
                          <TouchableOpacity
                            style={styles.contactIconBtn}
                            onPress={openWhatsApp}
                          >
                            <MaterialCommunityIcons
                              name="whatsapp"
                              size={32}
                              color="#25D366"
                            />
                            <Text style={styles.contactIconText}>WhatsApp</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.contactIconBtn}
                            onPress={openSMS}
                          >
                            <MaterialIcons
                              name="sms"
                              size={32}
                              color="#2196F3"
                            />
                            <Text style={styles.contactIconText}>SMS</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {formData.email && (
                        <TouchableOpacity
                          style={styles.contactIconBtn}
                          onPress={openEmail}
                        >
                          <Entypo name="mail" size={32} color="#F44336" />
                          <Text style={styles.contactIconText}>Email</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => {
                        setShowForm(false);
                        setShowContactOptions(false);
                        setFormData({
                          firstName: "",
                          lastName: "",
                          referenceName: "",
                          phone: "",
                          email: "",
                        });
                        setFeedback({ message: "", type: "" });
                      }}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

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
            ) : (
              /* Multiple Clients Form */
              <>
                <TouchableOpacity
                  style={styles.uploadFileButton}
                  onPress={() => {
                    /* Handle file upload */
                  }}
                >
                  <Text style={styles.uploadFileText}>Upload File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sendInviteButton}
                  onPress={() => {
                    /* Handle sending multiple invites */
                  }}
                >
                  <Text style={styles.sendInviteButtonText}>Send Invites</Text>
                </TouchableOpacity>

                <Text style={styles.orDivider}>OR</Text>

                <Text style={styles.alternativeText}>
                  You can always email a file (Excel or .CSV) to us at{" "}
                  <Text style={{ fontWeight: "bold" }}>files@roostapp.io</Text>
                  and we can take care of it for you
                </Text>
              </>
            )}
          </View>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: COLORS.black,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
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
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },

  // Invite Banner
  inviteBanner: {
    backgroundColor: COLORS.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  inviteRealtorsButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 16,
  },
  inviteRealtorsText: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    fontSize: 14, // P size
    fontFamily: "Futura",
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
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
    fontWeight: "bold", // H1 weight
    color: COLORS.black,
    fontFamily: "Futura",
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  clientsScrollView: {
    flex: 1,
  },

  // Client cards
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    fontFamily: "Futura",
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
    color: COLORS.black,
    marginBottom: 8,
    fontFamily: "Futura",
  },
  clientStatus: {
    fontSize: 12, // H4 size
    color: COLORS.black,
    fontWeight: "bold", // H4 weight
    backgroundColor: COLORS.coloredBackgroundFill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    fontFamily: "Futura",
  },

  // Bottom button
  bottomButtonContainer: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 48,
  },
  fixedBottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 24,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  addClientsButton: {
    flexDirection: "row",
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addClientsButtonText: {
    color: COLORS.white,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginLeft: 8,
    fontFamily: "Futura",
  },
  // Keep all existing styles below this point
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
    overflow: "hidden",
    position: "relative",
  },
  formTitle: {
    fontSize: 24, // H1 size
    fontWeight: "bold", // H1 weight
    marginBottom: 24,
    textAlign: "center",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  formSubtitle: {
    textAlign: "center",
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    color: COLORS.slate,
    marginBottom: 32,
    paddingHorizontal: 24,
    fontFamily: "Futura",
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 16,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    marginBottom: 16,
    height: 48,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    overflow: "hidden",
    marginBottom: 32,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.black,
  },
  toggleText: {
    color: COLORS.black,
    fontWeight: "500", // P weight
    fontSize: 14, // P size
    fontFamily: "Futura",
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: "500", // P weight
    fontSize: 14, // P size
    fontFamily: "Futura",
  },
  formActions: {
    flexDirection: "column",
    gap: 16,
  },
  sendInviteButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  loadingButton: {
    opacity: 0.7,
  },
  sendInviteButtonText: {
    color: COLORS.white,
    fontSize: 16, // H3 size
    fontWeight: "500", // H3 weight
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
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
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
  leftSlideModal: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    backgroundColor: COLORS.white,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
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
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "80%",
  },
  contactsButtonText: {
    color: COLORS.white,
    fontSize: 14, // P size
    fontWeight: "500", // P weight
    fontFamily: "Futura",
  },
  uploadFileButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 24,
  },
  uploadFileText: {
    color: COLORS.white,
    fontSize: 14, // P size
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
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
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
  contactIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
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
});

export default RealtorHome;
