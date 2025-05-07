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
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
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
  const [inviteData, setInviteData] = useState({
    referenceName: "",
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

  console.log("sewlectedClient", selectedClient);

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
  };

  // Invite realtor
  const handleInviteRealtor = async () => {
    setInviteLoading(true);
    setInviteFeedback({ msg: "", type: "" });
    try {
      const payload = {
        referenceName: inviteData.referenceName,
        email: isEmail ? inviteData.email : "",
        phone: isEmail ? "" : inviteData.phone,
        type: "Realtor",
      };
      const resp = await fetch(
        `http://44.202.249.124:5000/realtor/${realtor._id}/invite-realtor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (resp.ok) {
        setInviteFeedback({ msg: "Realtor invited!", type: "success" });
        setTimeout(() => {
          setShowInviteForm(false);
          setInviteData({ referenceName: "", email: "", phone: "" });
          setInviteFeedback({ msg: "", type: "" });
        }, 2000);
      } else {
        setInviteFeedback({
          msg: "Failed – try again",
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setInviteFeedback({ msg: "Error occurred", type: "error" });
    }
    setInviteLoading(false);
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
        payload.clientId = selectedClient;
        payload.toAddress = addressToSend;
      } else {
        // For realtor rewards, also include the address
        payload.toAddress = addressToSend;
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

        // Refresh realtor data to get updated points
        const realtorResp = await fetch(
          `http://44.202.249.124:5000/realtor/${realtor._id}`
        );

        const updatedRealtorData = await realtorResp.json();

        console.log("Claim successful", fresh);
        console.log("Updated realtor data", updatedRealtorData);

        // Update state with fresh data
        setRewards(fresh);

        // Reset UI state
        setClaimModal(false);
        setAddressConfirmation(false);

        // Show success message
        Alert.alert("Success", "Reward claimed successfully!");

        // Call onRefresh if provided by parent component to update realtor data
        if (onRefresh) {
          onRefresh(updatedRealtorData);
        }
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
        <Text style={styles.rewardAmt}>${reward.rewardAmount.toFixed(2)}</Text>
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
      {/* Add swipe handle at the top */}
      <View {...panResponder.panHandlers}>
        <View style={styles.swipeHandle} />
      </View>

      {/* Move close button below handle */}
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <FontAwesome name="trophy" size={24} color="#019B8E" />
        <Text style={styles.headerTxt}>Reward Points</Text>
      </View>
      <View style={styles.pointsBadge}>
        <FontAwesome name="star" size={18} color="#FFD700" />
        <Text style={styles.pointsNum}>{currentPoints}</Text>
        <Text style={styles.pointsLbl}>Points</Text>
      </View>
      <Text style={styles.subTitle}>Let’s build great things together!</Text>
      <Text style={styles.desc}>
        Collect points and trade them in from vacations to cash
      </Text>

      {/* Invite Realtors */}
      <View style={styles.explanation}>
        <Text style={styles.exLine}>
          <Text style={styles.bold}>1 PT</Text> for every client invited
        </Text>
        <Text style={styles.exLine}>
          <Text style={styles.bold}>10 PT</Text> for every fellow realtor
          invited
        </Text>
        <Text style={[styles.exLine, styles.bonusTitle]}>BONUS</Text>
        <Text style={styles.bonusText}>
          Earn an additional 10% from your referred realtor’s activities.
        </Text>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => setShowInviteForm(true)}
        >
          <Text style={styles.inviteBtnTxt}>Invite Realtors</Text>
        </TouchableOpacity>
        <Text style={styles.exLine}>
          <Text style={styles.bold}>300 PT</Text> your client uses a preferred
          mortgage partner
        </Text>
      </View>

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
            <Text style={styles.label}>Nickname:</Text>
            <TextInput
              style={styles.input}
              value={inviteData.referenceName}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  referenceName: t,
                }))
              }
            />

            <Text style={styles.label}>Contact via:</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggle, isEmail && styles.toggleActive]}
                onPress={() => setIsEmail(true)}
              >
                <Text
                  style={[styles.toggleTxt, isEmail && styles.toggleTxtActive]}
                >
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, !isEmail && styles.toggleActive]}
                onPress={() => setIsEmail(false)}
              >
                <Text
                  style={[styles.toggleTxt, !isEmail && styles.toggleTxtActive]}
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{isEmail ? "Email:" : "Phone:"}</Text>
            <TextInput
              style={styles.input}
              keyboardType={isEmail ? "email-address" : "phone-pad"}
              value={isEmail ? inviteData.email : inviteData.phone}
              onChangeText={(t) =>
                setInviteData((prev) => ({
                  ...prev,
                  [isEmail ? "email" : "phone"]: t,
                }))
              }
            />

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
          </View>
        </View>
      </Modal>

      {/* Available Rewards */}
      <Text style={styles.sectionTitle}>Rewards for You</Text>
      {fetchingRewards ? (
        <ActivityIndicator />
      ) : rewards?.length > 0 ? (
        <View style={styles.rewardsGrid}>
          {rewards
            .filter((r) => r?.rewardFor === "Realtors" && r?.isVisible)
            .map(renderRewardCard)}
        </View>
      ) : (
        <Text>No rewards available</Text>
      )}

      <Text style={styles.sectionTitle}>Rewards for Clients</Text>
      {!fetchingRewards && (
        <View style={styles.rewardsGrid}>
          {(rewards || [])
            .filter((r) => r?.rewardFor === "Clients" && r?.isVisible)
            .map(renderRewardCard)}
        </View>
      )}

      {/* Points History */}
      <Text style={styles.sectionTitle}>Points History</Text>
      {realtor.pointsHistory.map((e, i) => (
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

      {/* Invited Realtors */}
      <Text style={styles.sectionTitle}>Invited Realtors</Text>
      {invitedRealtors.map((c) => (
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
      ))}

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
                <Text style={styles.claimAmt}>
                  ${selectedReward.rewardAmount.toFixed(2)}
                </Text>
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
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTxt: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
    color: "#23231A",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pointsNum: {
    fontSize: 24,
    fontWeight: "700",
    color: "#019B8E",
    marginHorizontal: 6,
  },
  pointsLbl: {
    fontSize: 14,
    color: "#666",
  },
  subTitle: {
    fontSize: 16,
    color: "#23231A",
  },
  desc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  explanation: {
    marginBottom: 20,
  },
  exLine: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 4,
  },
  bold: { fontWeight: "600" },
  bonusTitle: {
    color: "#F04D4D",
    marginTop: 8,
  },
  bonusText: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 8,
  },
  inviteBtn: {
    backgroundColor: "#019B8E",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 10,
  },
  inviteBtnTxt: { color: "#fff", fontWeight: "600" },

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

  /* Rewards grid */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
    color: "#23231A",
  },
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  rewardCard: {
    width: "48%",
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  rewardImage: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    marginBottom: 6,
  },
  rewardInitials: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#23231A",
  },
  rewardAmt: {
    fontSize: 14,
    marginBottom: 6,
    color: "#23231A",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#019B8E",
  },
  progressEligible: {
    backgroundColor: "#2E7D32",
  },
  pointsNeededRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pointsNeeded: { fontSize: 12, color: "#23231A" },
  eligibleTag: {
    fontSize: 12,
    color: "#2E7D32",
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
