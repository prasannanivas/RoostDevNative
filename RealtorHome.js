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
        <TouchableOpacity style={styles.inviteRealtorsButton}>
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
            colors={["#019B8E"]} // Android
            tintColor="#019B8E" // iOS
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
                      <ActivityIndicator color="#fff" />
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
                  <Text style={{ fontWeight: "bold" }}>files@roostapp.io</Text>{" "}
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
    backgroundColor: "#F3F3F3",
    position: "relative", // To position absolute elements
  },
  /* ================= TOP HEADER STYLES ================= */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#232427",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  agencyName: {
    fontSize: 14,
    color: "#B0B0B0",
  },
  menuIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#2D4D4D",
    justifyContent: "center",
    alignItems: "center",
  },

  // Invite Banner
  inviteBanner: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  inviteRealtorsButton: {
    backgroundColor: "#40797B",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginRight: 15,
  },
  inviteRealtorsText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 16,
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#40797B",
    lineHeight: 20,
  },

  // Clients section
  clientsTitleContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  clientsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#232427",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  clientsScrollView: {
    flex: 1,
  },

  // Client cards
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7D7D7D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#232427",
    marginBottom: 8,
  },
  clientStatus: {
    fontSize: 14,
    color: "#232427",
    fontWeight: "500",
    backgroundColor: "#F2E4D4",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: "flex-start",
  },

  // Bottom button
  bottomButtonContainer: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  fixedBottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#F3F3F3", // Match background color
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addClientsButton: {
    flexDirection: "row",
    backgroundColor: "#E49455",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addClientsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },

  // Keep all existing styles below this point
  contactInviteContainer: {
    backgroundColor: "#F3F3F3", // Light gray background
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
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
    borderRadius: 15,
    width: "90%",
    maxHeight: "90%", // Increase height slightly
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden", // Add this to prevent overflow
    position: "relative", // Add this for absolute positioning of close button
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#23231A",
  },
  formSubtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: "#23231A",
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    marginBottom: 25,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  toggleOptionActive: {
    backgroundColor: "#23231A",
  },
  toggleText: {
    color: "#23231A",
    fontWeight: "600",
    fontSize: 16,
  },
  toggleTextActive: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  formActions: {
    flexDirection: "column",
    gap: 10,
  },
  sendInviteButton: {
    backgroundColor: "#40797B",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 20,
  },
  loadingButton: {
    opacity: 0.7,
  },
  sendInviteButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
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
  contactPickerButton: {
    backgroundColor: "#019B8E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  contactPickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  selectedContactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedContactName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  clearContactButton: {
    padding: 5,
  },
  dividerContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  orText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginBottom: 20,
  },
  contactsButton: {
    backgroundColor: "#40797B",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: "center",
    width: "80%",
  },
  contactsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadFileButton: {
    backgroundColor: "#E49455",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 20,
  },
  uploadFileText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  orDivider: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginVertical: 15,
  },
  alternativeText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginTop: 10,
  },
  closeFormButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  contactOptions: {
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  contactOptionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: "#23231A",
  },
  contactIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  contactIconBtn: {
    alignItems: "center",
    marginHorizontal: 15,
    paddingVertical: 10,
  },
  contactIconText: {
    marginTop: 5,
    fontSize: 12,
    color: "#23231A",
  },
  doneButton: {
    backgroundColor: "#40797B",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    width: "80%",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactInviteContainer: {
    backgroundColor: "#F3F3F3", // Light gray background matching the image
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
});

export default RealtorHome;
