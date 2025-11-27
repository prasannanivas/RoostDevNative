import React, { useState, useRef, useEffect } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
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
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
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
import HouseImage from "../assets/house_image.png";

const Stack = createStackNavigator();

// Design System Colors (matching your RealtorHome)
const COLORS = {
  green: "#377473",
  background: "#F6F6F6",
  black: "#0E1D1D", // Match RealtorHome color
  slate: "#707070",
  gray: "#A9A9A9",
  silver: "#F6F6F6",
  white: "#FDFDFD",
  blue: "#2271B1",
  yellow: "#F0DE3A",
  orange: "#F0913A",
  red: "#A20E0E",
};

const CustomTabBar = ({ activeTab, onTabPress }) => {
  const index = activeTab === "HomeTab" ? 0 : 1;
  const animatedValue = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: index,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [index]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 40], // -40 for first tab, 40 for second tab (distance 80px)
  });

  const routes = [
    { key: "HomeTab", name: "HomeTab" },
    { key: "TagTab", name: "TagTab" },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarContent}>
        <Animated.View
          style={[styles.slidingIndicator, { transform: [{ translateX }] }]}
        />
        {routes.map((route) => {
          const isFocused = activeTab === route.name;

          let IconComponent;
          if (route.name === "HomeTab") {
            IconComponent = HomeIcon;
          } else if (route.name === "TagTab") {
            IconComponent = TagIcon;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => onTabPress(route.name)}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <IconComponent
                width={24}
                height={24}
                color="#202020"
                strokeWidth={2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Offers screen for the tag functionality
const TagScreen = ({ onShowNotifications, navigation, onNavigateToHome }) => {
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
  const [splashLoading, setSplashLoading] = useState(true); // Start with true for initial load
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Animation for header extended background
  const headerExtendedAnim = useRef(new Animated.Value(55)).current; // Start with full height

  // Animate header extended background on focus/blur
  useFocusEffect(
    React.useCallback(() => {
      // Collapse to 0 when screen is focused with a spring animation for smoother feel
      Animated.spring(headerExtendedAnim, {
        toValue: 0,
        useNativeDriver: false,
        friction: 10,
        tension: 50,
      }).start();

      // No cleanup needed - we'll handle blur separately
      return () => {};
    }, [])
  );

  // Use useEffect with navigation to handle blur animation
  useEffect(() => {
    const unsubscribe = navigation?.addListener("blur", () => {
      // Expand back to 55 when screen loses focus
      Animated.spring(headerExtendedAnim, {
        toValue: 55,
        useNativeDriver: false,
        friction: 10,
        tension: 50,
      }).start();
    });

    return unsubscribe;
  }, [navigation]);

  // Placeholder handlers for header actions
  const handleProfileClick = () => {
    console.log("Profile clicked in TagScreen - navigating to Home");
    onNavigateToHome?.("profile");
  };

  const handleChatPress = () => {
    console.log("Chat pressed");
  };

  const handleRewardsClick = () => {
    console.log("Rewards clicked in TagScreen - navigating to Home");
    onNavigateToHome?.("rewards");
  };

  // Handler for mortgage application
  const handleMortgageApplication = () => {
    setShowMortgageModal(true);
  };

  // API base used by web admin endpoints
  const API_BASE = "http://159.203.58.60:5000";

  // Reusable fetch with silent updates
  const fetchSplashScreens = async ({ showSpinner = true } = {}) => {
    if (!realtor?.id) return;
    if (showSpinner) setSplashLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/custom-splash?userId=${realtor.id}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!res.ok) {
        console.log("Failed to fetch splash screens:", res.status);
        return;
      }
      const data = await res.json();
      const list = data.splashScreens || [];

      // Silent update without showing spinner
      setSplashScreens(list);

      // Cache the data for faster subsequent loads
      await AsyncStorage.setItem(
        `splashScreens_${realtor.id}`,
        JSON.stringify({ data: list, timestamp: Date.now() })
      );
    } catch (e) {
      console.log("Error fetching splash:", e);
    } finally {
      if (showSpinner) setSplashLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Load cached data immediately, then fetch fresh data
  useEffect(() => {
    const loadCachedAndFetch = async () => {
      if (!realtor?.id) return;

      try {
        // Try to load from cache first
        const cachedData = await AsyncStorage.getItem(
          `splashScreens_${realtor.id}`
        );
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isFresh = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes

          // Show cached data immediately
          setSplashScreens(data);
          setSplashLoading(false);

          // If data is still fresh, fetch silently in background
          if (isFresh) {
            setTimeout(() => fetchSplashScreens({ showSpinner: false }), 1000);
          } else {
            // If stale, fetch immediately
            fetchSplashScreens({ showSpinner: false });
          }
        } else {
          // No cache, fetch with spinner
          fetchSplashScreens({ showSpinner: true });
        }
      } catch (error) {
        console.log("Error loading cached splash screens:", error);
        fetchSplashScreens({ showSpinner: true });
      }
    };

    loadCachedAndFetch();
  }, [realtor?.id]);

  // Preload static assets
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        await Asset.fromModule(HouseImage).downloadAsync();
      } catch (e) {
        console.log("Error preloading HouseImage:", e);
      }
    };
    preloadAssets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSplashScreens({ showSpinner: false });
    } catch (error) {
      console.log("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const markSplashRead = async (splashId) => {
    try {
      // Optimistically update UI first
      setSplashScreens((prev) =>
        prev.filter((splash) => splash._id !== splashId)
      );

      // Update cache
      const updatedScreens = splashScreens.filter(
        (splash) => splash._id !== splashId
      );
      await AsyncStorage.setItem(
        `splashScreens_${realtor.id}`,
        JSON.stringify({ data: updatedScreens, timestamp: Date.now() })
      );

      // Then make API call
      const res = await fetch(
        `${API_BASE}/admin/custom-splash/${splashId}/read`,
        { method: "PUT" }
      );

      if (!res.ok) {
        // If API call fails, revert the optimistic update
        setSplashScreens((prev) => {
          const original = splashScreens.find((s) => s._id === splashId);
          return original ? [...prev, original] : prev;
        });
      }
    } catch (e) {
      console.log("Error marking splash read:", e);
      // Revert on error
      setSplashScreens((prev) => {
        const original = splashScreens.find((s) => s._id === splashId);
        return original ? [...prev, original] : prev;
      });
    }
  };

  const handleSplashCardClick = async (splash) => {
    // Open link directly and mark as read
    if (splash.link) {
      try {
        const supported = await Linking.canOpenURL(splash.link);
        if (supported) {
          await Linking.openURL(splash.link);
        }
      } catch (e) {
        console.log("Error opening link:", e);
      }
    }
    // Mark as read after opening link
    // if (splash._id) markSplashRead(splash._id);
  };

  const handleMortgageConfirm = async () => {
    // Modal now handles the API call internally
    console.log("Mortgage application confirmed");
  };

  return (
    <View style={styles.tagScreenContainer}>
      <Animated.View
        style={[
          styles.headerExtendedBackground,
          {
            height: headerExtendedAnim,
          },
        ]}
      />
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
        {splashLoading && isInitialLoad && (
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
            <Image
              source={HouseImage}
              style={styles.offerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

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
    </View>
  );
};

const RealtorBottomTabs = ({ onShowNotifications }) => {
  const realtorHomeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("HomeTab");
  const navigationRef = useRef(null);
  const { auth } = useAuth();
  const realtor = auth.realtor;
  const realtorFromContext = useRealtor();
  const { unreadCount } = useNotification();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [cachedImageBase64, setCachedImageBase64] = useState(null);

  // Effect to refresh profile picture when realtor data changes (same as RealtorHome)
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

  const handleTabPress = (routeName) => {
    if (routeName === activeTab) return;

    if (routeName === "HomeTab") {
      // Going back to Home - Pop
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
      } else {
        // Fallback if for some reason we can't go back (shouldn't happen if logic is correct)
        navigationRef.current?.navigate("HomeTab");
      }
    } else {
      // Going to Tag - Push
      navigationRef.current?.navigate("TagTab");
    }
  };

  const handleProfileClick = () => {
    console.log("Profile clicked - navigating to Home");
    // Open profile modal immediately
    realtorHomeRef.current?.openProfile?.();
    // Navigate in background with slight delay
    setTimeout(() => {
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
      } else {
        navigationRef.current?.navigate("HomeTab");
      }
    }, 350);
  };

  const handleRewardsClick = () => {
    console.log("Rewards clicked - navigating to Home");
    // Open rewards modal immediately
    realtorHomeRef.current?.openRewards?.();
    // Navigate in background with slight delay
    setTimeout(() => {
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
      } else {
        navigationRef.current?.navigate("HomeTab");
      }
    }, 350);
  };

  const handleNotificationClick = () => {
    console.log("Notification clicked - navigating to Home");
    // Open notifications immediately
    onShowNotifications?.();
    // Navigate in background
    if (navigationRef.current && navigationRef.current.canGoBack()) {
      navigationRef.current.goBack();
    } else {
      navigationRef.current?.navigate("HomeTab");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ================= SHARED HEADER ================= */}
      <View style={styles.sharedHeaderContainer}>
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={handleProfileClick}
          activeOpacity={0.7}
        >
          {realtor?.id && (
            <>
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
                        if (!cachedImageBase64) {
                          const imageUri = `https://signup.roostapp.io/realtor/profilepic/${realtor.id}?t=${imageRefreshKey}`;
                          const localUri =
                            FileSystem.cacheDirectory +
                            `profile_${realtor.id}.jpg`;
                          await FileSystem.downloadAsync(imageUri, localUri);
                          const base64 = await FileSystem.readAsStringAsync(
                            localUri,
                            { encoding: FileSystem.EncodingType.Base64 }
                          );
                          setCachedImageBase64(base64);
                          await AsyncStorage.setItem(
                            `profileImage_${realtor.id}`,
                            JSON.stringify({ base64, timestamp: Date.now() })
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
              {realtorFromContext?.realtorInfo?.name || realtor?.name}
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
            onPress={handleNotificationClick}
          />
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

      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                  {
                    translateX: next
                      ? next.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -layouts.screen.width],
                        })
                      : 0,
                  },
                ],
              },
            };
          },
        }}
        screenListeners={({ navigation, route }) => ({
          focus: () => {
            setActiveTab(route.name);
          },
          state: () => {
            // Capture navigation ref from the first available screen or navigator
            if (!navigationRef.current) {
              navigationRef.current = navigation;
            }
          },
        })}
      >
        <Stack.Screen name="HomeTab">
          {(props) => {
            // Capture navigation ref here as well to be safe
            if (!navigationRef.current)
              navigationRef.current = props.navigation;
            return (
              <RealtorHome
                {...props}
                ref={realtorHomeRef}
                onShowNotifications={onShowNotifications}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="TagTab">
          {(props) => (
            <TagScreen
              {...props}
              onShowNotifications={onShowNotifications}
              onNavigateToHome={(action) => {
                // Handle internal navigation requests from TagScreen
                if (
                  navigationRef.current &&
                  navigationRef.current.canGoBack()
                ) {
                  navigationRef.current.goBack();
                } else {
                  props.navigation.navigate("HomeTab");
                }

                setTimeout(() => {
                  if (action === "profile") {
                    realtorHomeRef.current?.openProfile?.();
                  } else if (action === "rewards") {
                    realtorHomeRef.current?.openRewards?.();
                  }
                }, 300); // Increased timeout for animation
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tagScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sharedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 126,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
    backgroundColor: COLORS.black,
    zIndex: 1,
    elevation: 1,
  },
  headerExtendedBackground: {
    position: "absolute",
    top: 126,
    left: 0,
    right: 0,
    width: "100%",
    height: 55,
    backgroundColor: COLORS.black,
    zIndex: 10,
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
    marginTop: 126, // Add top margin to account for fixed header
  },
  offersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#797979",
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
    backgroundColor: "#CDDCDC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    height: 200,
    position: "relative",
  },
  offerText: {
    fontFamily: "Futura",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    color: "#202020",
    width: 322,
    maxWidth: "100%",
  },
  offerImage: {
    position: "absolute",
    width: 221,
    height: 144,
    left: 66,
    top: 56,
    zIndex: 1,
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
    fontWeight: "700",
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
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "#FDFDFD",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    height: 82,
    paddingTop: 0,
    paddingBottom: 34,
    paddingLeft: 36,
    paddingRight: 24,
    width: "100%",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 48,
    gap: 56,
  },
  tabItem: {
    width: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  slidingIndicator: {
    position: "absolute",
    top: 0,
    width: 36,
    height: 4,
    backgroundColor: "#2E2E2E",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
    left: "50%",
    marginLeft: -18,
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
