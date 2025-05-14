import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Chip, Surface, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

const { width: screenWidth } = Dimensions.get("window");

export default function AccommodationCard({
  item,
  onPress,
  onFavoriteToggle,
  isFavorite = false,
  style,
  imageHeight = 200,
  fullWidth = false,
}: any) {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(isFavorite);
  const cardWidth = fullWidth ? screenWidth - 32 : screenWidth * 0.75;

  // For animation effects
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(pressed.value ? 0.98 : 1, { duration: 100 }),
        },
      ],
    };
  });

  const handleImageChange = (index: any) => {
    setCurrentImageIndex(index);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (onFavoriteToggle) {
      onFavoriteToggle(item._id, !isBookmarked);
    }
  };

  const handlePress = () => {
    router.push("/explore/[id]");
    pressed.value = 1;
    setTimeout(() => {
      pressed.value = 0;
      if (onPress) {
        onPress(item);
      }
    }, 100);
  };

  // Format price to locale currency
  const formatPrice = (price: any) => {
    return (
      price?.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
        currencyDisplay: "symbol",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) || "₦0"
    );
  };

  // Extract the lowest price from available rooms
  const getLowestPrice = () => {
    if (!item.rooms || item.rooms.length === 0) return 0;

    const prices = item.rooms
      .filter((room: any) => room.is_available)
      .map((room: any) => room.price_per_night);

    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  // Get accommodation type icon
  const getAccommodationTypeIcon = () => {
    switch (item.accommodation_type?.toLowerCase()) {
      case "hotel":
        return "bed-outline";
      case "apartment":
        return "office-building";
      case "hostel":
        return "home-group";
      case "lodge":
        return "pine-tree";
      case "villa":
        return "home-modern";
      case "resort":
        return "palm-tree";
      default:
        return "home";
    }
  };

  // Extract amenities to display (limit to top 3)
  const getTopAmenities = () => {
    const priorityAmenities = [
      "wifi",
      "pool",
      "ac",
      "parking",
      "breakfast",
      "gym",
    ];
    let amenities: any = [];

    if (item.amenities && item.amenities.length > 0) {
      amenities = [...item.amenities];
    }

    // Sort so priority amenities appear first
    amenities.sort((a: any, b: any) => {
      const aIndex = priorityAmenities.findIndex((item) =>
        a.toLowerCase().includes(item)
      );
      const bIndex = priorityAmenities.findIndex((item) =>
        b.toLowerCase().includes(item)
      );

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    return amenities.slice(0, 3);
  };

  // Get icon for amenity
  const getAmenityIcon = (amenity: any) => {
    const normalizedAmenity = amenity.toLowerCase();

    if (normalizedAmenity.includes("wifi")) return "wifi";
    if (normalizedAmenity.includes("pool")) return "pool";
    if (normalizedAmenity.includes("ac") || normalizedAmenity.includes("air"))
      return "air-conditioner";
    if (normalizedAmenity.includes("park")) return "car";
    if (
      normalizedAmenity.includes("breakfast") ||
      normalizedAmenity.includes("meal")
    )
      return "food";
    if (
      normalizedAmenity.includes("gym") ||
      normalizedAmenity.includes("fitness")
    )
      return "weight-lifter";
    if (normalizedAmenity.includes("tv")) return "television";
    if (normalizedAmenity.includes("pet")) return "paw";

    return "check-circle-outline";
  };

  const styles = StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      borderRadius: 16,
      overflow: "hidden",
      marginHorizontal: 8,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    imageContainer: {
      width: "100%",
      height: imageHeight,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    gradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "50%",
      borderRadius: 16,
    },
    topOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      zIndex: 10,
    },
    imageIndicatorContainer: {
      position: "absolute",
      bottom: 12,
      alignSelf: "center",
      flexDirection: "row",
      zIndex: 10,
    },
    imageIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      marginHorizontal: 2,
    },
    imageIndicatorActive: {
      backgroundColor: "#fff",
      width: 18,
    },
    cardBody: {
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    nameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    name: {
      fontFamily: "InterSemiBold",
      fontSize: 18,
      color: theme.colors.onSurface,
      flexShrink: 1,
      width: "80%",
    },
    price: {
      fontFamily: "InterBold",
      fontSize: 18,
      color: theme.colors.primary,
    },
    perNight: {
      fontFamily: "InterRegular",
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    locationText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    ratingValue: {
      fontFamily: "InterMedium",
      fontSize: 14,
      color: theme.colors.onSurface,
      marginLeft: 4,
    },
    ratingCount: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    amenitiesContainer: {
      flexDirection: "row",
      marginTop: 12,
      flexWrap: "wrap",
    },
    amenityChip: {
      marginRight: 8,
      marginBottom: 4,
      height: 28,
    },
    typeChip: {
      borderRadius: 16,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    typeChipText: {
      color: "#fff",
      fontSize: 12,
      textTransform: "capitalize",
    },
    bookmarkButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
    },
    roomInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    roomInfoText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle, style]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Surface style={{ borderRadius: 16 }}>
          <View style={styles.imageContainer}>
            {item.images && item.images.length > 0 ? (
              <Carousel
                width={cardWidth}
                height={imageHeight}
                data={item.images}
                onSnapToItem={handleImageChange}
                renderItem={({ item: image }) => (
                  <ImageBackground source={{ uri: image }} style={styles.image}>
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.6)"]}
                      style={styles.gradient}
                    />
                  </ImageBackground>
                )}
                loop={false}
              />
            ) : (
              <ImageBackground
                source={require("../../assets/images/favicon.png")}
                style={styles.image}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={styles.gradient}
                />
              </ImageBackground>
            )}

            <View style={styles.topOverlay}>
              <Chip
                style={styles.typeChip}
                textStyle={styles.typeChipText}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getAccommodationTypeIcon()}
                    size={14}
                    color="#fff"
                  />
                )}
              >
                {item.accommodation_type || "Hotel"}
              </Chip>

              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={handleBookmark}
              >
                <MaterialIcons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={
                    isBookmarked ? theme.colors.primary : theme.colors.onSurface
                  }
                />
              </TouchableOpacity>
            </View>

            {item.images && item.images.length > 1 && (
              <View style={styles.imageIndicatorContainer}>
                {item.images.map((_, index) => (
                  <View
                    key={`indicator-${index}`}
                    style={[
                      styles.imageIndicator,
                      currentImageIndex === index &&
                        styles.imageIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name || "Unnamed Accommodation"}
              </Text>
              <View>
                <Text style={styles.price}>
                  {formatPrice(getLowestPrice())}
                </Text>
                <Text style={styles.perNight}>per night</Text>
              </View>
            </View>

            <View style={styles.locationContainer}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {[item.address, item.city, item.state, item.country]
                  .filter(Boolean)
                  .join(", ") || "Unknown location"}
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              <MaterialIcons
                name="star"
                size={16}
                color={
                  item.average_rating > 0
                    ? "#FFC107"
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text style={styles.ratingValue}>
                {item.average_rating > 0
                  ? item.average_rating.toFixed(1)
                  : "New"}
              </Text>
              {item.reviews_count > 0 && (
                <Text style={styles.ratingCount}>({item.reviews_count})</Text>
              )}
            </View>

            <View style={styles.amenitiesContainer}>
              {getTopAmenities().map((amenity: any, index: any) => (
                <Chip
                  key={`amenity-${index}`}
                  style={styles.amenityChip}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={getAmenityIcon(amenity)}
                      size={14}
                      color={theme.colors.onSurfaceVariant}
                    />
                  )}
                  textStyle={{ fontSize: 12 }}
                >
                  {amenity}
                </Chip>
              ))}
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.roomInfo}>
                <MaterialCommunityIcons
                  name="bed-outline"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.roomInfoText}>
                  {item.rooms
                    ? `${item.rooms.length} ${
                        item.rooms.length === 1 ? "Room" : "Rooms"
                      }`
                    : "No rooms info"}
                </Text>
              </View>

              <View style={styles.roomInfo}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.roomInfoText}>
                  {item.rooms && item.rooms.length > 0
                    ? `${Math.max(
                        ...item.rooms.map((r: any) => r.capacity)
                      )} guests max`
                    : "Unknown capacity"}
                </Text>
              </View>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );
}
