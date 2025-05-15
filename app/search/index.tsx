import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // Mock data - replace with actual API call
  const mockData = {
    results: [
      {
        name: "Grand Luxury Hotel",
        description: "5-star hotel with premium amenities",
        accommodation_type: "hotel",
        location: {
          address: "123 Luxury Avenue, New York",
        },
        city: "New York",
        country: "USA",
        rooms: [
          {
            price_per_night: 299,
            capacity: 2,
          },
        ],
        images: [
          "https://res.cloudinary.com/dejeplzpv/image/upload/v1747242531/accommodation_images/kwutdzug4arzlteqf9ob.png",
        ],
        average_rating: 4.5,
        reviews_count: 42,
        _id: "67e4a8067e9acffbabf51f3a",
      },
      {
        name: "Protea Hotel",
        description: "Comfortable stay with excellent service",
        accommodation_type: "hotel",
        location: {
          address: "456 Main Street, Cape Town",
        },
        city: "Cape Town",
        country: "South Africa",
        rooms: [
          {
            price_per_night: 150,
            capacity: 3,
          },
        ],
        images: [
          "https://res.cloudinary.com/dejeplzpv/image/upload/v1743038866/accommodation_images/lxts4lwb6ozyedvbrg8c.png",
        ],
        average_rating: 4.2,
        reviews_count: 28,
        _id: "67e4a889a055035652201734",
      },
    ],
    page: 1,
    limit: 10,
    total_count: 2,
    total_pages: 1,
  };

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(
      //   `https://hotel-booking-api-r5dd.onrender.com/api/accommodations/search?query=${searchQuery}&page=${page}&limit=10`,
      //   {
      //     headers: {
      //       'accept': 'application/json',
      //       'Authorization': 'Bearer YOUR_TOKEN_HERE'
      //     }
      //   }
      // );
      // const data = await response.json();

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use mock data for demonstration
      const data = mockData;

      if (page === 1) {
        setSearchResults(data.results);
      } else {
        setSearchResults((prev) => [...prev, ...data.results]);
      }
      setTotalPages(data.total_pages);
    } catch (err) {
      setError("Failed to fetch search results");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchSearchResults();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchSearchResults();
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      setPage((prev) => prev + 1);
      fetchSearchResults();
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push("/explore/[id]", { id: item._id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultLocation}>
          <Ionicons name="location" size={14} color="#666" />
          {item.location.address}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFC107" />
          <Text style={styles.ratingText}>{item.average_rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews_count} reviews)</Text>
        </View>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.resultPrice}>
          From ${item.rooms[0].price_per_night}/night
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loading && page > 1) {
      return (
        <ActivityIndicator style={styles.loader} size="small" color="#3498db" />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels, cities..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchSearchResults}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : searchResults.length === 0 && searchQuery.length > 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different search terms</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3498db"]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {loading && page === 1 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultImage: {
    width: "100%",
    height: 180,
  },
  resultInfo: {
    padding: 16,
  },
  resultName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  resultLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  resultDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  loader: {
    marginVertical: 16,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: "#3498db",
    fontWeight: "bold",
  },
});

export default SearchScreen;
