import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BookingsScreen = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock fetch function - replace with actual API call
  const fetchBookings = async (status: any) => {
    try {
      setLoading(true);
      // Simulating API call
      // const response = await fetch(`/api/users/bookings?status=${status}`);
      // const data = await response.json();

      // Mock data based on the provided structure
      const mockData = [
        {
          accommodation_id: "67e4a8067e9acffbabf51f3a",
          room_id: "0",
          check_in_date: "2025-05-14T16:13:19.843000",
          check_out_date: "2025-05-20T16:13:19.843000",
          guests: 2,
          special_requests: "Need early check-in",
          _id: "6824ce515f70fd179f0a947b",
          user_id: "6824cbc75f70fd179f0a947a",
          total_price: 299,
          booking_status: status === "cancelled" ? "cancelled" : "confirmed",
          payment_status: "paid",
          created_at: "2025-05-14T17:09:37.100000",
          accommodation_details: {
            name: "Luxury Downtown Apartment",
            image: "https://picsum.photos/800/500",
            address: "123 Main Street, San Francisco",
          },
          room_details: {
            name: "Master Suite",
            type: "Apartment",
          },
        },
        {
          accommodation_id: "67e4a8067e9acffbabf51f3b",
          room_id: "1",
          check_in_date:
            status === "upcoming"
              ? "2025-06-01T12:00:00.000000"
              : "2025-03-10T12:00:00.000000",
          check_out_date:
            status === "upcoming"
              ? "2025-06-05T12:00:00.000000"
              : "2025-03-15T12:00:00.000000",
          guests: 1,
          special_requests: "",
          _id: "6824ce515f70fd179f0a947c",
          user_id: "6824cbc75f70fd179f0a947a",
          total_price: 199,
          booking_status: status === "cancelled" ? "cancelled" : "confirmed",
          payment_status: "paid",
          created_at:
            status === "upcoming"
              ? "2025-04-20T17:09:37.100000"
              : "2025-02-15T17:09:37.100000",
          accommodation_details: {
            name: "Beachfront Villa",
            image: "https://picsum.photos/800/501",
            address: "456 Ocean Drive, Miami",
          },
          room_details: {
            name: "Deluxe Room",
            type: "Villa",
          },
        },
      ];

      // Filter based on dates for mock data
      const now = new Date();
      let filteredData = mockData;

      if (status === "upcoming") {
        filteredData = mockData.filter(
          (item) => new Date(item.check_in_date) > now
        );
      } else if (status === "past") {
        filteredData = mockData.filter(
          (item) => new Date(item.check_out_date) < now
        );
      } else if (status === "cancelled") {
        filteredData = mockData.filter(
          (item) => item.booking_status === "cancelled"
        );
      }

      setBookings(filteredData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(activeTab);
  };

  const formatDate = (dateString: any) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderBookingItem = ({ item }: any) => (
    <Pressable
      style={styles.bookingCard}
      onPress={() => router.push("/bookings/[id]")}
    >
      <Image
        source={{ uri: item.accommodation_details.image }}
        style={styles.bookingImage}
      />
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingTitle}>
          {item.accommodation_details.name}
        </Text>
        <Text style={styles.bookingSubtitle}>
          {item.room_details.name} • {item.room_details.type}
        </Text>
        <Text style={styles.bookingAddress}>
          {item.accommodation_details.address}
        </Text>

        <View style={styles.bookingDates}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.check_in_date)}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.check_out_date)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingPrice}>${item.total_price} total</Text>
          <View
            style={[
              styles.statusBadge,
              item.booking_status === "cancelled" && styles.statusCancelled,
              item.booking_status === "pending" && styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>
              {item.booking_status.charAt(0).toUpperCase() +
                item.booking_status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
          onPress={() => setActiveTab("cancelled")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "cancelled" && styles.activeTabText,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No {activeTab} trips found</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: Platform.OS == "android" ? 30 : 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
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
  bookingImage: {
    width: "100%",
    height: 180,
  },
  bookingInfo: {
    padding: 16,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  bookingAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  bookingDates: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#e1f5e8",
  },
  statusCancelled: {
    backgroundColor: "#ffebee",
  },
  statusPending: {
    backgroundColor: "#fff8e1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  statusCancelledText: {
    color: "#c62828",
  },
  statusPendingText: {
    color: "#f9a825",
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
});

export default BookingsScreen;
