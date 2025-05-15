import { useAuth } from "@/context/AuthContext";
import { accommodationsAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SavedAccommodationsScreen = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setError("Please log in to view saved accommodations");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await accommodationsAPI.getFavorites();
      setFavorites(response);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load saved accommodations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const toggleFavorite = async (accommodationId) => {
    if (!user) {
      setError("Please log in to manage favorites");
      return;
    }

    try {
      setError(null);
      const isFavorite = favorites.some((item) => item._id === accommodationId);

      if (isFavorite) {
        await accommodationsAPI.removeFromFavorites(accommodationId);
        setFavorites((prev) =>
          prev.filter((item) => item._id !== accommodationId)
        );
      } else {
        await accommodationsAPI.addToFavorites(accommodationId);
        // Fetch the accommodation details to add to favorites (simplified for UX)
        const accommodation = await accommodationsAPI.getAccommodation(
          accommodationId
        );
        setFavorites((prev) => [...prev, accommodation]);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setError("Failed to update favorite status. Please try again.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const filteredFavorites =
    filter === "all"
      ? favorites
      : favorites.filter((item) => item.accommodation_type === filter);

  const renderAccommodationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.accommodationCard}
      onPress={() => router.push(`/explore/${item._id}`)}
    >
      <Image
        source={{
          uri: item.images[0] || "https://via.placeholder.com/800/500",
        }}
        style={styles.accommodationImage}
      />
      <View style={styles.accommodationInfo}>
        <View style={styles.accommodationHeader}>
          <Text style={styles.accommodationTitle}>{item.name}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item._id)}>
            <Ionicons
              name="heart"
              size={24}
              color="#ff4444"
              style={styles.favoriteIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.accommodationMeta}>
          <Text style={styles.accommodationType}>
            {item.accommodation_type.charAt(0).toUpperCase() +
              item.accommodation_type.slice(1)}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>
              {item.average_rating || "N/A"}
            </Text>
            <Text style={styles.reviewsText}>({item.reviews_count || 0})</Text>
          </View>
        </View>

        <Text style={styles.accommodationLocation}>
          <Ionicons name="location" size={14} color="#666" />
          {item.city}, {item.country}
        </Text>

        <Text style={styles.accommodationPrice}>
          From R{item.rooms[0]?.price_per_night?.toLocaleString() || "N/A"}
          /night
        </Text>

        <View style={styles.amenitiesContainer}>
          {item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityPill}>
              <Ionicons
                name={
                  amenity === "wifi"
                    ? "wifi"
                    : amenity === "pool"
                    ? "water"
                    : amenity === "gym"
                    ? "fitness"
                    : amenity === "restaurant"
                    ? "restaurant"
                    : amenity === "kitchen"
                    ? "restaurant"
                    : amenity === "parking"
                    ? "car"
                    : amenity === "tv"
                    ? "tv"
                    : amenity === "beach access"
                    ? "water"
                    : "home"
                }
                size={14}
                color="#3498db"
              />
              <Text style={styles.amenityText}>
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </Text>
            </View>
          ))}
          {item.amenities.length > 3 && (
            <View style={styles.amenityPill}>
              <Text style={styles.amenityText}>
                +{item.amenities.length - 3} more
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Accommodations</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryButtonText}>
              {user ? "Retry" : "Go to Login"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={renderAccommodationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No saved accommodations found
              </Text>
              <Text style={styles.emptySubtext}>
                {filter !== "all"
                  ? `Try changing your filter`
                  : `Save your favorite places to see them here`}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3498db"]}
            />
          }
        />
      )}

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Accommodations</Text>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === "all" && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter("all");
                setShowFilterModal(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filter === "all" && styles.filterOptionTextSelected,
                ]}
              >
                All Types
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === "hotel" && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter("hotel");
                setShowFilterModal(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filter === "hotel" && styles.filterOptionTextSelected,
                ]}
              >
                Hotels
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === "apartment" && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter("apartment");
                setShowFilterModal(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filter === "apartment" && styles.filterOptionTextSelected,
                ]}
              >
                Apartments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === "villa" && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter("villa");
                setShowFilterModal(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filter === "villa" && styles.filterOptionTextSelected,
                ]}
              >
                Villas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filterButton: {
    padding: 8,
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
    color: "#c62828",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  accommodationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accommodationImage: {
    width: "100%",
    height: 180,
  },
  accommodationInfo: {
    padding: 16,
  },
  accommodationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accommodationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  favoriteIcon: {
    marginLeft: 8,
  },
  accommodationMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  accommodationType: {
    fontSize: 14,
    color: "#666",
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  accommodationLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  accommodationPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#3498db",
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amenityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: "#3498db",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  filterOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterOptionSelected: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  filterOptionTextSelected: {
    color: "#fff",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});

export default SavedAccommodationsScreen;
