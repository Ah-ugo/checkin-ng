import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const ProfileScreen = ({ navigation }) => {
  // User data state
  const [userData, setUserData] = useState({
    email: "user@example.com",
    first_name: "John",
    last_name: "Doe",
    phone_number: "+1 (555) 123-4567",
    location: {
      type: "Point",
      coordinates: [0, 0],
      address: "123 Main St, New York, NY",
    },
    is_admin: false,
    is_active: true,
    _id: "6824cbc75f70fd179f0a947a",
    profile_image_url: "https://randomuser.me/api/portraits/men/1.jpg",
    created_at: "2025-05-14T16:58:47.755000",
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    location: { address: "" },
  });

  // Location states
  const [mapRegion, setMapRegion] = useState({
    latitude: 5,
    longitude: 7,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/me', {
      //   headers: {
      //     'Authorization': `Bearer ${userToken}`
      //   }
      // });
      // const data = await response.json();
      // setUserData(data);

      // Initialize edit form with current data
      setEditForm({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        location: { address: userData.location.address },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Handle profile image update
  const handleUpdateProfileImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Need access to photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsLoading(true);
        // TODO: Implement actual image upload
        // const formData = new FormData();
        // formData.append('file', {
        //   uri: result.uri,
        //   type: 'image/jpeg',
        //   name: 'profile.jpg'
        // });

        // const response = await fetch('/api/users/profile/image', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'multipart/form-data',
        //     'Authorization': `Bearer ${userToken}`
        //   },
        //   body: formData
        // });

        // Update local state
        setUserData((prev) => ({
          ...prev,
          profile_image_url: result.assets[0].uri,
        }));
        Alert.alert("Success", "Profile picture updated");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update image");
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let address = geocode[0]?.name || `${latitude}, ${longitude}`;

      setSelectedLocation({
        coordinates: [longitude, latitude],
        address,
      });

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      setShowLocationModal(false);
      setShowMapModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map press to select location
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({
      coordinates: [longitude, latitude],
      address: `Selected Location (${latitude.toFixed(4)}, ${longitude.toFixed(
        4
      )})`,
    });
  };

  // Save location to profile
  const saveLocation = async () => {
    if (!selectedLocation) return;

    try {
      setIsUpdating(true);
      // TODO: Implement actual API call
      // const formData = new URLSearchParams();
      // formData.append('latitude', selectedLocation.coordinates[1]);
      // formData.append('longitude', selectedLocation.coordinates[0]);
      // formData.append('address', selectedLocation.address);

      // const response = await fetch('/api/users/location', {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //     'Authorization': `Bearer ${userToken}`
      //   },
      //   body: formData
      // });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        location: {
          type: "Point",
          coordinates: selectedLocation.coordinates,
          address: selectedLocation.address,
        },
      }));

      setEditForm((prev) => ({
        ...prev,
        location: { address: selectedLocation.address },
      }));

      setShowMapModal(false);
      Alert.alert("Success", "Location updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update location");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update profile information
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      // TODO: Implement actual API call
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}`
      //   },
      //   body: JSON.stringify({
      //     first_name: editForm.first_name,
      //     last_name: editForm.last_name,
      //     phone_number: editForm.phone_number,
      //     location: {
      //       type: "Point",
      //       coordinates: userData.location.coordinates,
      //       address: editForm.location.address
      //     }
      //   })
      // });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone_number,
        location: {
          ...prev.location,
          address: editForm.location.address,
        },
      }));

      setShowEditModal(false);
      Alert.alert("Success", "Profile updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity onPress={handleUpdateProfileImage}>
            <View style={styles.profileImageContainer}>
              {userData.profile_image_url ? (
                <Image
                  source={{ uri: userData.profile_image_url }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person" size={60} color="#666" />
              )}
              <View style={styles.editImageIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>
            {userData.first_name} {userData.last_name}
          </Text>
          {userData.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.profileSection}>
          <View style={styles.infoRow}>
            <Ionicons
              name="mail"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="call"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData.phone_number}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{userData.location.address}</Text>
              <TouchableOpacity
                style={styles.changeLocationButton}
                onPress={() => setShowLocationModal(true)}
              >
                <Text style={styles.changeLocationButtonText}>
                  Change Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {formatDate(userData.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Location Options Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Location</Text>

            <TouchableOpacity
              style={styles.locationOption}
              onPress={getCurrentLocation}
            >
              <Ionicons name="navigate" size={24} color="#3498db" />
              <Text style={styles.locationOptionText}>
                Use Current Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationOption}
              onPress={() => {
                setShowLocationModal(false);
                setShowMapModal(true);
              }}
            >
              <Ionicons name="map" size={24} color="#3498db" />
              <Text style={styles.locationOptionText}>Select from Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Map Selection Modal */}
      <Modal visible={showMapModal} transparent={false} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.coordinates[1],
                  longitude: selectedLocation.coordinates[0],
                }}
                title="Selected Location"
              />
            )}
          </MapView>

          <View style={styles.mapControls}>
            <Text style={styles.selectedLocationText}>
              {selectedLocation?.address ||
                "Tap on the map to select a location"}
            </Text>

            <View style={styles.mapButtons}>
              <TouchableOpacity
                style={[styles.mapButton, styles.mapCancelButton]}
                onPress={() => {
                  setShowMapModal(false);
                  setSelectedLocation(null);
                }}
              >
                <Text style={styles.mapButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapButton, styles.mapConfirmButton]}
                onPress={saveLocation}
                disabled={!selectedLocation || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.mapButtonText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.first_name}
              onChangeText={(text) =>
                setEditForm({ ...editForm, first_name: text })
              }
              placeholder="First Name"
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.last_name}
              onChangeText={(text) =>
                setEditForm({ ...editForm, last_name: text })
              }
              placeholder="Last Name"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.phone_number}
              onChangeText={(text) =>
                setEditForm({ ...editForm, phone_number: text })
              }
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.location.address}
              onChangeText={(text) =>
                setEditForm({
                  ...editForm,
                  location: { ...editForm.location, address: text },
                })
              }
              placeholder="Address"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profilePictureContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editImageIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3498db",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileSection: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  changeLocationButton: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#f0f8ff",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  changeLocationButtonText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#3498db",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
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
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedLocationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  mapButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mapButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  mapCancelButton: {
    backgroundColor: "#e0e0e0",
    marginRight: 8,
  },
  mapConfirmButton: {
    backgroundColor: "#3498db",
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ProfileScreen;
