import {
  AccommodationDetails,
  accommodationsAPI,
  BookingRequest,
  Review,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Extend AccommodationDetails to include reviews
interface ExtendedAccommodationDetails extends AccommodationDetails {
  reviews: Review[];
}

// Amenity icon mapping
const amenityIcons = {
  wifi: "wifi",
  pool: "water",
  gym: "fitness",
  parking: "car",
  kitchen: "restaurant",
  tv: "tv",
};

const { width } = Dimensions.get("window");

export default function ApartmentDetail() {
  const { id } = useLocalSearchParams(); // Get the apartment ID from route params
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
    specialRequests: "",
  });
  const [paymentDetails, setPaymentDetails] = useState({
    email: "",
    paymentMethod: "card",
  });
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [apartmentData, setApartmentData] =
    useState<ExtendedAccommodationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch apartment details and reviews on component mount
  useEffect(() => {
    const fetchApartmentDetails = async () => {
      try {
        setLoading(true);
        const [accommodationResponse, reviewsResponse] = await Promise.all([
          accommodationsAPI.getAccommodation(id as string),
          accommodationsAPI.getAccommodationReviews(id as string, {
            limit: 10,
          }),
        ]);

        // Map reviews to match mock data structure
        const mappedReviews = reviewsResponse.results.map((review) => ({
          ...review,
          id: review._id,
          user: {
            name: `${review.user.first_name} ${review.user.last_name.charAt(
              0
            )}.`,
            avatar:
              review.user.profile_image_url ||
              "https://randomuser.me/api/portraits/men/1.jpg",
          },
          date: new Date(review.created_at).toISOString().split("T")[0], // Format as YYYY-MM-DD
        }));

        setApartmentData({
          ...accommodationResponse,
          reviews: mappedReviews,
          average_rating: reviewsResponse.average_rating,
          reviews_count: reviewsResponse.reviews_count,
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to load apartment details");
        setLoading(false);
        console.error("Fetch error:", err);
      }
    };

    if (id) {
      fetchApartmentDetails();
    } else {
      setError("Invalid apartment ID");
      setLoading(false);
    }
  }, [id]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleBookingChange = (name: string, value: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentChange = (name: string, value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createBooking = async () => {
    if (!apartmentData) return;
    try {
      const bookingPayload: BookingRequest = {
        accommodation_id: apartmentData._id,
        room_id: selectedRoomId,
        check_in_date: bookingDetails.checkIn,
        check_out_date: bookingDetails.checkOut,
        guests: parseInt(bookingDetails.guests),
        special_requests: bookingDetails.specialRequests,
      };
      const response = await accommodationsAPI.createBooking(bookingPayload);
      setBookingId(response._id);
      setCurrentStep(3);
    } catch (err) {
      console.error("Booking error:", err);
      setError("Failed to create booking");
    }
  };

  const initiatePayment = async () => {
    if (!bookingId) return;
    try {
      const paymentPayload = {
        booking_id: bookingId,
        payment_method: paymentDetails.paymentMethod,
        email: paymentDetails.email,
        callback_url: "app://payment-callback",
      };
      await accommodationsAPI.initiatePayment(paymentPayload);
      setCurrentStep(4);
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to initiate payment");
    }
  };

  const selectedRoom = apartmentData?.rooms.find(
    (room) => (room._id || room.name) === selectedRoomId
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#FFC107" : "#ccc"}
        />
      );
    }
    return stars;
  };

  const renderReviews = () => {
    if (!apartmentData?.reviews) return null;
    const reviewsToShow = showAllReviews
      ? apartmentData.reviews
      : apartmentData.reviews.slice(0, 2);

    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Guest Reviews</Text>
        <View style={styles.ratingSummary}>
          <Text style={styles.averageRating}>
            {apartmentData.average_rating.toFixed(1)}
          </Text>
          <View style={styles.starsContainer}>
            {renderStars(Math.round(apartmentData.average_rating))}
          </View>
          <Text style={styles.reviewsCount}>
            {apartmentData.reviews_count} reviews
          </Text>
        </View>

        {reviewsToShow.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image
                source={{ uri: review.user.avatar }}
                style={styles.avatar}
              />
              <View style={styles.reviewUserInfo}>
                <Text style={styles.reviewUserName}>{review.user.name}</Text>
                <View style={styles.reviewRating}>
                  {renderStars(review.rating)}
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewText}>{review.comment}</Text>
          </View>
        ))}

        {apartmentData.reviews.length > 2 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllReviews(!showAllReviews)}
          >
            <Text style={styles.showMoreText}>
              {showAllReviews ? "Show Less Reviews" : "Show All Reviews"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderApartmentDetails = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error || !apartmentData) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "No data available"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Trigger re-fetch by resetting the effect
              setApartmentData(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <FlatList
            data={apartmentData.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
          <View style={styles.imageDotContainer}>
            {apartmentData.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageDot,
                  {
                    backgroundColor:
                      index === 0 ? "#fff" : "rgba(255, 255, 255, 0.5)",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Apartment Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{apartmentData.name}</Text>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>
              {apartmentData.address}, {apartmentData.city},{" "}
              {apartmentData.state}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>
              {apartmentData.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewsText}>
              ({apartmentData.reviews_count} reviews)
            </Text>
          </View>

          <Text style={styles.description}>{apartmentData.description}</Text>

          {/* Contact Info */}
          <View style={styles.contactContainer}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactRow}>
              <Ionicons
                name="mail"
                size={18}
                color="#666"
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>
                {apartmentData.contact_email}
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons
                name="call"
                size={18}
                color="#666"
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>
                {apartmentData.contact_phone}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.amenitiesContainer}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {apartmentData.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityItem}>
                  <Ionicons
                    name={amenityIcons[amenity] || "home"}
                    size={20}
                    color="#555"
                    style={styles.amenityIcon}
                  />
                  <Text style={styles.amenityText}>
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          {renderReviews()}

          {/* Available Rooms */}
          <View style={styles.roomsContainer}>
            <Text style={styles.sectionTitle}>Available Rooms</Text>
            {apartmentData.rooms.map((room, index) => {
              const roomId = room._id || room.name || `room-${index}`; // Fallback ID
              return (
                <TouchableOpacity
                  key={roomId}
                  style={[
                    styles.roomCard,
                    selectedRoomId === roomId && styles.selectedRoomCard,
                  ]}
                  onPress={() => handleRoomSelect(roomId)}
                >
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomDescription}>
                      {room.description || "No description available"}
                    </Text>
                    <View style={styles.capacityContainer}>
                      <Ionicons name="people" size={16} color="#666" />
                      <Text style={styles.capacityText}>
                        Up to {room.capacity} guests
                      </Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      ${room.price_per_night}
                    </Text>
                    <Text style={styles.priceSubtext}>per night</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRoomId && styles.disabledButton,
            ]}
            disabled={!selectedRoomId}
            onPress={() => setCurrentStep(2)}
          >
            <Text style={styles.continueButtonText}>Continue to Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderBookingForm = () => (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(1)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back to Details</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Book Your Stay</Text>

        {selectedRoom && (
          <View style={styles.selectedRoomSummary}>
            <Text style={styles.selectedRoomName}>{selectedRoom.name}</Text>
            <Text style={styles.selectedRoomPrice}>
              ${selectedRoom.price_per_night} per night
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Check-in Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={bookingDetails.checkIn}
            onChangeText={(text) => handleBookingChange("checkIn", text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Check-out Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={bookingDetails.checkOut}
            onChangeText={(text) => handleBookingChange("checkOut", text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Number of Guests</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            keyboardType="numeric"
            value={bookingDetails.guests}
            onChangeText={(text) => handleBookingChange("guests", text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Special Requests</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requests or requirements?"
            multiline
            numberOfLines={4}
            value={bookingDetails.specialRequests}
            onChangeText={(text) =>
              handleBookingChange("specialRequests", text)
            }
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!bookingDetails.checkIn || !bookingDetails.checkOut) &&
              styles.disabledButton,
          ]}
          disabled={!bookingDetails.checkIn || !bookingDetails.checkOut}
          onPress={createBooking}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPaymentForm = () => (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(2)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back to Booking</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Payment Details</Text>

        <View style={styles.bookingSummary}>
          <Text style={styles.bookingSummaryTitle}>Booking Summary</Text>
          <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>
          <Text style={styles.summaryText}>
            {selectedRoom?.name} ({bookingDetails.checkIn} to{" "}
            {bookingDetails.checkOut})
          </Text>
          <Text style={styles.summaryText}>
            {bookingDetails.guests}{" "}
            {parseInt(bookingDetails.guests) === 1 ? "guest" : "guests"}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            keyboardType="email-address"
            value={paymentDetails.email}
            onChangeText={(text) => handlePaymentChange("email", text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentDetails.paymentMethod === "card" &&
                  styles.selectedPaymentMethod,
              ]}
              onPress={() => handlePaymentChange("paymentMethod", "card")}
            >
              <Ionicons
                name="card"
                size={24}
                color={
                  paymentDetails.paymentMethod === "card" ? "#fff" : "#333"
                }
              />
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentDetails.paymentMethod === "card" &&
                    styles.selectedPaymentMethodText,
                ]}
              >
                Credit Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentDetails.paymentMethod === "paypal" &&
                  styles.selectedPaymentMethod,
              ]}
              onPress={() => handlePaymentChange("paymentMethod", "paypal")}
            >
              <Ionicons
                name="logo-paypal"
                size={24}
                color={
                  paymentDetails.paymentMethod === "paypal" ? "#fff" : "#333"
                }
              />
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentDetails.paymentMethod === "paypal" &&
                    styles.selectedPaymentMethodText,
                ]}
              >
                PayPal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !paymentDetails.email && styles.disabledButton,
          ]}
          disabled={!paymentDetails.email}
          onPress={initiatePayment}
        >
          <Text style={styles.continueButtonText}>Complete Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <ScrollView style={styles.container}>
      <View style={styles.confirmationContainer}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>

        <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
        <Text style={styles.confirmationText}>
          Your booking has been successfully processed. You will receive a
          confirmation email shortly.
        </Text>

        <View style={styles.bookingSummary}>
          <Text style={styles.bookingSummaryTitle}>Booking Details</Text>
          <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>
          <Text style={styles.summaryText}>{apartmentData?.name}</Text>
          <Text style={styles.summaryText}>{selectedRoom?.name}</Text>
          <Text style={styles.summaryText}>
            Check-in: {bookingDetails.checkIn}
          </Text>
          <Text style={styles.summaryText}>
            Check-out: {bookingDetails.checkOut}
          </Text>
          <Text style={styles.summaryText}>
            Guests: {bookingDetails.guests}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.continueButtonText}>
            Return to Apartment Details
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Progress indicator
  const renderProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressSteps}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View
              style={[
                styles.progressStep,
                currentStep >= step ? styles.activeStep : {},
              ]}
            >
              <Text
                style={[
                  styles.progressStepText,
                  currentStep >= step ? styles.activeStepText : {},
                ]}
              >
                {step}
              </Text>
            </View>
            {step < 4 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step ? styles.activeProgressLine : {},
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <Text style={styles.progressText}>
        {currentStep === 1 && "Apartment Details"}
        {currentStep === 2 && "Book Room"}
        {currentStep === 3 && "Payment"}
        {currentStep === 4 && "Confirmation"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderProgressBar()}
      {currentStep === 1 && renderApartmentDetails()}
      {currentStep === 2 && renderBookingForm()}
      {currentStep === 3 && renderPaymentForm()}
      {currentStep === 4 && renderConfirmation()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
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
  progressBarContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#3498db",
  },
  progressStepText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  activeStepText: {
    color: "#fff",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#e0e0e0",
  },
  activeProgressLine: {
    backgroundColor: "#3498db",
  },
  progressText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  image: {
    width,
    height: 250,
  },
  imageDotContainer: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
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
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  contactContainer: {
    backgroundColor: "#f1f1f1",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  amenitiesContainer: {
    marginBottom: 24,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  amenityIcon: {
    marginRight: 8,
  },
  ruiText: {
    fontSize: 14,
    color: "#333",
  },
  roomsContainer: {
    marginBottom: 24,
  },
  roomCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedRoomCard: {
    borderColor: "#3498db",
    borderWidth: 2,
    backgroundColor: "#ebf7ff",
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  capacityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  priceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3498db",
  },
  priceSubtext: {
    fontSize: 12,
    color: "#666",
  },
  continueButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#b0b0b0",
    opacity: 0.7,
  },
  formContainer: {
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  selectedRoomSummary: {
    backgroundColor: "#f1f1f1",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  selectedRoomName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedRoomPrice: {
    fontSize: 14,
    color: "#3498db",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentMethod: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  selectedPaymentMethod: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  selectedPaymentMethodText: {
    color: "#fff",
  },
  bookingSummary: {
    backgroundColor: "#f1f1f1",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  bookingSummaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  confirmationContainer: {
    padding: 24,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 24,
    marginTop: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  reviewsCount: {
    fontSize: 14,
    color: "#666",
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  showMoreButton: {
    marginTop: 8,
    padding: 8,
    alignItems: "center",
  },
  showMoreText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "bold",
  },
});
