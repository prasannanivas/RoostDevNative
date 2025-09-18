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
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { OrangeProgressBar } from "../components/progressBars";
import InviteRealtorModal from "../components/modals/InviteRealtorModal";
import ClaimRewardsModal from "../components/modals/ClaimRewardsModal";
import CashoutModal from "../components/modals/CashoutModal";
import CashoutMinimumModal from "../components/modals/CashoutMinimumModal";
import RewardClaimedModal from "../components/modals/RewardClaimedModal";
import { useRealtor } from "../context/RealtorContext";

// Design System Colors
const COLORS = {
  green: "#377473",
  orange: "#E49455",
  black: "#1D2327",
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
  useFixedHeader = false,
}) {
  // console.log("invitedClients", invitedClients);
  // console.log("invitedRealtors", invitedRealtors);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);

  // Add these state variables in the component

  // Add these lines after other useState declarations
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);
  const [isRealtorsCollapsed, setIsRealtorsCollapsed] = useState(true);

  const [rewards, setRewards] = useState([]);
  const [fetchingRewards, setFetchingRewards] = useState(true);

  const [claimModal, setClaimModal] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [showCashoutMinimumModal, setShowCashoutMinimumModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [addressConfirmation, setAddressConfirmation] = useState(false);
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addressToSend, setAddressToSend] = useState({
    address: "",
    city: "",
    postalCode: "",
  });

  const { fetchLatestRealtor } = useRealtor();

  console.log("selectedClient", selectedClient);

  const POINTS_TO_DOLLARS = 1;
  const MIN_CASHOUT_DOLLAR = 250;
  const currentPoints = parseInt(realtor?.points || 0, 10);
  const MAXIMUM_CLIENTS_INVITE_LIMIT = 20;
  const MAXIMUM_REALTORS_INVITE_LIMIT = 10;

  const fetchRewards = async () => {
    setFetchingRewards(true);
    try {
      const resp = await fetch("https://signup.roostapp.io/admin/rewards");
      console.log("Rewards response", resp);
      const data = await resp.json();
      setRewards(data);
      fetchLatestRealtor();
    } catch (e) {
      console.error(e);
    }
    setFetchingRewards(false);
  };

  // Fetch rewards on mount
  useEffect(() => {
    fetchRewards();
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
  // Handle opening specific apps when user taps an icon

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

      setAddressToSend({
        name: realtor.name || "",
        address: realtor?.rewardsAddress || "",
        city: realtor?.rewardsCity || "",
        postalCode: realtor?.rewardsPostalCode || "",
      });
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
    console.log("Submitting reward claim", {
      rewardId: selectedReward._id,
      realtorId: realtor._id,
      to: selectedReward.rewardFor === "Clients" ? "Client" : "Realtor",
      clientId: selectedClientData?.inviteeId,
      toAddress: addressToSend,
    });
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
        `https://signup.roostapp.io/realtor/claimRewards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (resp.ok) {
        // Refresh rewards
        const fresh = await fetch(
          "https://signup.roostapp.io/admin/rewards"
        ).then((r) => r.json());
        console.log("Claim successful", fresh);
        setRewards(fresh);
        fetchLatestRealtor();
        setClaimModal(false);
        setAddressConfirmation(false);
        setShowSuccessModal(true); // Show success modal instead of alert
      } else {
        const errorData = await resp.json();
        console.error("Claim failed", errorData);
        Alert.alert("Error", errorData.message || "Failed to claim reward");
      }
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      await fetchRewards();
    }
  };

  // Format history date
  const formatDate = (s) =>
    new Date(s).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  return (
    <View style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeaderSection}>
        {/* Header with REWARDS text */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Svg
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M12.5 5.5V8M12.5 5.5C12.5 4.11929 13.6193 3 15 3C16.3807 3 17.5 4.11929 17.5 5.5C17.5 6.88071 16.3807 8 15 8M12.5 5.5C12.5 4.11929 11.3807 3 10 3C8.61929 3 7.5 4.11929 7.5 5.5C7.5 6.88071 8.61929 8 10 8M12.5 8H15M12.5 8H10M12.5 8V14M15 8H18.3002C19.4203 8 19.9796 8 20.4074 8.21799C20.7837 8.40973 21.0905 8.71547 21.2822 9.0918C21.5 9.5192 21.5 10.079 21.5 11.1969V14M10 8H6.7002C5.58009 8 5.01962 8 4.5918 8.21799C4.21547 8.40973 3.90973 8.71547 3.71799 9.0918C3.5 9.51962 3.5 10.0801 3.5 11.2002V14M3.5 14V16.8002C3.5 17.9203 3.5 18.4801 3.71799 18.9079C3.90973 19.2842 4.21547 19.5905 4.5918 19.7822C5.0192 20 5.57899 20 6.69691 20H12.5M3.5 14H12.5M12.5 14V20M12.5 14H21.5M12.5 20H18.3031C19.421 20 19.98 20 20.4074 19.7822C20.7837 19.5905 21.0905 19.2842 21.2822 18.9079C21.5 18.4805 21.5 17.9215 21.5 16.8036V14"
                stroke="#FDFDFD"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </Svg>
            <Text style={styles.headerTxt}>REWARDS</Text>
          </View>
        </View>

        {/* Fixed Points Display */}
        <View style={styles.pointsContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Svg width="37" height="37" viewBox="0 0 37 37" fill="none">
              <Circle cx="18.5" cy="18.5" r="18.5" fill="#F6F6F6" />
              <Path
                d="M18.5 6C11.5969 6 6 11.5963 6 18.5C6 25.4037 11.5963 31 18.5 31C25.4037 31 31 25.4037 31 18.5C31 11.5963 25.4037 6 18.5 6ZM18.5 29.4625C12.4688 29.4625 7.5625 24.5312 7.5625 18.5C7.5625 12.4688 12.4688 7.5625 18.5 7.5625C24.5312 7.5625 29.4375 12.4688 29.4375 18.5C29.4375 24.5312 24.5312 29.4625 18.5 29.4625ZM22.9194 14.0812C22.6147 13.7766 22.12 13.7766 21.8147 14.0812L18.5006 17.3953L15.1866 14.0812C14.8819 13.7766 14.3866 13.7766 14.0812 14.0812C13.7759 14.3859 13.7766 14.8813 14.0812 15.1859L17.3953 18.5L14.0812 21.8141C13.7766 22.1187 13.7766 22.6141 14.0812 22.9188C14.3859 23.2234 14.8812 23.2234 15.1866 22.9188L18.5006 19.6047L21.8147 22.9188C22.1194 23.2234 22.6141 23.2234 22.9194 22.9188C23.2247 22.6141 23.2241 22.1187 22.9194 21.8141L19.6053 18.5L22.9194 15.1859C23.225 14.8806 23.225 14.3859 22.9194 14.0812Z"
                fill="#A9A9A9"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsNum}>{currentPoints}</Text>
            <Text style={[styles.pointsLbl, { top: "-3", left: -2 }]}>
              points
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content Section */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View>
          <Text style={styles.sectionTitle}>Referral program</Text>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardPoints}>
              1 <Text style={styles.rewardPointsText}>PT</Text>
            </Text>

            <Text style={styles.rewardText}>for every client invited</Text>
          </View>

          <View style={styles.rewardItem}>
            <Text style={styles.rewardPoints}>
              5 <Text style={styles.rewardPointsText}>PTS</Text>
            </Text>

            <Text style={styles.rewardText}>
              for every fellow realtor invited
            </Text>
          </View>

          {/* Bonus Section */}
          <View style={styles.bonusContainer}>
            <Text style={styles.bonusTitle}>BONUS</Text>
            <Text style={styles.bonusText}>
              Earn an additional 5% from any from realtor that you refer, once
              one of their clients completes a mortgage.
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
        {(realtor.acceptedClients?.length || 0) >=
          MAXIMUM_CLIENTS_INVITE_LIMIT &&
        (realtor.acceptedRealtors?.length || 0) >=
          MAXIMUM_REALTORS_INVITE_LIMIT ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.limitHit}>
              Amazing job referring client and realtors, you have reached the
              maximum points. However you will still receive the 5% bonus from
              any Realtor you refer
            </Text>
          </View>
        ) : (
          <></>
        )}
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsTitle}>Rewards</Text>
          {/* Client Rewards */}
          <Text style={styles.rewardsSubTitle}>FOR YOUR CLIENTS</Text>
          <Text style={styles.rewardsDescription}>
            These rewards are sent directly to your clients as a gift. We
            include your photo, contact details, and a thank-you message for
            choosing you as their realtor.
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
                          uri: `https://signup.roostapp.io${reward.imageUrl}`,
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
                      <Text style={styles.rewardType}>{reward.rewardName}</Text>
                      <Text style={styles.rewardName}>
                        {reward.rewardAmount}
                      </Text>
                      <OrangeProgressBar
                        progress={
                          getRewardProgress(reward.rewardAmount).progress
                        }
                        style={{ marginBottom: 4 }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
          {/* Realtor Rewards */}
          <Text style={styles.rewardsSubTitle}>FOR YOU</Text>
          <Text style={styles.rewardsDescription}>
            Rewards will be mailed to the address listed in your profile. Make
            sure it’s up to date — we’ll also send a referral document for your
            records.
          </Text>
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
                          uri: `https://signup.roostapp.io${reward.imageUrl}`,
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
                      <Text style={styles.rewardType}>{reward.rewardName}</Text>
                      <Text style={styles.rewardName}>
                        {reward.rewardAmount}
                      </Text>
                      <OrangeProgressBar
                        progress={
                          getRewardProgress(reward.rewardAmount).progress
                        }
                        style={{ marginBottom: 4 }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* <Text style={styles.rewardsSubTitle}>FOR CHARITY</Text>
          <Text style={styles.rewardsDescription}>
            These rewards are considered charitable donations. You'll receive a
            receipt for tax purposes.
          </Text>
          {fetchingRewards ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.rewardsGrid}>
              {rewards
                .filter((r) => r?.rewardFor === "Charity" && r?.isVisible)
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
                          uri: `https://signup.roostapp.io${reward.imageUrl}`,
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
                        {reward.rewardAmount}
                      </Text>
                      <OrangeProgressBar
                        progress={
                          getRewardProgress(reward.rewardAmount).progress
                        }
                        style={{ marginBottom: 4 }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )} */}

          {/* CASH OUT SECTION */}
          <Text style={styles.rewardsSubTitle}>CASH OUT</Text>
          <Text style={styles.rewardsDescription}>
            Convert all my points to cash, keep in mind funds will have to go to
            your brokerage and they will have to disburse it for you. Sorry RECO
            rules.
          </Text>
          <View style={styles.cashOutContainer}>
            <View style={styles.cashOutValueContainer}>
              <Text style={styles.cashOutLabel}>Cash</Text>
              <TextInput
                style={styles.cashOutValueInput}
                keyboardType="numeric"
                value={Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(currentPoints * POINTS_TO_DOLLARS)}
                editable={false}
              />
            </View>
            <Text style={styles.cashOutMinimum}>
              {`Minimum cash out value is $${MIN_CASHOUT_DOLLAR}`}
            </Text>
            <TouchableOpacity
              style={[
                styles.cashOutButton,
                currentPoints < MIN_CASHOUT_DOLLAR &&
                  styles.cashOutButtonDisabled,
              ]}
              onPress={() => {
                if (currentPoints >= MIN_CASHOUT_DOLLAR) {
                  setShowCashoutModal(true);
                } else {
                  setShowCashoutMinimumModal(true);
                }
              }}
            >
              <Text style={styles.cashOutButtonText}>
                {currentPoints < MIN_CASHOUT_DOLLAR
                  ? `Need ${MIN_CASHOUT_DOLLAR - currentPoints} more points`
                  : "Cash Out"}
              </Text>
            </TouchableOpacity>
            {/* Cashout Modal */}
            <CashoutModal
              visible={showCashoutModal}
              points={currentPoints}
              brokerageAddress={{
                name: realtor?.name || "",
                address: realtor?.rewardsAddress || "",
                city: realtor?.rewardsCity || "",
                postalCode: realtor?.rewardsPostalCode || "",
              }}
              showAddressConfirm={showAddressConfirm}
              onCancel={() => {
                setShowCashoutModal(false);
                setShowAddressConfirm(false);
              }}
              onRequestClose={() => {
                setShowCashoutModal(false);
                setShowAddressConfirm(false);
              }}
              onShowAddressConfirm={() => setShowAddressConfirm(true)}
              onFinalConfirm={async () => {
                setClaimLoading(true);
                const uniqueId = `Cash${Date.now()}`;
                const payload = {
                  rewardId: uniqueId,
                  realtorId: realtor._id,
                  to: "Realtor",
                  toAddress: {
                    name: realtor?.name || "",
                    address: realtor?.rewardsAddress || "",
                    city: realtor?.rewardsCity || "",
                    postalCode: realtor?.rewardsPostalCode || "",
                  },
                  targetRealtorId: realtor._id,
                  points: currentPoints,
                };
                try {
                  const resp = await fetch(
                    `https://signup.roostapp.io/realtor/claimRewards`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }
                  );
                  if (resp.ok) {
                    setShowCashoutModal(false);
                    setShowAddressConfirm(false);
                    Alert.alert(
                      "Request Submitted",
                      "Your cash out request has been submitted. The funds will be sent to your brokerage.",
                      [{ text: "OK" }]
                    );
                  } else {
                    const errorData = await resp.json();
                    Alert.alert(
                      "Error",
                      errorData.message || "Failed to claim cashout"
                    );
                  }
                } catch (e) {
                  Alert.alert("Error", "Failed to claim cashout");
                } finally {
                  await fetchLatestRealtor();
                  setClaimLoading(false);
                }
              }}
            />
            <CashoutMinimumModal
              visible={showCashoutMinimumModal}
              minPoints={MIN_CASHOUT_DOLLAR}
              onClose={() => setShowCashoutMinimumModal(false)}
            />
          </View>
        </View>
        {/* Keep all the other functionality intact */}
        {/* Invite Form Modal */}
        <InviteRealtorModal
          visible={showInviteForm}
          onClose={() => setShowInviteForm(false)}
          realtorInfo={realtor}
          realtorId={realtor?._id}
        />
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
            color={COLORS.black}
          />
        </TouchableOpacity>
        {!isHistoryCollapsed && (
          <View style={styles.collapsibleContent}>
            {realtor?.pointsHistory
              ?.slice()
              .reverse()
              .map((e, i) => (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyPts}>
                    <FontAwesome name="star" size={14} color={COLORS.orange} />
                    <Text style={styles.historyPtsTxt}>
                      {" "}
                      {e.points > 0 ? "+" : ""} {e.points}
                    </Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyReason}>{e.reason}</Text>
                    <Text style={styles.historyDate}>{formatDate(e.date)}</Text>
                  </View>
                </View>
              ))}
            {(!realtor?.pointsHistory ||
              realtor.pointsHistory.length === 0) && (
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
        {/* Claim Reward Modal Component */}
        <ClaimRewardsModal
          claimModal={claimModal}
          setClaimModal={setClaimModal}
          selectedReward={selectedReward}
          setClaimLoading={setClaimLoading}
          setSelectedReward={setSelectedReward}
          currentPoints={currentPoints}
          invitedClients={invitedClients}
          handleClaimReward={handleClaimReward}
          claimLoading={claimLoading}
          addressConfirmation={addressConfirmation}
          setAddressConfirmation={setAddressConfirmation}
          selectedClientData={selectedClientData}
          realtor={realtor}
          addressToSend={addressToSend}
          setAddressToSend={setAddressToSend}
          submitRewardClaim={submitRewardClaim}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          styles={styles}
        />

        {/* Success Modal */}
        <RewardClaimedModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: "#F6F6F6",
    flex: 1,
  },
  fixedHeaderSection: {
    backgroundColor: "#F6F6F6",
    zIndex: 2,
  },
  scrollContent: {
    flex: 1,
  },

  /* Header */
  header: {
    backgroundColor: COLORS.black,
    paddingTop: 76,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

  limitHit: {
    color: "#797979",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    padding: 12,
    borderRadius: 8,
    lineHeight: 16,
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
    top: 16,
    padding: 8,
  },

  /* Points display */
  pointsContainer: {
    padding: 24,
    paddingLeft: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: "left",
  },
  pointsNum: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
    marginRight: 8,
  },
  pointsLbl: {
    fontSize: 36,
    fontWeight: "medium",
    fontFamily: "Futura",
    position: "relative",
    color: COLORS.black,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  /* Referral program section */
  sectionContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.white,
    // iOS shadow
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginVertical: 16,
    color: COLORS.black,
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Futura",
    color: COLORS.green,
  },
  rewardPointsText: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Futura",
    color: COLORS.black,
    marginLeft: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "Futura",
    color: COLORS.black,
    textAlign: "right",
  },

  /* Bonus section */
  bonusContainer: {
    backgroundColor: "background: rgba(55, 116, 115, 0.25)",
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
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Futura",
    color: COLORS.green,
    marginBottom: 8,
    lineHeight: 20,
  },
  bonusExample: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "Futura",
    color: COLORS.green,
    marginTop: 8,
  },

  /* Invite button */
  inviteBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 33,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "center",
    gap: 10,
  },
  inviteBtnTxt: {
    color: COLORS.white,
    fontWeight: 700,
    fontFamily: "Futura",
    fontSize: 12,
  },

  rewardsContainer: {
    marginVertical: 16,
  },
  /* Rewards section */
  rewardsTitle: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "Futura",
    marginBottom: 8,
    color: COLORS.black,
    paddingHorizontal: 24,
  },
  rewardsSubTitle: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Futura",
    marginTop: 16,
    marginBottom: 8,
    color: "#707070",
    paddingHorizontal: 24,
  },
  rewardsDescription: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "Futura",
    color: "#707070",
    lineHeight: 20,
    marginBottom: 8,
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
    minHeight: 184,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 1,
    marginTop: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardCardInner: {
    overflow: "hidden",
    borderRadius: 8,
    flex: 1,
  },
  rewardImage: {
    width: "100%",
    height: 92,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  rewardCardContent: {
    padding: 8,
    flex: 1,
  },
  rewardType: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Futura",
    color: "#707070",
    marginBottom: 2,
  },
  rewardName: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "Futura",
    color: COLORS.black,
  },
  rewardInitials: {
    width: "100%",
    height: 92,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Progress bar styling to match screenshot */
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 50,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.orange,
    borderRadius: 50,
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
    minWidth: 60,
    flex: 1,
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
    flex: 10,
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
    marginBottom: 16,
    color: COLORS.black,
  },

  /* Cash Out Section */
  cashOutContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  cashOutLabel: {
    fontSize: 20,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginBottom: 8,
  },
  cashOutValueContainer: {
    flexDirection: "column",
    alignItems: "left",
    borderWidth: 1.5,
    borderColor: COLORS.green,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  cashOutValuePrefix: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
    marginRight: 8,
  },
  cashOutValueInput: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "Futura",
    color: COLORS.green,
    flex: 1,
    paddingVertical: 0,
  },
  cashOutMinimum: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Futura",
    color: COLORS.gray,
    marginBottom: 16,
  },
  cashOutButton: {
    borderRadius: 33,
    borderColor: COLORS.green,
    borderWidth: 2,
    paddingVertical: 13,
    paddingHorizontal: 24,
    minWidth: 120,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cashOutButtonDisabled: {
    borderColor: "#D3D3D3",
    borderWidth: 2,
  },
  cashOutButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Futura",
    color: COLORS.green,
  },
});
