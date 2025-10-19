import React, { useState, useRef, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { Linking } from "react-native";
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
  // Splash state - updated to handle multiple splash screens
  const [splashScreens, setSplashScreens] = useState([]);
  const [splashLoading, setSplashLoading] = useState(false);
  // Splash modal state
  const [showSplashModal, setShowSplashModal] = useState(false);
  const [selectedSplash, setSelectedSplash] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // API base used by web admin endpoints
  const API_BASE = "http://159.203.58.60:5000";

  // Reusable fetch
  const fetchSplashScreens = async ({ showSpinner = true } = {}) => {
    if (!realtor?.id) return;
    if (showSpinner) setSplashLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/custom-splash?userId=${realtor.id}`
      );
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const list = data.splashScreens || [];
      setSplashScreens(list);
    } catch (e) {
      console.log("Error fetching splash:", e);
    } finally {
      if (showSpinner) setSplashLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSplashScreens();
  }, [realtor?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSplashScreens({ showSpinner: false });
    setRefreshing(false);
  };

  const markSplashRead = async (splashId) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/custom-splash/${splashId}/read`,
        { method: "PUT" }
      );
      if (res.ok) {
        // Remove the splash from the list
        setSplashScreens((prev) =>
          prev.filter((splash) => splash._id !== splashId)
        );
      }
    } catch (e) {
      console.log("Error marking splash read:", e);
    }
  };

  const handleSplashCardClick = (splash) => {
    setSelectedSplash(splash);
    setShowSplashModal(true);
  };

  const handleOpenSplashLink = async (link, splashId) => {
    if (!link) return;
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      }
    } catch (e) {
      console.log("Error opening link:", e);
    } finally {
      // mark read after attempting to open
      if (splashId) markSplashRead(splashId);
      // Close modal
      setShowSplashModal(false);
      setSelectedSplash(null);
    }
  };

  const closeSplashModal = () => {
    setShowSplashModal(false);
    setSelectedSplash(null);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.green}
            colors={[COLORS.green]}
          />
        }
      >
        {splashLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        )}
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

          {/* Custom Splash Cards */}
          {splashScreens.length > 0 && (
            <View style={styles.splashGrid}>
              {splashScreens.map((splash, index) => (
                <TouchableOpacity
                  key={splash._id + Date.now()}
                  style={[
                    styles.splashCard,
                    {
                      backgroundColor: splash.backgroundColor || "#F2EDE6",
                      width: splash.size === "half" ? "48%" : "100%",
                    },
                  ]}
                  onPress={() => handleSplashCardClick(splash)}
                  activeOpacity={0.8}
                >
                  <View style={styles.splashContent}>
                    <Text style={styles.splashTitle}>{splash.title}</Text>
                    {splash.imageUrl && (
                      <Image
                        source={{ uri: splash.imageUrl }}
                        style={styles.splashImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Mortgage Application Modal */}
      <MortgageApplicationModal
        visible={showMortgageModal}
        onClose={() => setShowMortgageModal(false)}
        onConfirm={handleMortgageConfirm}
        realtorInfo={realtorFromContext?.realtorInfo || realtor}
      />

      {/* Splash Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSplashModal}
        onRequestClose={closeSplashModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeSplashModal}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>

            {selectedSplash && (
              <>
                <Text style={styles.modalTitle}>{selectedSplash.title}</Text>

                {/* {selectedSplash.imageUrl && (
                  <Image
                    source={{ uri: selectedSplash.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )} */}

                {selectedSplash.description && (
                  <Text style={styles.modalDescription}>
                    {selectedSplash.description}
                  </Text>
                )}

                {selectedSplash.link && (
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      {
                        backgroundColor:
                          selectedSplash.buttonColor || COLORS.green,
                      },
                    ]}
                    onPress={() =>
                      handleOpenSplashLink(
                        selectedSplash.link,
                        selectedSplash._id
                      )
                    }
                  >
                    <Text style={styles.modalActionButtonText}>
                      {selectedSplash.buttonText || "Learn More"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    width: "100%",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
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
  splashSection: {
    marginBottom: 24,
  },
  splashGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  splashCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 220,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  splashContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  splashTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    fontFamily: "Futura",
    lineHeight: 22,
    marginBottom: 12,
  },
  splashImage: {
    width: "100%",
    height: 80,
    marginTop: "auto",
  },
  splashDesc: {
    fontSize: 14,
    color: COLORS.slate,
  },
  splashButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  splashButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  splashDismiss: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  splashDismissText: {
    color: COLORS.black,
    fontWeight: "600",
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCloseButton: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.black,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
    paddingRight: 40, // Space for close button
    fontFamily: "Futura",
  },
  modalImage: {
    width: "100%",
    height: 150,
    marginBottom: 16,
    borderRadius: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: COLORS.slate,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Futura",
  },
  modalActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalActionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Futura",
  },
});

export default RealtorBottomTabs;
