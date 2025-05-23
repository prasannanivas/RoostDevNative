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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="gift-outline" size={24} color="#FFF" />
          <Text style={styles.headerTxt}>REWARDS</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFF" />
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
        <Text style={styles.rewardsTitle}>Rewards</Text>

        {/* Client Rewards */}
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
                      <Text style={{ color: "#FFF", fontWeight: "600" }}>
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
                      <Text style={{ color: "#FFF", fontWeight: "600" }}>
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
                    <ActivityIndicator color="#FFF" />
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
        </Text>
        <Ionicons
          name={isHistoryCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color="#23231A"
        />
      </TouchableOpacity>
      {!isHistoryCollapsed && (
        <View style={styles.collapsibleContent}>
          {realtor?.pointsHistory?.map((e, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyPts}>
                <FontAwesome name="star" size={14} color="#F9A602" />
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
        </Text>
        <Ionicons
          name={isRealtorsCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color="#23231A"
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
            <TouchableOpacity
              style={styles.claimClose}
              onPress={() => {
                setClaimModal(false);
                setSelectedReward(null);
              }}
            >
              <Ionicons name="close-outline" size={24} color="#333" />
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
                    <ActivityIndicator color="#FFF" />
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
            <TouchableOpacity
              style={styles.claimClose}
              onPress={() => setAddressConfirmation(false)}
            >
              <Ionicons name="close-outline" size={24} color="#333" />
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
                  <ActivityIndicator color="#FFF" size="small" />
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
    backgroundColor: "#fff",
    flex: 1,
  },

  /* Header */
  header: {
    backgroundColor: "#23231A",
    padding: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    padding: 5,
  },

  /* Points display */
  pointsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  pointsNum: {
    fontSize: 48,
    fontWeight: "700",
    color: "#45665B",
    marginRight: 10,
  },
  pointsLbl: {
    fontSize: 36,
    color: "#333",
    fontWeight: "400",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  /* Referral program section */
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#23231A",
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  rewardPoints: {
    fontSize: 18,
    fontWeight: "600",
    color: "#45665B",
  },
  rewardText: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },

  /* Bonus section */
  bonusContainer: {
    backgroundColor: "#E5EFF0",
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#23231A",
  },
  bonusText: {
    fontSize: 14,
    color: "#45665B",
    marginBottom: 10,
    lineHeight: 20,
  },
  bonusExample: {
    fontSize: 14,
    color: "#45665B",
    marginTop: 10,
    fontStyle: "italic",
  },

  /* Invite button */
  inviteBtn: {
    backgroundColor: "#45665B",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 15,
  },
  inviteBtnTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  /* Rewards section */
  rewardsTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#23231A",
    paddingHorizontal: 20,
  },
  rewardsSubTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 15,
    color: "#666",
    paddingHorizontal: 20,
  },
  rewardsDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  /* Rewards grid with new card design */
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  rewardCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
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
    padding: 12,
  },
  rewardType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  rewardName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#23231A",
  },

  /* Progress bar styling to match screenshot */
  progressBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E49455",
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E49455",
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
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  feedbackMsg: {
    textAlign: "center",
    marginVertical: 8,
  },
  success: { color: "#155724" },
  error: { color: "#721c24" },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: "#23231A",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#019B8E",
    padding: 8,
    alignItems: "center",
  },
  // Add these styles to the StyleSheet

  /* Collapsible sections */
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
  },
  collapsibleContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 15,
  },
  toggleActive: {
    backgroundColor: "#019B8E",
  },
  toggleTxt: { color: "#019B8E" },
  toggleTxtActive: { color: "#fff", fontWeight: "600" },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    backgroundColor: "#019B8E",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  modalBtnTxt: { color: "#fff", fontWeight: "600" },
  modalBtnDisabled: { opacity: 0.6 },

  /* Contact options */
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
  closeModalBtn: {
    backgroundColor: "#019B8E",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 6,
    alignItems: "center",
  },
  closeModalBtnTxt: {
    color: "#fff",
    fontWeight: "600",
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
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#23231A",
  },
  historyDetails: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    color: "#23231A",
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
  },

  /* Invited Realtors */
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsTxt: { color: "#fff", fontWeight: "600" },
  clientName: { fontSize: 14, fontWeight: "600", color: "#23231A" },
  clientStatus: { fontSize: 12, color: "#666" },

  /* Claim Modal */
  claimModal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  claimClose: {
    alignSelf: "flex-end",
  },
  claimTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  claimImage: {
    width: "100%",
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  claimAmt: { fontSize: 16, marginBottom: 8, color: "#23231A" },
  claimDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  claimPtsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    marginBottom: 12,
  },
  claimBtn: {
    backgroundColor: "#019B8E",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  claimBtnDisabled: {
    backgroundColor: "#aaa",
  },
  claimBtnTxt: {
    color: "#fff",
    fontWeight: "600",
  },

  /* Swipe Handle */
  swipeHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  closeButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },

  /* Address confirmation modal */
  addressModal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    maxHeight: "80%",
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#23231A",
  },
  addressModalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    color: "#666",
  },
  addressButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#019B8E",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginLeft: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
