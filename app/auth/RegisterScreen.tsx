import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, HelperText, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");

  // Location data
  const [location, setLocation] = useState({
    type: "Point",
    coordinates: [0, 0],
    address: "",
  });

  // Form validation
  const [errors, setErrors] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    location: "",
  });

  const router = useRouter();
  const navigation = useNavigation();

  // Get current location
  const getCurrentLocation = async () => {
    setLocationFetching(true);

    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setErrors({
        ...errors,
        location: "Permission to access location was denied",
      });
      setLocationFetching(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse && addressResponse.length > 0) {
        const addressObj = addressResponse[0];
        const formattedAddress = `${addressObj.street || ""} ${
          addressObj.name || ""
        }, ${addressObj.city || ""}, ${addressObj.region || ""}, ${
          addressObj.country || ""
        }`;

        setAddress(formattedAddress);
        setLocation({
          type: "Point",
          coordinates: [longitude, latitude],
          address: formattedAddress,
        });
      }
    } catch (error: any) {
      setErrors({
        ...errors,
        location: "Error fetching location: " + error.message,
      });
    } finally {
      setLocationFetching(false);
    }
  };

  // Handle map location selection
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setLocation({
      ...location,
      coordinates: [longitude, latitude],
    });

    // You would typically use reverse geocoding here to get the address
    // This is a simplified example
    Location.reverseGeocodeAsync({
      latitude,
      longitude,
    }).then((addressResponse) => {
      if (addressResponse && addressResponse.length > 0) {
        const addressObj = addressResponse[0];
        const formattedAddress = `${addressObj.street || ""} ${
          addressObj.name || ""
        }, ${addressObj.city || ""}, ${addressObj.region || ""}, ${
          addressObj.country || ""
        }`;

        setAddress(formattedAddress);
        setLocation({
          type: "Point",
          coordinates: [longitude, latitude],
          address: formattedAddress,
        });
      }
    });
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    } else {
      newErrors.email = "";
    }

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    } else {
      newErrors.firstName = "";
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    } else {
      newErrors.lastName = "";
    }

    // Phone number validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else {
      newErrors.phoneNumber = "";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else {
      newErrors.password = "";
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    } else {
      newErrors.confirmPassword = "";
    }

    // Location validation
    if (location.coordinates[0] === 0 && location.coordinates[1] === 0) {
      newErrors.location = "Please select your location";
      isValid = false;
    } else {
      newErrors.location = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle registration
  const handleRegister = () => {
    if (validateForm()) {
      setLoading(true);

      // Prepare payload for API
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        location: {
          type: "Point",
          coordinates: location.coordinates,
          address: location.address || address,
        },
        is_admin: false,
        is_active: true,
        password,
      };

      console.log("Registration payload:", payload);

      // Here you would make the API call
      // For this example, we'll just simulate a delay
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          "Registration Successful",
          "Your account has been created successfully!",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }, 2000);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 30,
    },
    headerContainer: {
      marginTop: 20,
      marginBottom: 20,
      alignItems: "center",
      paddingHorizontal: 24,
    },
    headerText: {
      fontFamily: "InterBold",
      fontSize: 28,
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    subHeaderText: {
      fontFamily: "InterRegular",
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: "center",
    },
    formContainer: {
      paddingHorizontal: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      height: 56,
    },
    inputOutline: {
      borderRadius: 12,
      borderWidth: 1.5,
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    halfWidthInput: {
      width: "48%",
    },
    locationContainer: {
      marginTop: 16,
      marginBottom: 24,
    },
    locationHeader: {
      fontFamily: "InterMedium",
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    locationOptionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    locationButton: {
      flex: 1,
      marginHorizontal: 4,
      borderRadius: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    locationButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    locationButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    locationButtonText: {
      fontFamily: "InterMedium",
      fontSize: 14,
      marginLeft: 6,
      color: theme.colors.onSurface,
    },
    locationButtonTextActive: {
      color: theme.colors.primary,
    },
    mapContainer: {
      height: 200,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    map: {
      width: "100%",
      height: "100%",
    },
    addressInput: {
      marginTop: 8,
    },
    registerButton: {
      marginTop: 24,
      borderRadius: 12,
      paddingVertical: 6,
      elevation: 2,
    },
    registerButtonLabel: {
      fontFamily: "InterSemiBold",
      fontSize: 16,
      paddingVertical: 4,
      letterSpacing: 0.5,
    },
    loginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      marginBottom: 16,
    },
    loginText: {
      fontFamily: "InterRegular",
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    loginLink: {
      fontFamily: "InterSemiBold",
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Create Account</Text>
            <Text style={styles.subHeaderText}>Sign up to get started</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Email address"
                value={email}
                mode="outlined"
                outlineStyle={[
                  styles.inputOutline,
                  {
                    borderColor: errors.email
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
                left={
                  <TextInput.Icon
                    color={
                      errors.email ? theme.colors.error : theme.colors.primary
                    }
                    icon="email-outline"
                  />
                }
                onChangeText={setEmail}
                style={styles.textInput}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!errors.email}
              />
              {errors.email ? (
                <HelperText type="error">{errors.email}</HelperText>
              ) : null}
            </View>

            {/* Name Inputs - Row */}
            <View style={[styles.rowContainer, styles.inputGroup]}>
              <View style={styles.halfWidthInput}>
                <TextInput
                  label="First Name"
                  value={firstName}
                  mode="outlined"
                  outlineStyle={[
                    styles.inputOutline,
                    {
                      borderColor: errors.firstName
                        ? theme.colors.error
                        : theme.colors.primary,
                    },
                  ]}
                  left={
                    <TextInput.Icon
                      color={
                        errors.firstName
                          ? theme.colors.error
                          : theme.colors.primary
                      }
                      icon="account-outline"
                    />
                  }
                  onChangeText={setFirstName}
                  style={styles.textInput}
                  error={!!errors.firstName}
                />
                {errors.firstName ? (
                  <HelperText type="error">{errors.firstName}</HelperText>
                ) : null}
              </View>

              <View style={styles.halfWidthInput}>
                <TextInput
                  label="Last Name"
                  value={lastName}
                  mode="outlined"
                  outlineStyle={[
                    styles.inputOutline,
                    {
                      borderColor: errors.lastName
                        ? theme.colors.error
                        : theme.colors.primary,
                    },
                  ]}
                  onChangeText={setLastName}
                  style={styles.textInput}
                  error={!!errors.lastName}
                />
                {errors.lastName ? (
                  <HelperText type="error">{errors.lastName}</HelperText>
                ) : null}
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Phone Number"
                value={phoneNumber}
                mode="outlined"
                outlineStyle={[
                  styles.inputOutline,
                  {
                    borderColor: errors.phoneNumber
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
                left={
                  <TextInput.Icon
                    color={
                      errors.phoneNumber
                        ? theme.colors.error
                        : theme.colors.primary
                    }
                    icon="phone-outline"
                  />
                }
                onChangeText={setPhoneNumber}
                style={styles.textInput}
                keyboardType="phone-pad"
                error={!!errors.phoneNumber}
              />
              {errors.phoneNumber ? (
                <HelperText type="error">{errors.phoneNumber}</HelperText>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Password"
                value={password}
                mode="outlined"
                outlineStyle={[
                  styles.inputOutline,
                  {
                    borderColor: errors.password
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
                left={
                  <TextInput.Icon
                    color={
                      errors.password
                        ? theme.colors.error
                        : theme.colors.primary
                    }
                    icon="lock-outline"
                  />
                }
                right={
                  <TextInput.Icon
                    color={theme.colors.primary}
                    icon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.textInput}
                error={!!errors.password}
              />
              {errors.password ? (
                <HelperText type="error">{errors.password}</HelperText>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                mode="outlined"
                outlineStyle={[
                  styles.inputOutline,
                  {
                    borderColor: errors.confirmPassword
                      ? theme.colors.error
                      : theme.colors.primary,
                  },
                ]}
                left={
                  <TextInput.Icon
                    color={
                      errors.confirmPassword
                        ? theme.colors.error
                        : theme.colors.primary
                    }
                    icon="lock-check-outline"
                  />
                }
                right={
                  <TextInput.Icon
                    color={theme.colors.primary}
                    icon={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.textInput}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword ? (
                <HelperText type="error">{errors.confirmPassword}</HelperText>
              ) : null}
            </View>

            {/* Location Section */}
            <View style={styles.locationContainer}>
              <Text style={styles.locationHeader}>Location</Text>

              <View style={styles.locationOptionsContainer}>
                <Button
                  mode="outlined"
                  style={[
                    styles.locationButton,
                    !showMap && styles.locationButtonActive,
                  ]}
                  onPress={() => {
                    setShowMap(false);
                    getCurrentLocation();
                  }}
                  loading={locationFetching}
                  disabled={locationFetching}
                >
                  <View style={styles.locationButtonContent}>
                    <MaterialIcons
                      name="my-location"
                      size={18}
                      color={
                        !showMap ? theme.colors.primary : theme.colors.onSurface
                      }
                    />
                    <Text
                      style={[
                        styles.locationButtonText,
                        !showMap && styles.locationButtonTextActive,
                      ]}
                    >
                      Current Location
                    </Text>
                  </View>
                </Button>

                <Button
                  mode="outlined"
                  style={[
                    styles.locationButton,
                    showMap && styles.locationButtonActive,
                  ]}
                  onPress={() => setShowMap(true)}
                >
                  <View style={styles.locationButtonContent}>
                    <MaterialIcons
                      name="map"
                      size={18}
                      color={
                        showMap ? theme.colors.primary : theme.colors.onSurface
                      }
                    />
                    <Text
                      style={[
                        styles.locationButtonText,
                        showMap && styles.locationButtonTextActive,
                      ]}
                    >
                      Pick on Map
                    </Text>
                  </View>
                </Button>
              </View>

              {showMap && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: location.coordinates[1] || 37.78825,
                      longitude: location.coordinates[0] || -122.4324,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    onPress={handleMapPress}
                  >
                    {location.coordinates[0] !== 0 &&
                      location.coordinates[1] !== 0 && (
                        <Marker
                          coordinate={{
                            latitude: location.coordinates[1],
                            longitude: location.coordinates[0],
                          }}
                        />
                      )}
                  </MapView>
                </View>
              )}

              <TextInput
                label="Address"
                value={address}
                mode="outlined"
                outlineStyle={[
                  styles.inputOutline,
                  { borderColor: theme.colors.primary },
                ]}
                left={
                  <TextInput.Icon
                    color={theme.colors.primary}
                    icon="map-marker-outline"
                  />
                }
                onChangeText={(text) => {
                  setAddress(text);
                  setLocation({
                    ...location,
                    address: text,
                  });
                }}
                style={[styles.textInput, styles.addressInput]}
                error={!!errors.location}
              />
              {errors.location ? (
                <HelperText type="error">{errors.location}</HelperText>
              ) : null}
            </View>

            {/* Register Button */}
            <Button
              mode="contained"
              labelStyle={styles.registerButtonLabel}
              style={styles.registerButton}
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
            >
              Create Account
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation && navigation.goBack()}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
