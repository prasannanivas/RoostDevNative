import React, { useState, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import { useRealtor } from "../context/RealtorContext";
import { useNotification } from "../context/NotificationContext";
import NotificationBell from "../components/icons/NotificationBell";
import GiftIcon from "../components/icons/GiftIcon";
import HomeIcon from "../components/icons/HomeIcon";
import TagIcon from "../components/icons/TagIcon";
import RealtorHome from "../RealtorHome";
import { generateInitials } from "../utils/initialsUtils";
import MortgageApplicationModal from "../components/modals/MortgageApplicationModal";

const Tab = createBottomTabNavigator();

// Design System Colors (matching your RealtorHome)
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
};

// Offers screen for the tag functionality
const TagScreen = () => {
  const { auth } = useAuth();
  const realtor = auth.realtor;
  const realtorFromContext = useRealtor();
  const { unreadCount } = useNotification();

  // State for profile image handling (same as RealtorHome)
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [cachedImageBase64, setCachedImageBase64] = useState(null);

  // State for mortgage modal
  const [showMortgageModal, setShowMortgageModal] = useState(false);

  // Placeholder handlers for header actions
  const handleProfileClick = () => {
    console.log("Profile clicked");
  };

  const handleChatPress = () => {
    console.log("Chat pressed");
  };

  const handleRewardsClick = () => {
    console.log("Rewards clicked");
  };

  // Handler for mortgage application
  const handleMortgageApplication = () => {
    setShowMortgageModal(true);
  };

  const handleMortgageConfirm = async () => {
    // Modal now handles the API call internally
    console.log("Mortgage application confirmed");
  };

  return (
    <View style={styles.container}>
      {/* ================= TOP HEADER (Same as RealtorHome) ================= */}
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
                  {generateInitials(
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
            onPress={() => console.log("Notifications pressed")}
          />
          <TouchableOpacity
            style={styles.chatIconContainer}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={COLORS.white}
            />
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
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>OFFERS FOR YOU</Text>

          {/* Mortgage Offer Card */}
          <TouchableOpacity
            style={styles.offerCard}
            onPress={handleMortgageApplication}
            activeOpacity={0.8}
          >
            <Text style={styles.offerText}>
              Get a private 8% mortgage - Simple and easy.
            </Text>
          </TouchableOpacity>

          {/* Coming Soon Card */}
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>More coming soon</Text>
          </View>
        </View>
      </ScrollView>

      {/* Mortgage Application Modal */}
      <MortgageApplicationModal
        visible={showMortgageModal}
        onClose={() => setShowMortgageModal(false)}
        onConfirm={handleMortgageConfirm}
        realtorInfo={realtorFromContext?.realtorInfo || realtor}
      />
    </View>
  );
};

const RealtorBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === "HomeTab") {
            IconComponent = HomeIcon;
          } else if (route.name === "TagTab") {
            IconComponent = TagIcon;
          }

          return (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <IconComponent width={24} height={24} color={COLORS.black} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.black,
        tabBarInactiveTintColor: COLORS.black,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray,
          height: 70,
          paddingBottom: 16,
          paddingTop: 8,
          alignItems: "center",
        },
        tabBarItemStyle: {
          flex: 0,
          width: 60, // Fixed width to bring icons closer
          marginHorizontal: 20, // Space between the two icons
        },
        tabBarLabelStyle: {
          display: "none", // Hide labels completely
        },
        headerShown: false, // We'll handle the header in individual screens
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={RealtorHome}
        options={{
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="TagTab"
        component={TagScreen}
        options={{
          tabBarLabel: "",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    width: "100%",
    height: 126,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 8,
    backgroundColor: COLORS.black,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: COLORS.slate,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Futura",
  },
  nameAgencyContainer: {
    flexDirection: "column",
    flex: 1,
    maxWidth: 140,
  },
  realtorName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.white,
    fontFamily: "Futura",
  },
  agencyName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate,
    fontFamily: "Futura",
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  offersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "#797979",
    fontWeight: "700",
    color: COLORS.slate,
    fontFamily: "Futura",
    marginBottom: 24,
    letterSpacing: 1,
  },
  offerCard: {
    backgroundColor: "#CDDCDC", // Light blue-green color from the image
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: "f",
  },
  offerText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    fontFamily: "Futura",
    lineHeight: 24,
  },
  comingSoonCard: {
    backgroundColor: "#CDD0DC", // Light purple color from the image
    borderRadius: 16,
    padding: 24,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    fontFamily: "Futura",
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 50,
    width: 50,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 40,
    height: 4,
    backgroundColor: "#202020",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  tabIcon: {
    marginTop: 4,
  },
});

export default RealtorBottomTabs;
