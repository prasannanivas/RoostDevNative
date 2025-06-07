// RealtorRewards.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

// Design System Colors
const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#23231A",
  gray: "#666666",
  lightGray: "#CCCCCC",
  silver: "#F6F6F6",
  white: "#FFFFFF",
  background: "#F6F6F6",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
  transparent: "transparent",
};

/**
 * Props:
 *  realtor: { _id, points, pointsHistory: [{points,reason,date}], ... }
 *  invitedRealtors: array of { _id, referenceName, status, documents }
 *  invitedClients: array of { _id, referenceName, status, clientAddress, ... }
 *  getInitials: fn(name) => initials
 *  onClose: fn() => void
 */
export default function RealtorRewards({
  realtor,
  invitedRealtors,
  invitedClients,
  getInitials,
  onClose,
}) {
  console.log("invitedClients", invitedClients);
  console.log("invitedRealtors", invitedRealtors);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState({ msg: "", type: "" });
  const [showContactOptions, setShowContactOptions] = useState(false);
  // Add these state variables in the component

  // Add these lines after other useState declarations
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);
  const [isRealtorsCollapsed, setIsRealtorsCollapsed] = useState(true);

  // Then replace the Points History and Invited Realtors sections with the following code
  const [inviteData, setInviteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [rewards, setRewards] = useState([]);
  const [fetchingRewards, setFetchingRewards] = useState(true);

  const [claimModal, setClaimModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [addressConfirmation, setAddressConfirmation] = useState(false);
  const [addressToSend, setAddressToSend] = useState({
    address: "",
    city: "",
    postalCode: "",
  });

  console.log("selectedClient", selectedClient);

  const POINTS_TO_DOLLARS = 3.14;
  const currentPoints = realtor?.points || 0;

  // Add new animation state
  const panY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(translateY, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(translateY, {
    toValue: Dimensions.get("window").height,
    duration: 200,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        if (gesture.dy > 0) {
          // Only allow downward swipe
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dy > 50) {
          // If dragged down more than 50px
          closeAnim.start(() => {
            if (onClose) onClose();
          });
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  // Fetch rewards on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("http://44.202.249.124:5000/admin/rewards");
        console.log("Rewards response", resp);
        const data = await resp.json();
        setRewards(data);
      } catch (e) {
        console.error(e);
      }
      setFetchingRewards(false);
    })();
  }, []);

  const getRewardProgress = (rewardAmount) => {
    const pointsNeeded = Math.ceil(rewardAmount / POINTS_TO_DOLLARS);
    const progress = Math.min((currentPoints / pointsNeeded) * 100, 100);
    return {
      progress,
      pointsNeeded,
      isEligible: currentPoints >= pointsNeeded,
    };
  }; // Invite realtor
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
        `http://44.202.249.124:5000/realtor/${realtor._id}/invite-realtor`,
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
  // Handle opening specific apps when user taps an icon
  const openWhatsApp = () => {
    const whatsappMessage = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients`;
    const phone = inviteData.phone.replace(/[^0-9]/g, "");
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
    const smsMessage = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients`;
    const smsUrl = `sms:${inviteData.phone}?body=${encodeURIComponent(
      smsMessage
    )}`;

    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(smsUrl);
        }
      })
      .catch((err) => console.error("Error opening SMS:", err));
  };

  const openEmail = () => {
    const emailSubject = "Join Roost";
    const emailBody = `Hey ${inviteData.firstName}, I'm sharing a link to get started with Roost. Its a mortgage app that rewards Realtors that share it with their clients`;
    const mailtoUrl = `mailto:${inviteData.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        }
      })
      .catch((err) => console.error("Error opening email:", err));
  };

  // Get selected client data when client is selected
  useEffect(() => {
    if (selectedClient) {
      const client = invitedClients.find((c) => c._id === selectedClient);
      if (client) {
        setSelectedClientData(client);
        if (client.clientAddress) {
          setAddressToSend({
            address: client.clientAddress.address || "",
            city: client.clientAddress.city || "",
            postalCode: client.clientAddress.postalCode || "",
          });
        }
      }
    } else {
      setSelectedClientData(null);
      setAddressToSend({
        address: "",
        city: "",
        postalCode: "",
      });
    }
  }, [selectedClient, invitedClients]);

  // Populate address when realtor is selected for reward
  useEffect(() => {
    if (selectedReward && selectedReward.rewardFor === "Realtors" && realtor) {
      // Use realtor's brokerage address if available
      if (realtor.brokerageInfo) {
        setAddressToSend({
          address: realtor.brokerageInfo.brokerageAddress || "",
          city: realtor.brokerageInfo.brokerageCity || "",
          postalCode: realtor.brokerageInfo.brokeragePostalCode || "",
        });
      }
    }
  }, [selectedReward, realtor]);

  // Claim reward
  const handleClaimReward = async () => {
    if (selectedReward.rewardFor === "Clients" && !selectedClient) {
      Alert.alert("Select a client first");
      return;
    }

    // Show address confirmation for both clients and realtors
    setAddressConfirmation(true);
    return;
  };

  const submitRewardClaim = async () => {
    try {
      const payload = {
        rewardId: selectedReward._id,
        realtorId: realtor._id,
        to: selectedReward.rewardFor === "Clients" ? "Client" : "Realtor",
      };

      if (selectedReward.rewardFor === "Clients") {
        payload.clientId = selectedClientData.inviteeId;
        payload.toAddress = addressToSend;
      } else {
        // For realtor rewards, also include the address
        payload.toAddress = addressToSend;
        payload.targetRealtorId = realtor._id;
      }

      const resp = await fetch(
        `http://44.202.249.124:5000/realtor/claimRewards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (resp.ok) {
        // Refresh rewards
        const fresh = await fetch(
          "http://44.202.249.124:5000/admin/rewards"
        ).then((r) => r.json());
        console.log("Claim successful", fresh);
        setRewards(fresh);
        setClaimModal(false);
        setAddressConfirmation(false);
        Alert.alert("Success", "Reward claimed successfully!");
      } else {
        const errorData = await resp.json();
        console.error("Claim failed", errorData);
        Alert.alert("Error", errorData.message || "Failed to claim reward");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const renderRewardCard = (reward) => {
    if (!reward) return null;
    const { progress, pointsNeeded, isEligible } = getRewardProgress(
      reward.rewardAmount
    );
    return (
      <TouchableOpacity
        key={reward._id}
        style={styles.rewardCard}
        onPress={() => {
          setSelectedReward(reward);
          setClaimModal(true);
          setSelectedClient("");
        }}
      >
        {reward.imageUrl ? (
          <Image
            source={{ uri: `http://44.202.249.124:5000${reward.imageUrl}` }}
            style={styles.rewardImage}
          />
        ) : (
          <View style={styles.rewardInitials}>
            <Text>{getInitials(reward.rewardName)}</Text>
          </View>
        )}
        <Text style={styles.rewardName}>{reward.rewardName}</Text>
        {reward.description ? (
          <Text numberOfLines={1} style={styles.rewardDesc}>
            {reward.description}
          </Text>
        ) : null}
        {/* <Text style={styles.rewardAmt}>${reward.rewardAmount.toFixed(2)}</Text> */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              isEligible && styles.progressEligible,
              { width: `${progress}%` },
            ]}
          />
        </View>
        <View style={styles.pointsNeededRow}>
          <Text style={styles.pointsNeeded}>
            {currentPoints}/{pointsNeeded} pts
          </Text>
          {isEligible && <Text style={styles.eligibleTag}>Eligible!</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  // Format history date
  const formatDate = (s) =>
    new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      {" "}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="gift-outline" size={24} color={COLORS.white} />
          <Text style={styles.headerTxt}>REWARDS</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <View style={styles.pointsRow}>
          <Text style={styles.pointsNum}>{currentPoints}</Text>
          <Text style={styles.pointsLbl}>points</Text>
        </View>
      </View>
      {/* Referral Program */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Referral program</Text>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardPoints}>1 PT</Text>
          <Text style={styles.rewardText}>for every client invited</Text>
        </View>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardPoints}>10 PTS</Text>
          <Text style={styles.rewardText}>
            for every fellow realtor invited
          </Text>
        </View>

        {/* Bonus Section */}
        <View style={styles.bonusContainer}>
          <Text style={styles.bonusTitle}>BONUS</Text>
          <Text style={styles.bonusText}>
            Earn an additional 5% pts from any activity from your fellow realtor
            referrals*
          </Text>
          <Text style={styles.bonusExample}>
            Example - Realtor B completes a deal they get 300pts, Realtor A
            would earn 15pts automatically.
          </Text>
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => setShowInviteForm(true)}
        >
          <Text style={styles.inviteBtnTxt}>Invite Realtors</Text>
        </TouchableOpacity>
      </View>
      {/* Rewards Section */}
      <View>
        <Text style={styles.rewardsTitle}>Rewards</Text> {/* Client Rewards */}
        <Text style={styles.rewardsSubTitle}>FOR YOUR CLIENTS</Text>
        <Text style={styles.rewardsDescription}>
          These rewards go straight to you clients as a gift, we include your
          photo, details and a thank you for using you as their realtor.
        </Text>
        {fetchingRewards ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.rewardsGrid}>
            {rewards
              .filter((r) => r?.rewardFor === "Clients" && r?.isVisible)
              .map((reward) => (
                <TouchableOpacity
                  key={reward._id}
                  style={styles.rewardCard}
                  onPress={() => {
                    setSelectedReward(reward);
                    setClaimModal(true);
                    setSelectedClient("");
                  }}
                >
                  {reward.imageUrl ? (
                    <Image
                      source={{
                        uri: `http://44.202.249.124:5000${reward.imageUrl}`,
                      }}
                      style={styles.rewardImage}
                    />
                  ) : (
                    <View style={styles.rewardInitials}>
                      <Text style={styles.initialsTxt}>
                        {getInitials(reward.rewardName)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.rewardCardContent}>
                    <Text style={styles.rewardType}>Cash</Text>
                    <Text style={styles.rewardName}>
                      ${reward.rewardAmount}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              getRewardProgress(reward.rewardAmount).progress
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {Math.floor(
                        getRewardProgress(reward.rewardAmount).progress
                      )}
                      %
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}{" "}
        {/* Realtor Rewards */}
        <Text style={styles.rewardsSubTitle}>FOR YOU</Text>
        {fetchingRewards ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.rewardsGrid}>
            {rewards
              .filter((r) => r?.rewardFor === "Realtors" && r?.isVisible)
              .map((reward) => (
                <TouchableOpacity
                  key={reward._id}
                  style={styles.rewardCard}
                  onPress={() => {
                    setSelectedReward(reward);
                    setClaimModal(true);
                    setSelectedClient("");
                  }}
                >
                  {reward.imageUrl ? (
                    <Image
                      source={{
                        uri: `http://44.202.249.124:5000${reward.imageUrl}`,
                      }}
                      style={styles.rewardImage}
                    />
                  ) : (
                    <View style={styles.rewardInitials}>
                      <Text style={styles.initialsTxt}>
                        {getInitials(reward.rewardName)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.rewardCardContent}>
                    <Text style={styles.rewardType}>Cash</Text>
                    <Text style={styles.rewardName}>
                      ${reward.rewardAmount}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              getRewardProgress(reward.rewardAmount).progress
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {Math.floor(
                        getRewardProgress(reward.rewardAmount).progress
                      )}
                      %
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>
      {/* Keep all the other functionality intact */}
      {/* Invite Form Modal */}
      <Modal visible={showInviteForm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                      {" "}
                      <TouchableOpacity
                        style={styles.contactIconBtn}
                        onPress={openWhatsApp}
                      >
                        <MaterialCommunityIcons
                          name="whatsapp"
                          size={32}
                          color={COLORS.success}
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
                          color={COLORS.info}
                        />
                        <Text style={styles.contactIconText}>SMS</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {inviteData.email && (
                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={openEmail}
                    >
                      <Entypo name="mail" size={32} color={COLORS.error} />
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
      {/* Points History */}
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
      >
        <Text style={styles.sectionTitle}>
          Points History ({realtor?.pointsHistory?.length || 0})
        </Text>{" "}
        <Ionicons
          name={isHistoryCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color={COLORS.black}
        />
      </TouchableOpacity>
      {!isHistoryCollapsed && (
        <View style={styles.collapsibleContent}>
          {realtor?.pointsHistory?.map((e, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyPts}>
                <FontAwesome name="star" size={14} color={COLORS.orange} />
                <Text style={styles.historyPtsTxt}>+{e.points}</Text>
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyReason}>{e.reason}</Text>
                <Text style={styles.historyDate}>{formatDate(e.date)}</Text>
              </View>
            </View>
          ))}
          {(!realtor?.pointsHistory || realtor.pointsHistory.length === 0) && (
            <Text style={styles.noDataText}>No points history available</Text>
          )}
        </View>
      )}
      {/* Invited Realtors */}
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setIsRealtorsCollapsed(!isRealtorsCollapsed)}
      >
        <Text style={styles.sectionTitle}>
          Invited Realtors ({invitedRealtors?.length || 0})
        </Text>{" "}
        <Ionicons
          name={isRealtorsCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color={COLORS.black}
        />
      </TouchableOpacity>
      {!isRealtorsCollapsed && (
        <View style={styles.collapsibleContent}>
          {invitedRealtors && invitedRealtors.length > 0 ? (
            invitedRealtors.map((c) => (
              <View key={c._id} style={styles.clientCard}>
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsTxt}>
                    {getInitials(c.referenceName)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.clientName}>{c.referenceName}</Text>
                  <Text style={styles.clientStatus}>
                    {c.status === "PENDING"
                      ? "Invited"
                      : c.status === "ACCEPTED" &&
                        (!c.documents || c.documents.length === 0)
                      ? "Signed Up"
                      : c.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No invited realtors</Text>
          )}
        </View>
      )}
      {/* Claim Reward Modal */}
      <Modal
        visible={claimModal && selectedReward !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.claimModal}>
            {" "}
            <TouchableOpacity
              style={styles.claimClose}
              onPress={() => {
                setClaimModal(false);
                setSelectedReward(null);
              }}
            >
              <Ionicons name="close-outline" size={24} color={COLORS.black} />
            </TouchableOpacity>
            {selectedReward && (
              <>
                <Text style={styles.claimTitle}>
                  {selectedReward.rewardName}
                </Text>
                {selectedReward.imageUrl && (
                  <Image
                    source={{
                      uri: `http://44.202.249.124:5000${selectedReward.imageUrl}`,
                    }}
                    style={styles.claimImage}
                  />
                )}
                {/* <Text style={styles.claimAmt}>
                  ${selectedReward.rewardAmount.toFixed(2)}
                </Text> */}
                {selectedReward.description && (
                  <Text style={styles.claimDescription}>
                    {selectedReward.description}
                  </Text>
                )}
                <View style={styles.claimPtsRow}>
                  <Text>
                    Required Points:{" "}
                    {Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS)}
                  </Text>
                  <Text>Your Points: {currentPoints}</Text>
                </View>
                {selectedReward.rewardFor === "Clients" && (
                  <>
                    <Text style={styles.label}>Select Client:</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={selectedClient}
                        onValueChange={(v) => setSelectedClient(v)}
                      >
                        <Picker.Item label="Choose a client" value="" />
                        {(invitedClients || [])
                          .filter(
                            (c) =>
                              c.status === "ACCEPTED" &&
                              c.clientAddress !== null
                          )
                          .map((c) => (
                            <Picker.Item
                              key={c._id}
                              label={c.referenceName}
                              value={c._id}
                            />
                          ))}
                      </Picker>
                    </View>
                  </>
                )}
                <TouchableOpacity
                  style={[
                    styles.claimBtn,
                    (!selectedClient &&
                      selectedReward.rewardFor === "Clients") ||
                    currentPoints <
                      Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS)
                      ? styles.claimBtnDisabled
                      : {},
                  ]}
                  disabled={
                    claimLoading ||
                    (selectedReward.rewardFor === "Clients" &&
                      !selectedClient) ||
                    currentPoints <
                      Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS)
                  }
                  onPress={handleClaimReward}
                >
                  {claimLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.claimBtnTxt}>
                      {currentPoints <
                      Math.ceil(selectedReward.rewardAmount / POINTS_TO_DOLLARS)
                        ? "Insufficient Points"
                        : "Claim Reward"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Address Confirmation Modal */}
      <Modal
        visible={
          addressConfirmation &&
          (selectedClientData !== null ||
            selectedReward?.rewardFor === "Realtors")
        }
        transparent
        animationType="fade"
        onRequestClose={() => setAddressConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressModal}>
            {" "}
            <TouchableOpacity
              style={styles.claimClose}
              onPress={() => setAddressConfirmation(false)}
            >
              <Ionicons name="close-outline" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.addressModalTitle}>
              Confirm Shipping Address
            </Text>
            <Text style={styles.addressModalSubtitle}>
              Please confirm or edit the address for{" "}
              {selectedReward?.rewardFor === "Clients"
                ? selectedClientData?.referenceName
                : realtor?.name || "yourself"}
            </Text>
            <Text style={styles.label}>Address:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.address}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, address: text }))
              }
            />
            <Text style={styles.label}>City:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.city}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, city: text }))
              }
            />
            <Text style={styles.label}>Postal Code:</Text>
            <TextInput
              style={styles.input}
              value={addressToSend.postalCode}
              onChangeText={(text) =>
                setAddressToSend((prev) => ({ ...prev, postalCode: text }))
              }
              keyboardType="numeric"
            />
            <View style={styles.addressButtonsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddressConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  claimLoading && styles.buttonDisabled,
                ]}
                onPress={async () => {
                  setClaimLoading(true);
                  try {
                    await submitRewardClaim();
                  } catch (e) {
                    console.error(e);
                  }
                  setClaimLoading(false);
                }}
                disabled={claimLoading}
              >
                {claimLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm & Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: COLORS.white,
    flex: 1,
  },

  /* Header */
  header: {
    backgroundColor: COLORS.black,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerTxt: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.white,
    textTransform: "uppercase",
    marginLeft: 8,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 8,
  },

  /* Points display */
  pointsContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: "center",
  },
  pointsNum: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
    marginRight: 8,
  },
  pointsLbl: {
    fontSize: 24,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  /* Referral program section */
  sectionContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 16,
    color: COLORS.black,
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.green,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
    textAlign: "right",
  },

  /* Bonus section */
  bonusContainer: {
    backgroundColor: COLORS.silver,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  bonusTitle: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
  bonusExample: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: "italic",
  },

  /* Invite button */
  inviteBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 16,
    height: 48,
  },
  inviteBtnTxt: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },

  /* Rewards section */
  rewardsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
    paddingHorizontal: 24,
  },
  rewardsSubTitle: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.gray,
    paddingHorizontal: 24,
  },
  rewardsDescription: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 24,
  },

  /* Rewards grid with new card design */
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  rewardCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  rewardImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  rewardCardContent: {
    padding: 16,
  },
  rewardType: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginBottom: 4,
  },
  rewardName: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
  },
  rewardInitials: {
    width: "100%",
    height: 150,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Progress bar styling to match screenshot */
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.orange,
    borderRadius: 8,
  },
  progressEligible: {
    backgroundColor: COLORS.green,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.orange,
  },
  pointsNeededRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsNeeded: {
    fontSize: 12,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
  },
  eligibleTag: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
  },

  /* Invite Form */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 16,
    textAlign: "center",
    color: COLORS.black,
  },
  feedbackMsg: {
    textAlign: "center",
    marginVertical: 8,
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
  },
  success: { color: COLORS.success },
  error: { color: COLORS.error },
  label: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    height: 48,
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.green,
    padding: 16,
    alignItems: "center",
    height: 48,
  },

  /* Collapsible sections */
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.silver,
  },
  collapsibleContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  toggleActive: {
    backgroundColor: COLORS.green,
  },
  toggleTxt: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
  },
  toggleTxtActive: {
    color: COLORS.white,
    fontWeight: "medium",
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
    height: 48,
  },
  modalBtnTxt: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },
  modalBtnDisabled: { opacity: 0.6 },

  /* Contact options */
  contactOptions: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  contactOptionsTitle: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 16,
    color: COLORS.black,
  },
  contactIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  contactIconBtn: {
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  contactIconText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  closeModalBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    height: 48,
  },
  closeModalBtnTxt: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },

  /* History */
  historyRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  historyPts: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  historyPtsTxt: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  historyDetails: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
  },

  /* Invited Realtors */
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.silver,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsTxt: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.black,
  },
  clientStatus: {
    fontSize: 12,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
  },

  /* Claim Modal */
  claimModal: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
  },
  claimClose: {
    alignSelf: "flex-end",
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 16,
    color: COLORS.black,
  },
  claimImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 16,
  },
  claimAmt: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
  },
  claimDescription: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginBottom: 16,
    lineHeight: 20,
  },
  claimPtsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 16,
    height: 48,
  },
  claimBtn: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    height: 48,
  },
  claimBtnDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  claimBtnTxt: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },

  /* Swipe Handle */
  swipeHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  closeButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  /* Address confirmation modal */
  addressModal: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
    maxHeight: "80%",
  },
  addressModalTitle: {
    fontSize: 16,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 8,
    textAlign: "center",
    color: COLORS.black,
  },
  addressModalSubtitle: {
    fontSize: 14,
    fontWeight: "medium",
    fontFamily: "Futura",
    marginBottom: 16,
    textAlign: "center",
    color: COLORS.gray,
  },
  addressButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.silver,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
    height: 48,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
    height: 48,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "medium",
    fontFamily: "Futura",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
