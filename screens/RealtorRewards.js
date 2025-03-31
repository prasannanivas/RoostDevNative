import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

/**
 * realtor = {
 *   _id: string,
 *   points: number,
 *   pointsHistory: [
 *     { points: number, reason: string, date: string },
 *     ...
 *   ]
 * }
 *
 * invitedRealtors = array of invited realtors
 * getInitials = function to get name initials
 */

export default function RealtorRewards({
  realtor,
  invitedRealtors,
  getInitials,
}) {
  const [showForm, setShowForm] = useState(false);
  const [isEmail, setIsEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [formData, setFormData] = useState({
    referenceName: "",
    email: "",
    phone: "",
  });

  // Example progress / reward amount placeholders
  const totalPoints = realtor?.points || 0;
  const rewardProgress = 76; // e.g., 76% progress
  const rewardAmount = 100; // e.g., $100

  // Format date from your pointsHistory
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Invite Realtor logic
  const handleInviteRealtor = async () => {
    setIsLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      const payload = {
        referenceName: formData.referenceName,
        phone: isEmail ? "" : formData.phone,
        email: isEmail ? formData.email : "",
        type: "Realtor",
      };

      // Replace 54.89.183.155 with your server's accessible URL
      const response = await fetch(
        `http://54.89.183.155:5000/realtor/${realtor._id}/invite-realtor`,
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
          message: "Realtor invited successfully!",
          type: "success",
        });
        setTimeout(() => {
          setShowForm(false);
          setFormData({ referenceName: "", phone: "", email: "" });
          setFeedback({ message: "", type: "" });
        }, 2000);
      } else {
        setFeedback({
          message: "Failed to invite Realtor. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error inviting realtor:", error);
      setFeedback({
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header: Big Points + "Rewards" Title */}
      <View style={styles.headerRow}>
        <Text style={styles.pointsText}>{totalPoints}</Text>
        <Text style={styles.headerTitle}>points</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Let’s build great things together!
      </Text>
      <Text style={styles.headerDescription}>
        Collect points and trade them in from vacations to cash
      </Text>

      {/* Referral Program Card */}
      <View style={styles.referralCard}>
        <Text style={styles.referralTitle}>Referral program</Text>
        <Text style={styles.referralLine}>1 PT for every client invited</Text>
        <Text style={styles.referralLine}>
          10 PTS for every fellow realtor invited
        </Text>
        <Text style={styles.bonusTitle}>BONUS</Text>
        <Text style={styles.bonusText}>
          Earn an additional 10% from your referred realtor’s activities.
        </Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.inviteButtonText}>Invite Realtors</Text>
        </TouchableOpacity>
        <Text style={styles.referralLine}>
          300 PT your client uses a preferred mortgage partner
        </Text>
      </View>

      {/* Rewards Section (Example) */}
      <View style={styles.rewardsSection}>
        <Text style={styles.rewardsHeading}>Rewards</Text>
        <View style={styles.rewardCard}>
          <Text style={styles.rewardCardText}>Cash ${rewardAmount}</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${rewardProgress}%` }]}
            />
          </View>
          <Text style={styles.rewardPercent}>{rewardProgress}%</Text>
        </View>
      </View>

      {/* Points History */}
      <View style={styles.pointsHistory}>
        <View style={styles.historyHeader}>
          <Ionicons
            name="time-outline"
            size={20}
            color="#23231A"
            style={styles.historyIcon}
          />
          <Text style={styles.historyTitle}>Points History</Text>
        </View>
        <View style={styles.historyList}>
          {(realtor.pointsHistory || []).map((entry, idx) => (
            <View key={idx} style={styles.historyItem}>
              <View style={styles.historyPoints}>
                <Ionicons name="star" size={14} color="#F9A602" />
                <Text style={styles.historyPointsText}>+{entry.points}</Text>
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyReason}>{entry.reason}</Text>
                <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Invited Realtors */}
      <View style={styles.invitedRealtors}>
        <Text style={styles.invitedTitle}>Invited Realtors</Text>
        {invitedRealtors.map((client) => (
          <View key={client._id} style={styles.clientCard}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>
                {getInitials(client.referenceName)}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.referenceName}</Text>
              <Text style={styles.clientStatus}>
                Status:{" "}
                {client.status === "PENDING"
                  ? "Invited"
                  : client.status === "ACCEPTED" &&
                    (!client.documents || client.documents.length === 0)
                  ? "Signed Up"
                  : client.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Invite Realtor Modal */}
      <Modal
        visible={showForm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.formOverlay}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Invite New Realtor</Text>
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
            <Text style={styles.label}>Nickname:</Text>
            <TextInput
              style={styles.input}
              value={formData.referenceName}
              onChangeText={(text) =>
                setFormData({ ...formData, referenceName: text })
              }
              required
            />

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

            <Text style={styles.label}>{isEmail ? "Email:" : "Phone:"}</Text>
            <TextInput
              style={styles.input}
              value={isEmail ? formData.email : formData.phone}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  [isEmail ? "email" : "phone"]: text,
                })
              }
              keyboardType={isEmail ? "email-address" : "phone-pad"}
              required
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, isLoading && styles.loadingButton]}
                onPress={handleInviteRealtor}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.formButtonText}>Send Invite</Text>
                )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* Container for everything */
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  /* Header: Points and "Rewards" text */
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#019B8E",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#23231A",
    marginBottom: 5,
  },
  headerDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },

  /* Referral Program Card */
  referralCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  referralLine: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 5,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F04D4D",
    marginTop: 10,
  },
  bonusText: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: "#019B8E",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  inviteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Rewards Section */
  rewardsSection: {
    marginBottom: 20,
  },
  rewardsHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  rewardCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  rewardCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#019B8E",
  },
  rewardPercent: {
    fontSize: 14,
    color: "#23231A",
  },

  /* Points History */
  pointsHistory: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  historyIcon: {
    marginRight: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
  },
  historyList: {},
  historyItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  historyPoints: {
    flexDirection: "row",
    alignItems: "center",
    width: 70,
  },
  historyPointsText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#23231A",
    fontWeight: "600",
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
    color: "#666666",
  },

  /* Invited Realtors */
  invitedRealtors: {
    marginBottom: 40,
  },
  invitedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23231A",
    marginBottom: 10,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#019B8E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#23231A",
  },
  clientStatus: {
    fontSize: 12,
    color: "#666666",
  },

  /* Invite Realtor Modal & Form */
  formOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 8,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#23231A",
  },
  label: {
    fontSize: 14,
    color: "#23231A",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 14,
    color: "#23231A",
  },
  toggleButtons: {
    flexDirection: "row",
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#019B8E",
    padding: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#019B8E",
  },
  toggleButtonText: {
    color: "#019B8E",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    alignItems: "center",
  },
  formButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingButton: {
    opacity: 0.7,
  },
  feedbackMessage: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
});
