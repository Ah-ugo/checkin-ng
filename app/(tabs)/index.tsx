import AccommodationCard from "@/components/appcomponents/AccomodationCard";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
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

const { width } = Dimensions.get("window");

const item = {
  name: "Protea",
  description: "string",
  accommodation_type: "hotel",
  location: {
    type: "Point",
    coordinates: [10, 10],
    address: "string",
  },
  address: "string",
  city: "string",
  state: "string",
  country: "string",
  amenities: [],
  rooms: [
    {
      name: "bluu",
      description: null,
      price_per_night: 3000,
      capacity: 3,
      amenities: [],
      images: [],
      is_available: true,
    },
  ],
  images: [
    "https://res.cloudinary.com/dejeplzpv/image/upload/v1743038866/accommodation_images/lxts4lwb6ozyedvbrg8c.png",
    "https://res.cloudinary.com/dejeplzpv/image/upload/v1743038867/accommodation_images/gtn744b33n09btk9nby1.png",
  ],
  rating: 0,
  contact_email: "string",
  contact_phone: "string",
  _id: "67e4a889a055035652201734",
  created_at: "2025-03-27T01:23:21.617000",
  average_rating: 0,
  reviews_count: 0,
};

export default function AppHeader({
  userProfile = {
    name: "John Doe",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    hasNotifications: true,
  },
  currentLocation = "San Francisco, CA",
  onLocationPress = () => {},
  onProfilePress = () => {},
  onSearchPress = () => {},
  onFilterChange = () => {},
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(["All"]);

  const accommodationTypes = [
    { id: "all", label: "All", icon: "home" },
    { id: "hotel", label: "Hotels", icon: "bed-outline" },
    { id: "apartment", label: "Apartments", icon: "office-building" },
    { id: "hostel", label: "Hostels", icon: "home-group" },
    { id: "lodge", label: "Lodges", icon: "pine-tree" },
    { id: "villa", label: "Villas", icon: "home-modern" },
    { id: "resort", label: "Resorts", icon: "palm-tree" },
  ];

  const priceRanges = [
    { id: "budget", label: "$" },
    { id: "mid", label: "$$" },
    { id: "luxury", label: "$$$" },
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

  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const scrollToIndex = (index: any) => {
    if (scrollViewRef.current) {
      const x = index * (CARD_WIDTH + SPACING);
      scrollViewRef.current.scrollTo({ x, animated: true });
    }
  };

  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + SPACING));
    setCurrentIndex(index);
  };

  const handleFilterToggle = (filterId: any) => {
    let newFilters;

    if (filterId === "all") {
      newFilters = ["All"];
    } else {
      // Remove "All" when selecting a specific filter
      newFilters = selectedFilters.filter((f) => f !== "All");

      if (selectedFilters.includes(filterId)) {
        newFilters = newFilters.filter((f) => f !== filterId);
        // If no filters left, select "All"
        if (newFilters.length === 0) {
          newFilters = ["All"];
        }
      } else {
        newFilters.push(filterId);
      }
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const isPriceFilterSelected = (id: string) => {
    return selectedFilters.includes(id);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      height: headerHeight,
      backgroundColor: theme.colors.background,
      zIndex: 1,
    },
    headerBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: headerHeight,
    },
    blurView: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60 + insets.top,
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
    },
    locationLabel: {
      fontFamily: "InterRegular",
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    locationText: {
      fontFamily: "InterMedium",
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: 4,
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
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      paddingVertical: 1,
      // height: 48,
    },
    filterContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    filterScrollContainer: {
      flexGrow: 0,
      paddingLeft: 5,
      paddingRight: 10,
      marginBottom: 8,
    },
    filterSection: {
      marginBottom: 12,
    },
    sectionLabel: {
      fontFamily: "InterMedium",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
      marginLeft: 16,
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
    chipIcon: {
      marginRight: 4,
    },
    priceChip: {
      marginRight: 8,
      height: 36,
      borderRadius: 18,
    },
    priceChipSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: 8,
      marginHorizontal: 16,
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
    transparentTitle: {
      fontFamily: "InterSemiBold",
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    scrollContent: {
      paddingTop: 20,
      // paddingLeft: 20,
      // Your content goes here
      // This is just a placeholder to show scrolling behavior
      // height: 1000,
    },
    scrollViewContent: {
      paddingLeft: SPACING * 2,
      paddingRight: SPACING,
      alignItems: "center",
    },
    dummyContent: {
      padding: 16,
    },
    dummyText: {
      fontFamily: "InterRegular",
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    cardContainer: {
      width: CARD_WIDTH,
      marginRight: SPACING,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header with animated opacity */}
      <Animated.View style={[styles.headerContainer, { opacity: 1 }]}>
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            {/* <Animated.View
              style={[
                styles.locationContainer,
                {
                  transform: [{ translateY: locationTextPosition }],
                  opacity: locationTextOpacity,
                },
              ]}
            >
              <Text style={styles.locationLabel}>LOCATION</Text>
            </Animated.View> */}

            <TouchableOpacity
              style={styles.locationContainer}
              onPress={onLocationPress}
            >
              <MaterialIcons
                name="location-on"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentLocation}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={20}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileContainer}
              onPress={onProfilePress}
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
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              onPressIn={onSearchPress}
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

      {/* Transparent header that appears on scroll */}
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
          onPress={onLocationPress}
        >
          <MaterialIcons
            name="location-on"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation}
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={18}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileContainer}
          onPress={onProfilePress}
        >
          {userProfile.hasNotifications && (
            <View style={styles.badgeContainer}>
              <Badge size={8} />
            </View>
          )}
          <Avatar.Image source={{ uri: userProfile.avatar }} size={35} />
        </TouchableOpacity>
      </Animated.View>

      {/* Sample scrollable content to demonstrate header behavior */}
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.scrollContent}>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "InterSemiBold",
                paddingLeft: 25,
                marginBottom: 15,
              }}
            >
              Popular
            </Text>
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
              {/* <View
              // key={item.id}
              style={[
                styles.cardContainer,
                {
                  marginRight:
                    index === items.length - 1 ? SPACING * 2 : SPACING,
                },
              ]}
            > */}
              <AccommodationCard item={item} />
              <AccommodationCard item={item} />
              <AccommodationCard item={item} />
              <AccommodationCard item={item} />
              {/* </View> */}
            </Animated.ScrollView>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
