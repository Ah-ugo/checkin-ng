import AccommodationCard from "@/components/appcomponents/AccomodationCard";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { AccommodationDetails, accommodationsAPI } from "@/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { debounce } from "lodash";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Badge, Chip, Searchbar, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface Accommodation extends AccommodationDetails {}

const { width } = Dimensions.get("window");

// In-memory cache
let cachedData = {
  popular: [] as Accommodation[],
  recommended: [] as Accommodation[],
  nearby: [] as Accommodation[],
  hotels: [] as Accommodation[],
  lastFetch: 0,
};

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { fetchFavorites, isFavorited } = useFavorites();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [currentLocation, setCurrentLocation] = useState("Loading location...");
  const [popularAccommodations, setPopularAccommodations] = useState<
    Accommodation[]
  >([]);
  const [recommendedAccommodations, setRecommendedAccommodations] = useState<
    Accommodation[]
  >([]);
  const [nearbyAccommodations, setNearbyAccommodations] = useState<
    Accommodation[]
  >([]);
  const [hotels, setHotels] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accommodationTypes = [
    { id: "all", label: "All", icon: "home" },
    { id: "hotel", label: "Hotels", icon: "bed-outline" },
    { id: "apartment", label: "Apartments", icon: "office-building" },
    { id: "hostel", label: "Hostels", icon: "home-group" },
    { id: "lodge", label: "Lodges", icon: "pine-tree" },
  ];

  const headerHeight = 180 + insets.top;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const locationTextPosition = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const locationTextOpacity = scrollY.interpolate({
    inputRange: [0, 40, 80],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const CARD_WIDTH = width * 0.75;
  const SPACING = 10;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    headerContainer: {
      height: headerHeight,
      backgroundColor: theme.colors.background,
      zIndex: 1,
    },
    headerContent: {
      paddingTop: insets.top + 10,
      paddingHorizontal: 16,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      maxWidth: width * 0.6,
    },
    locationText: {
      fontFamily: "InterMedium",
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: 4,
      flexShrink: 1,
    },
    profileContainer: {
      position: "relative",
    },
    badgeContainer: {
      position: "absolute",
      top: -2,
      right: -2,
      zIndex: 2,
    },
    searchContainer: {
      marginBottom: 16,
    },
    searchBar: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      paddingVertical: 1,
    },
    filterSection: {
      marginBottom: 12,
    },
    filterScrollContainer: {
      flexGrow: 0,
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: 8,
    },
    chip: {
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    chipLabel: {
      fontFamily: "InterMedium",
      fontSize: 13,
    },
    transparentHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60 + insets.top,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: insets.top,
      paddingHorizontal: 16,
      zIndex: 10,
    },
    scrollContent: {
      paddingTop: 20,
    },
    scrollViewContent: {
      paddingLeft: SPACING * 2,
      paddingRight: SPACING,
      alignItems: "center",
    },
    cardContainer: {
      width: CARD_WIDTH,
      marginRight: SPACING,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      marginBottom: 16,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    retryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "bold",
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: "InterSemiBold",
      paddingLeft: 25,
      marginBottom: 15,
      color: theme.colors.onSurface,
    },
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const scrollToIndex = useCallback((index: number) => {
    if (scrollViewRef.current) {
      const x = index * (CARD_WIDTH + SPACING);
      scrollViewRef.current.scrollTo({ x, animated: true });
    }
  }, []);

  const handleScrollEnd = useCallback((event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + SPACING));
    setCurrentIndex(index);
  }, []);

  const fetchLocation = useMemo(
    () =>
      debounce(async () => {
        setLocationLoading(true);
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setCurrentLocation("Location permission denied");
            return null;
          }

          let location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;

          const addressResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (addressResponse && addressResponse.length > 0) {
            const address = addressResponse[0];
            const formattedAddress = `${address.city || "Unknown City"}, ${
              address.region || address.country || "Unknown Region"
            }`;
            setCurrentLocation((prev) =>
              prev !== formattedAddress ? formattedAddress : prev
            );
            return { latitude, longitude };
          } else {
            setCurrentLocation(user?.location?.address || "Unknown Location");
            return null;
          }
        } catch (error) {
          console.error("Error getting location:", error);
          setCurrentLocation(user?.location?.address || "Unknown Location");
          return null;
        } finally {
          setLocationLoading(false);
        }
      }, 5000),
    [user]
  );

  const fetchPopularAccommodations = useCallback(async () => {
    try {
      const data = await accommodationsAPI.getPopularAccommodations(4);
      setPopularAccommodations((prev) =>
        JSON.stringify(prev) !== JSON.stringify(data) ? data : prev
      );
      cachedData.popular = data;
    } catch (error) {
      console.error("Error fetching popular accommodations:", error);
      setError("Failed to load popular accommodations");
    }
  }, []);

  const fetchRecommendedAccommodations = useCallback(async () => {
    try {
      const data = await accommodationsAPI.getRecommendedAccommodations(4);
      setRecommendedAccommodations((prev) =>
        JSON.stringify(prev) !== JSON.stringify(data) ? data : prev
      );
      cachedData.recommended = data;
    } catch (error) {
      console.error("Error fetching recommended accommodations:", error);
      setError("Failed to load recommended accommodations");
    }
  }, []);

  const fetchNearbyAccommodations = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const data = await accommodationsAPI.getNearbyAccommodations({
          latitude: user?.location?.coordinates[0],
          longitude: user?.location?.coordinates[1],
          distance: 5000,
          limit: 4,
        });
        setNearbyAccommodations((prev) =>
          JSON.stringify(prev) !== JSON.stringify(data.results)
            ? data.results
            : prev
        );
        cachedData.nearby = data.results;
      } catch (error) {
        console.error("Error fetching nearby accommodations:", error);
        setError("Failed to load nearby accommodations");
      }
    },
    []
  );

  const fetchHotels = useCallback(async () => {
    try {
      const data = await accommodationsAPI.getAccommodationsByType("hotels", {
        limit: 4,
      });
      setHotels((prev) =>
        JSON.stringify(prev) !== JSON.stringify(data.results)
          ? data.results
          : prev
      );
      cachedData.hotels = data.results;
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setError("Failed to load hotels");
    }
  }, []);

  const applyFilters = useCallback(async () => {
    if (selectedFilters.includes("all")) {
      await Promise.all([
        cachedData.popular.length
          ? setPopularAccommodations(cachedData.popular)
          : fetchPopularAccommodations(),
        cachedData.recommended.length
          ? setRecommendedAccommodations(cachedData.recommended)
          : fetchRecommendedAccommodations(),
        cachedData.hotels.length ? setHotels(cachedData.hotels) : fetchHotels(),
        fetchLocation().then((coords) => {
          if (
            coords &&
            (!cachedData.nearby.length ||
              cachedData.lastFetch < Date.now() - 300000)
          ) {
            fetchNearbyAccommodations(coords.latitude, coords.longitude);
          } else if (cachedData.nearby.length) {
            setNearbyAccommodations(cachedData.nearby);
          }
        }),
      ]);
      cachedData.lastFetch = Date.now();
      return;
    }

    try {
      const filterPromises = selectedFilters.map(async (type) => {
        const data = await accommodationsAPI.getAccommodations({
          accommodation_type: type,
          limit: 4,
        });
        return { type, results: data.results };
      });

      const filteredResults = await Promise.all(filterPromises);

      filteredResults.forEach(({ type, results }) => {
        if (type === "hotel")
          setHotels((prev) =>
            JSON.stringify(prev) !== JSON.stringify(results) ? results : prev
          );
        else if (type === "apartment")
          setPopularAccommodations((prev) =>
            JSON.stringify(prev) !== JSON.stringify(results) ? results : prev
          );
        else if (type === "hostel")
          setRecommendedAccommodations((prev) =>
            JSON.stringify(prev) !== JSON.stringify(results) ? results : prev
          );
        else if (type === "lodge")
          setNearbyAccommodations((prev) =>
            JSON.stringify(prev) !== JSON.stringify(results) ? results : prev
          );
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      setError("Failed to apply filters");
    }
  }, [
    selectedFilters,
    fetchPopularAccommodations,
    fetchRecommendedAccommodations,
    fetchHotels,
    fetchLocation,
    fetchNearbyAccommodations,
  ]);

  const handleFavoriteToggle = useCallback(
    (id: string, isFavorite: boolean) => {
      const updateSection = (prev: Accommodation[]) =>
        prev.map((item) =>
          item._id === id ? { ...item, is_favorite: isFavorite } : item
        );
      setPopularAccommodations(updateSection);
      setRecommendedAccommodations(updateSection);
      setNearbyAccommodations(updateSection);
      setHotels(updateSection);
      // Update cache
      cachedData.popular = updateSection(cachedData.popular);
      cachedData.recommended = updateSection(cachedData.recommended);
      cachedData.nearby = updateSection(cachedData.nearby);
      cachedData.hotels = updateSection(cachedData.hotels);
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect triggered at", new Date().toISOString());
      setLoading(true);
      setError(null);
      const loadData = async () => {
        try {
          // Use cached data if available and not stale (5 minutes)
          const isCacheValid = cachedData.lastFetch > Date.now() - 300000;
          if (isCacheValid && cachedData.popular.length) {
            setPopularAccommodations(cachedData.popular);
            setRecommendedAccommodations(cachedData.recommended);
            setHotels(cachedData.hotels);
            setNearbyAccommodations(cachedData.nearby);
          } else {
            const locationCoords = await fetchLocation();
            await Promise.all([
              fetchPopularAccommodations(),
              fetchRecommendedAccommodations(),
              fetchHotels(),
              locationCoords
                ? fetchNearbyAccommodations(
                    locationCoords.latitude,
                    locationCoords.longitude
                  )
                : Promise.resolve(),
            ]);
            cachedData.lastFetch = Date.now();
          }
          await fetchFavorites();
          setLoading(false);
        } catch (error) {
          console.error("Error loading data:", error);
          setError("Failed to load data");
          setLoading(false);
        }
      };

      loadData();
    }, [
      fetchLocation,
      fetchPopularAccommodations,
      fetchRecommendedAccommodations,
      fetchHotels,
      fetchFavorites,
      fetchNearbyAccommodations,
    ])
  );

  const handleFilterToggle = useCallback(
    (filterId: string) => {
      let newFilters: string[];
      if (filterId === "all") {
        newFilters = ["all"];
      } else {
        newFilters = selectedFilters.filter((f) => f !== "all");
        if (newFilters.includes(filterId)) {
          newFilters = newFilters.filter((f) => f !== filterId);
          if (newFilters.length === 0) {
            newFilters = ["all"];
          }
        } else {
          newFilters.push(filterId);
        }
      }
      setSelectedFilters(newFilters);
      applyFilters();
    },
    [selectedFilters, applyFilters]
  );

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await accommodationsAPI.searchAccommodations({
        query: searchQuery,
        limit: 10,
      });
      router.push({
        pathname: "/search",
        params: {
          query: searchQuery,
          results: JSON.stringify(results.results),
        },
      });
    } catch (error) {
      console.error("Error searching accommodations:", error);
      setError("Failed to search accommodations");
    }
  }, [searchQuery]);

  const handleProfilePress = useCallback(() => {
    router.push("/profile");
  }, []);

  const handleLocationPress = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  const handleSearchPress = useCallback(() => {
    if (searchQuery.trim()) {
      handleSearchSubmit();
    } else {
      router.push("/search");
    }
  }, [searchQuery, handleSearchSubmit]);

  const userProfile = useMemo(
    () => ({
      name: user ? `${user.first_name} ${user.last_name}` : "Guest",
      avatar:
        user?.profile_image_url ||
        "https://randomuser.me/api/portraits/men/32.jpg",
      hasNotifications: false,
    }),
    [user]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchLocation().then((coords) => {
              Promise.all([
                fetchPopularAccommodations(),
                fetchRecommendedAccommodations(),
                fetchHotels(),
                fetchFavorites(),
                coords
                  ? fetchNearbyAccommodations(coords.latitude, coords.longitude)
                  : Promise.resolve(),
              ]).then(() => setLoading(false));
            });
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Animated.View style={[styles.headerContainer, { opacity: 1 }]}>
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={handleLocationPress}
              disabled={locationLoading}
            >
              <MaterialIcons
                name="location-on"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {user?.location?.address}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileContainer}
              onPress={handleProfilePress}
            >
              {userProfile.hasNotifications && (
                <View style={styles.badgeContainer}>
                  <Badge size={10} />
                </View>
              )}
              <Avatar.Image source={{ uri: userProfile.avatar }} size={40} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search accommodations"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              onSubmitEditing={handleSearchSubmit}
              onPressIn={handleSearchPress}
              elevation={0}
            />
          </View>

          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContainer}
            >
              {accommodationTypes.map((type) => (
                <Chip
                  key={type.id}
                  icon={type.icon}
                  mode="flat"
                  selected={selectedFilters.includes(type.id)}
                  onPress={() => handleFilterToggle(type.id)}
                  style={[
                    styles.chip,
                    selectedFilters.includes(type.id) && styles.chipSelected,
                  ]}
                  textStyle={styles.chipLabel}
                >
                  {type.label}
                </Chip>
              ))}
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.transparentHeader,
          {
            opacity: headerOpacity,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleLocationPress}
        >
          <MaterialIcons
            name="location-on"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {user?.location?.address}
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={18}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileContainer}
          onPress={handleProfilePress}
        >
          {userProfile.hasNotifications && (
            <View style={styles.badgeContainer}>
              <Badge size={8} />
            </View>
          )}
          <Avatar.Image source={{ uri: userProfile.avatar }} size={35} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.scrollContent}>
          <View>
            <Text style={styles.sectionTitle}>Popular</Text>
            <Animated.ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              snapToInterval={CARD_WIDTH + SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {popularAccommodations.length > 0 ? (
                popularAccommodations.map((item) => (
                  <View key={item._id} style={styles.cardContainer}>
                    <AccommodationCard
                      item={item}
                      isFavorite={isFavorited(item._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.sectionTitle}>
                  No popular accommodations found
                </Text>
              )}
            </Animated.ScrollView>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              snapToInterval={CARD_WIDTH + SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {recommendedAccommodations.length > 0 ? (
                recommendedAccommodations.map((item) => (
                  <View key={item._id} style={styles.cardContainer}>
                    <AccommodationCard
                      item={item}
                      isFavorite={isFavorited(item._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.sectionTitle}>
                  No recommended accommodations found
                </Text>
              )}
            </Animated.ScrollView>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Near me</Text>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              snapToInterval={CARD_WIDTH + SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {nearbyAccommodations.length > 0 ? (
                nearbyAccommodations.map((item) => (
                  <View key={item._id} style={styles.cardContainer}>
                    <AccommodationCard
                      item={item}
                      isFavorite={isFavorited(item._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.sectionTitle}>
                  No nearby accommodations found
                </Text>
              )}
            </Animated.ScrollView>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Hotels</Text>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              snapToInterval={CARD_WIDTH + SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {hotels.length > 0 ? (
                hotels.map((item) => (
                  <View key={item._id} style={styles.cardContainer}>
                    <AccommodationCard
                      item={item}
                      isFavorite={isFavorited(item._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.sectionTitle}>No hotels found</Text>
              )}
            </Animated.ScrollView>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
