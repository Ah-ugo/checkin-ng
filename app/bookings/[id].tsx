import { useAuth } from "@/context/AuthContext";
import { api, bookingsAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BookingDetailsScreen = () => {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    special_requests: "",
  });

  useEffect(() => {
    if (!user) {
      setError("Please log in to view booking details");
      setIsLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bookingsAPI.getBooking(id);
        setBooking(response);
        setEditForm({ special_requests: response.special_requests || "" });
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id, user]);

  const formatDate = (dateString: any) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCancelBooking = async () => {
    setIsLoading(true);
    try {
      await bookingsAPI.cancelBooking(booking._id);
      setBooking((prev) => ({
        ...prev,
        booking_status: "cancelled",
        payment_status: "refunded",
      }));
      setShowCancelModal(false);
      Alert.alert("Success", "Your booking has been cancelled successfully");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      Alert.alert("Error", "Failed to cancel booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBooking = async () => {
    setIsLoading(true);
    try {
      // Custom PATCH request since bookingsAPI doesn't have updateBooking
      await api.patch(`/api/bookings/${booking._id}`, {
        special_requests: editForm.special_requests,
      });
      setBooking((prev) => ({
        ...prev,
        special_requests: editForm.special_requests,
      }));
      setShowEditModal(false);
      Alert.alert("Success", "Your booking has been updated successfully");
    } catch (err) {
      console.error("Error updating booking:", err);
      Alert.alert("Error", "Failed to update booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Booking not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                booking.accommodation_details.images[0] ||
                "https://via.placeholder.com/800/500",
            }}
            style={styles.mainImage}
          />
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              booking.booking_status === "cancelled" && styles.statusCancelled,
              booking.booking_status === "pending" && styles.statusPending,
            ]}
          >
            <Text style={styles.statusText}>
              {booking.booking_status.toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              booking.payment_status === "paid" && styles.statusPaid,
              booking.payment_status === "pending" &&
                styles.statusPendingPayment,
              booking.payment_status === "refunded" && styles.statusRefunded,
            ]}
          >
            <Text style={styles.statusText}>
              {booking.payment_status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.propertyName}>
            {booking.accommodation_details.name}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>
              {booking.accommodation_details.address},{" "}
              {booking.accommodation_details.city}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>
              {booking.accommodation_details.rating || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Room Type:</Text>
            <Text style={styles.summaryValue}>
              {booking.accommodation_details.rooms[0]?.name || "Unknown"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-in:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(booking.check_in_date)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-out:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(booking.check_out_date)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{calculateNights()} nights</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Guests:</Text>
            <Text style={styles.summaryValue}>
              {booking.guests} {booking.guests > 1 ? "guests" : "guest"}
            </Text>
          </View>
          {booking.special_requests && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Special Requests:</Text>
              <Text style={styles.summaryValue}>
                {booking.special_requests}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ${booking.accommodation_details.rooms[0]?.price_per_night || 0} x{" "}
              {calculateNights()} nights
            </Text>
            <Text style={styles.priceValue}>
              $
              {(booking.accommodation_details.rooms[0]?.price_per_night || 0) *
                calculateNights()}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Fees</Text>
            <Text style={styles.priceValue}>$50</Text>
          </View>
          <View style={styles.totalPriceRow}>
            <Text style={styles.totalPriceLabel}>Total</Text>
            <Text style={styles.totalPriceValue}>${booking.total_price}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.contactText}>
              {booking.user_details.first_name} {booking.user_details.last_name}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color="#666" />
            <Text style={styles.contactText}>{booking.user_details.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color="#666" />
            <Text style={styles.contactText}>
              {booking.user_details.phone_number}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {booking.accommodation_details.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons
                  name={
                    amenity === "wifi"
                      ? "wifi"
                      : amenity === "pool"
                      ? "water"
                      : amenity === "gym"
                      ? "fitness"
                      : amenity === "spa"
                      ? "spa"
                      : amenity === "restaurant"
                      ? "restaurant"
                      : "home"
                  }
                  size={20}
                  color="#3498db"
                />
                <Text style={styles.amenityText}>
                  {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {booking.booking_status !== "cancelled" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setShowCancelModal(true)}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setShowEditModal(true)}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>Modify Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCancelModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this booking?
              {booking.payment_status === "paid" &&
                " A refund will be processed."}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCancelModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelBooking}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    Confirm Cancellation
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Booking</Text>

            <Text style={styles.inputLabel}>Special Requests</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={editForm.special_requests}
              onChangeText={(text) =>
                setEditForm({ ...editForm, special_requests: text })
              }
              placeholder="Any special requests or requirements?"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowEditModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleUpdateBooking}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  imageContainer: {
    height: 220,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e1f5e8",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  statusCancelled: {
    backgroundColor: "#ffebee",
  },
  statusPending: {
    backgroundColor: "#fff8e1",
  },
  statusPaid: {
    backgroundColor: "#e1f5e8",
  },
  statusPendingPayment: {
    backgroundColor: "#fff8e1",
  },
  statusRefunded: {
    backgroundColor: "#e3f2fd",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  propertyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#333",
  },
  totalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  amenityText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff4444",
    marginRight: 8,
  },
  editButton: {
    backgroundColor: "#3498db",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
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
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#e0e0e0",
    marginRight: 8,
  },
  modalConfirmButton: {
    backgroundColor: "#3498db",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
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
});

export default BookingDetailsScreen;
