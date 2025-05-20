import { useAuth } from "@/context/AuthContext";
import { userAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
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
import MapView, { Marker } from "react-native-maps";

const ProfileScreen = () => {
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    location: { address: "" },
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 5,
    longitude: 7,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (user) {
      setEditForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        location: { address: user.location?.address || "" },
      });
      if (user.location?.coordinates?.length === 2) {
        setMapRegion({
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0],
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    }
  }, [user]);

  const handleUpdateProfileImage = async () => {
    if (!user) {
      setError("Please log in to update your profile image");
      return;
    }

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
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        });
        await userAPI.uploadProfileImage(formData);
        await refreshUser();
        Alert.alert("Success", "Profile picture updated");
      }
    } catch (err) {
      console.error("Error updating profile image:", err);
      Alert.alert("Error", "Failed to update profile image");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = geocode[0]
        ? `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${
            geocode[0].country || ""
          }`
        : `${latitude}, ${longitude}`;

      setSelectedLocation({
        coordinates: [longitude, latitude],
        address: address.trim(),
      });

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      setShowLocationModal(false);
      setShowMapModal(true);
    } catch (err) {
      console.error("Error getting location:", err);
      Alert.alert("Error", "Failed to get location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = geocode[0]
        ? `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${
            geocode[0].country || ""
          }`
        : `Selected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

      setSelectedLocation({
        coordinates: [longitude, latitude],
        address: address.trim(),
      });
    } catch (err) {
      console.error("Error reverse geocoding:", err);
      setSelectedLocation({
        coordinates: [longitude, latitude],
        address: `Selected Location (${latitude.toFixed(
          4
        )}, ${longitude.toFixed(4)})`,
      });
    }
  };

  const saveLocation = async () => {
    if (!user) {
      setError("Please log in to update your location");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    try {
      setIsUpdating(true);
      await userAPI.updateLocation({
        latitude: selectedLocation.coordinates[1],
        longitude: selectedLocation.coordinates[0],
        address: selectedLocation.address,
      });
      await refreshUser();
      setShowMapModal(false);
      Alert.alert("Success", "Location updated");
    } catch (err) {
      console.error("Error updating location:", err);
      Alert.alert("Error", "Failed to update location");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      setError("Please log in to update your profile");
      return;
    }

    try {
      setIsUpdating(true);
      const updateData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone_number,
        location: {
          type: "Point",
          coordinates: user.location?.coordinates || [0, 0],
          address: editForm.location.address,
        },
      };
      await userAPI.updateProfile(updateData);
      await refreshUser();
      setShowEditModal(false);
      Alert.alert("Success", "Profile updated");
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth/LoginScreen");
    } catch (err) {
      console.error("Error logging out:", err);
      Alert.alert("Error", "Failed to log out");
    }
  };

  const formatDate = (dateString: any) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Please log in to view your profile"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push("/auth/LoginScreen")}
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.profilePictureContainer}>
          <TouchableOpacity onPress={handleUpdateProfileImage}>
            <View style={styles.profileImageContainer}>
              {user.profile_image_url ? (
                <Image
                  source={{ uri: user.profile_image_url }}
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
            {user.first_name} {user.last_name}
          </Text>
          {user.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

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
              <Text style={styles.infoValue}>{user.email}</Text>
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
              <Text style={styles.infoValue}>
                {user.phone_number || "Not set"}
              </Text>
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
              <Text style={styles.infoValue}>
                {user.location?.address || "Not set"}
              </Text>
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
                {formatDate(user.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

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
  scrollContainer: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    marginTop: Platform.OS == "android" ? 30 : 0,
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
