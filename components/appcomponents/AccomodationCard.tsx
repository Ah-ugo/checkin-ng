import { useFavorites } from "@/context/FavoritesContext";
import { AccommodationDetails } from "@/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
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

interface AccommodationCardProps {
  item: AccommodationDetails;
  onPress?: (item: AccommodationDetails) => void;
  style?: any;
  imageHeight?: number;
  fullWidth?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export default function AccommodationCard({
  item,
  onPress,
  style,
  imageHeight = 160,
  fullWidth = false,
}: AccommodationCardProps) {
  const theme = useTheme();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
  const [isFavorite, setIsFavorite] = useState(isFavorited(item._id));
  const [error, setError] = useState<string | null>(null);
  const cardWidth = fullWidth ? screenWidth - 32 : screenWidth * 0.75;
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value, { duration: 100 }) }],
  }));

  const handleFavoriteToggle = async () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    try {
      if (newFavoriteState) {
        await addFavorite(item._id);
      } else {
        await removeFavorite(item._id);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setIsFavorite(!newFavoriteState); // Revert state on error
      setError("Failed to update favorites");
      setTimeout(() => setError(null), 2000); // Clear error after 2s
    }
  };

  const handlePress = () => {
    pressed.value = 0.98;
    setTimeout(() => {
      pressed.value = 1;
      router.push(`/explore/${item._id}`);
      if (onPress) {
        onPress(item);
      }
    }, 100);
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) || "₦0";

  const getLowestPrice = () => {
    if (!item.rooms || item.rooms.length === 0) return 0;
    const prices = item.rooms
      .filter((room) => room.is_available)
      .map((room) => room.price_per_night);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const getAccommodationTypeIcon = () => {
    switch (item.accommodation_type?.toLowerCase()) {
      case "hotel":
        return "bed";
      case "apartment":
        return "apartment";
      case "hostel":
        return "group";
      case "lodge":
        return "cabin";
      default:
        return "home";
    }
  };

  const getTopAmenities = () => {
    const priorityAmenities = ["wifi", "pool", "parking", "breakfast"];
    let amenities = item.amenities || [];
    amenities.sort((a, b) => {
      const aIndex = priorityAmenities.findIndex((item) =>
        a.toLowerCase().includes(item)
      );
      const bIndex = priorityAmenities.findIndex((item) =>
        b.toLowerCase().includes(item)
      );
      return (
        (aIndex === -1 ? Infinity : aIndex) -
        (bIndex === -1 ? Infinity : bIndex)
      );
    });
    return amenities.slice(0, 2);
  };

  const getAmenityIcon = (amenity: string) => {
    const normalized = amenity.toLowerCase();
    if (normalized.includes("wifi")) return "wifi";
    if (normalized.includes("pool")) return "pool";
    if (normalized.includes("park")) return "local-parking";
    if (normalized.includes("breakfast")) return "free-breakfast";
    return "check-circle";
  };

  const styles = StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
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
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      overflow: "hidden",
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    topOverlay: {
      position: "absolute",
      top: 8,
      left: 8,
      right: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    typeChip: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    typeChipText: {
      fontFamily: "InterMedium",
      fontSize: 12,
      color: theme.colors.onPrimaryContainer,
      textTransform: "capitalize",
    },
    favoriteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      elevation: 2,
    },
    cardBody: {
      padding: 12,
      backgroundColor: theme.colors.surface,
    },
    name: {
      fontFamily: "InterSemiBold",
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    locationText: {
      fontFamily: "InterRegular",
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 8,
    },
    price: {
      fontFamily: "InterMedium",
      fontSize: 15,
      color: theme.colors.primary,
      marginRight: 4,
    },
    perNight: {
      fontFamily: "InterRegular",
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    ratingContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    ratingValue: {
      fontFamily: "InterMedium",
      fontSize: 13,
      color: theme.colors.onSurface,
      marginLeft: 4,
    },
    amenitiesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    amenityChip: {
      marginRight: 6,
      marginBottom: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    amenityChipText: {
      fontFamily: "InterRegular",
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      fontFamily: "InterRegular",
      fontSize: 12,
      color: theme.colors.error,
      textAlign: "center",
      marginTop: 4,
    },
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle, style]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Surface style={{ borderRadius: 12 }}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.images?.[0] || "https://via.placeholder.com/150",
              }}
              style={styles.image}
            />
            <View style={styles.topOverlay}>
              <Chip
                style={styles.typeChip}
                textStyle={styles.typeChipText}
                icon={() => (
                  <MaterialIcons
                    name={getAccommodationTypeIcon()}
                    size={14}
                    color={theme.colors.onPrimaryContainer}
                  />
                )}
              >
                {item.accommodation_type || "Accommodation"}
              </Chip>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoriteToggle}
                accessibilityLabel={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <MaterialIcons
                  name={isFavorite ? "favorite" : "favorite-outline"}
                  size={18}
                  color={
                    isFavorite
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name || "Unnamed Accommodation"}
            </Text>
            <View style={styles.locationContainer}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.city || item.country || "Unknown location"}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(getLowestPrice())}</Text>
              <Text style={styles.perNight}>/night</Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialIcons
                name="star"
                size={14}
                color={
                  item.average_rating
                    ? "#FFC107"
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text style={styles.ratingValue}>
                {item.average_rating ? item.average_rating.toFixed(1) : "New"}
              </Text>
            </View>
            <View style={styles.amenitiesContainer}>
              {getTopAmenities().map((amenity, index) => (
                <Chip
                  key={`amenity-${index}`}
                  style={styles.amenityChip}
                  textStyle={styles.amenityChipText}
                  icon={() => (
                    <MaterialIcons
                      name={getAmenityIcon(amenity)}
                      size={12}
                      color={theme.colors.onSurfaceVariant}
                    />
                  )}
                >
                  {amenity}
                </Chip>
              ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );
}
