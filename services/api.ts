import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Base URL for all API requests
const BASE_URL = "https://hotel-booking-api-r5dd.onrender.com";

// Token storage key
const TOKEN_STORAGE_KEY = "hotel_auth_token";

// Axios instance with base configuration
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Types for API responses and requests
interface AuthToken {
  access_token: string;
  token_type: string;
}

interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  is_admin: boolean;
  is_active: boolean;
  profile_image_url: string | null;
  created_at: string;
}

interface RegisterUserData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  password: string;
  is_admin?: boolean;
  is_active?: boolean;
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

interface UpdateLocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface Booking {
  _id: string;
  accommodation_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  special_requests: string;
  user_id: string;
  total_price: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  accommodation_details?: AccommodationDetails;
  user_details?: UserDetails;
}

interface BookingRequest {
  accommodation_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  special_requests?: string;
}

interface PaymentInitiateRequest {
  booking_id: string;
  payment_method: string;
  email: string;
  callback_url: string;
}

interface AccommodationDetails {
  _id: string;
  name: string;
  description: string;
  accommodation_type: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  address: string;
  city: string;
  state: string;
  country: string;
  amenities: string[];
  rooms: Room[];
  images: string[];
  rating: number;
  contact_email: string;
  contact_phone: string;
  created_by?: string;
  updated_at?: string;
  average_rating?: number;
  reviews_count?: number;
}

interface Room {
  name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  images: string[];
  is_available: boolean;
}

interface UserDetails {
  _id?: string;
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  is_admin: boolean;
  is_active: boolean;
  profile_image_url: string | null;
  created_at: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user_id: string;
  accommodation_id: string;
  created_at: string;
  updated_at: string | null;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
  };
}

interface PaginatedResponse<T> {
  results: T[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

interface ReviewsResponse extends PaginatedResponse<Review> {
  average_rating: number;
  reviews_count: number;
}

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
const authAPI = {
  // Register a new user
  register: async (userData: RegisterUserData): Promise<User> => {
    const response = await api.post<User>("/api/auth/register", userData);
    return response.data;
  },

  // Login and get auth token
  login: async (email: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    formData.append("grant_type", "password");

    const response = await api.post<AuthToken>("/api/auth/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Store the token
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.data.access_token);

    return response.data;
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/api/auth/me");
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/api/auth/request-password-reset",
      { email }
    );
    return response.data;
  },

  // Logout - clear token from storage
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

// User profile API
const userAPI = {
  // Update user profile
  updateProfile: async (profileData: UpdateProfileData): Promise<User> => {
    const response = await api.patch<User>("/api/users/profile", profileData);
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (imageUri: string): Promise<User> => {
    const formData = new FormData();

    // Create file object from URI
    const fileNameMatch = imageUri.match(/[^/]+$/);
    const fileName = fileNameMatch ? fileNameMatch[0] : "profile_image.jpg";

    const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      type: fileType,
      name: fileName,
    } as any);

    const response = await api.post<User>(
      "/api/users/profile/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  // Update user location
  updateLocation: async (locationData: UpdateLocationData): Promise<User> => {
    const formData = new URLSearchParams();
    formData.append("latitude", locationData.latitude.toString());
    formData.append("longitude", locationData.longitude.toString());
    formData.append("address", locationData.address);

    const response = await api.post<User>("/api/users/location", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  },

  // Get user bookings with optional status filter
  getUserBookings: async (status?: string): Promise<Booking[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Booking[]>("/api/users/bookings", {
      params,
    });
    return response.data;
  },

  // Get a specific booking for the user
  getUserBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/api/users/bookings/${bookingId}`);
    return response.data;
  },

  // Get user's favorite accommodations
  getFavorites: async (): Promise<AccommodationDetails[]> => {
    const response = await api.get<AccommodationDetails[]>(
      "/api/users/favorites"
    );
    return response.data;
  },

  // Add accommodation to favorites
  addToFavorites: async (accommodationId: string): Promise<User> => {
    const response = await api.post<User>(
      `/api/users/favorites/${accommodationId}`
    );
    return response.data;
  },

  // Remove accommodation from favorites
  removeFromFavorites: async (accommodationId: string): Promise<User> => {
    const response = await api.delete<User>(
      `/api/users/favorites/${accommodationId}`
    );
    return response.data;
  },
};

// Bookings API
const bookingsAPI = {
  // Create a new booking
  createBooking: async (bookingData: BookingRequest): Promise<Booking> => {
    const response = await api.post<Booking>("/api/bookings/", bookingData);
    return response.data;
  },

  // Get all bookings with optional status filter
  getBookings: async (status?: string): Promise<Booking[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Booking[]>("/api/bookings/", { params });
    return response.data;
  },

  // Get a specific booking
  getBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/api/bookings/${bookingId}`);
    return response.data;
  },

  // Cancel a booking
  cancelBooking: async (bookingId: string): Promise<void> => {
    await api.delete(`/api/bookings/${bookingId}`);
  },

  // Initiate payment for a booking
  initiatePayment: async (
    paymentData: PaymentInitiateRequest
  ): Promise<any> => {
    const response = await api.post("/api/payments/initiate", paymentData);
    return response.data;
  },
};

// Accommodations API
const accommodationsAPI = {
  // Get all accommodations with filters and pagination
  getAccommodations: async (params?: {
    accommodation_type?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<PaginatedResponse<AccommodationDetails>> => {
    const response = await api.get<PaginatedResponse<AccommodationDetails>>(
      "/api/accommodations/",
      { params }
    );
    return response.data;
  },

  // Get accommodations by type
  getAccommodationsByType: async (
    type: "hotels" | "apartments" | "hostels" | "lodges",
    params?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    }
  ): Promise<PaginatedResponse<AccommodationDetails>> => {
    const response = await api.get<PaginatedResponse<AccommodationDetails>>(
      `/api/accommodations/${type}`,
      { params }
    );
    return response.data;
  },

  // Get accommodations near a location
  getNearbyAccommodations: async (params: {
    latitude: number;
    longitude: number;
    distance: number; // in meters
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AccommodationDetails>> => {
    const response = await api.get<PaginatedResponse<AccommodationDetails>>(
      "/api/accommodations/near-me",
      { params }
    );
    return response.data;
  },

  // Search accommodations
  searchAccommodations: async (params: {
    query: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AccommodationDetails>> => {
    const response = await api.get<PaginatedResponse<AccommodationDetails>>(
      "/api/accommodations/search",
      { params }
    );
    return response.data;
  },

  // Get popular accommodations
  getPopularAccommodations: async (
    limit?: number
  ): Promise<AccommodationDetails[]> => {
    const params = limit ? { limit } : {};
    const response = await api.get<AccommodationDetails[]>(
      "/api/accommodations/popular",
      { params }
    );
    return response.data;
  },

  // Get trending accommodations
  getTrendingAccommodations: async (params?: {
    days?: number;
    limit?: number;
  }): Promise<AccommodationDetails[]> => {
    const response = await api.get<AccommodationDetails[]>(
      "/api/accommodations/trending",
      { params }
    );
    return response.data;
  },

  // Get recommended accommodations
  getRecommendedAccommodations: async (
    limit?: number
  ): Promise<AccommodationDetails[]> => {
    const params = limit ? { limit } : {};
    const response = await api.get<AccommodationDetails[]>(
      "/api/accommodations/recommended",
      { params }
    );
    return response.data;
  },

  // Get a specific accommodation by ID
  getAccommodation: async (id: string): Promise<AccommodationDetails> => {
    const response = await api.get<AccommodationDetails>(
      `/api/accommodations/${id}`
    );
    return response.data;
  },

  // Get reviews for an accommodation
  getAccommodationReviews: async (
    accommodationId: string,
    params?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    }
  ): Promise<ReviewsResponse> => {
    const response = await api.get<ReviewsResponse>(
      `/api/accommodations/${accommodationId}/reviews`,
      { params }
    );
    return response.data;
  },

  // Create a review for an accommodation
  createReview: async (
    accommodationId: string,
    reviewData: {
      rating: number;
      comment: string;
    }
  ): Promise<Review> => {
    const response = await api.post<Review>(
      `/api/accommodations/${accommodationId}/reviews`,
      reviewData
    );
    return response.data;
  },

  // Get list of cities with accommodations
  getCitiesList: async (): Promise<string[]> => {
    const response = await api.get<string[]>("/api/accommodations/cities/list");
    return response.data;
  },

  // Get list of countries with accommodations
  getCountriesList: async (): Promise<string[]> => {
    const response = await api.get<string[]>(
      "/api/accommodations/countries/list"
    );
    return response.data;
  },

  addToFavorites: async (accommodationId: string): Promise<void> => {
    await api.post(`/api/users/favorites/${accommodationId}`);
  },

  removeFromFavorites: async (accommodationId: string): Promise<void> => {
    await api.delete(`/api/users/favorites/${accommodationId}`);
  },

  getFavorites: async (): Promise<AccommodationDetails[]> => {
    const response = await api.get("/api/users/favorites");
    return response.data;
  },
};

// Utility functions for token management
const tokenUtils = {
  // Check if user is authenticated (has token)
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return !!token;
  },

  // Get the stored token
  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  },
};

// Export all API modules
export { accommodationsAPI, authAPI, bookingsAPI, tokenUtils, userAPI };

// Export types
export type {
  AccommodationDetails,
  Booking,
  BookingRequest,
  PaginatedResponse,
  PaymentInitiateRequest,
  RegisterUserData,
  Review,
  ReviewsResponse,
  Room,
  UpdateLocationData,
  UpdateProfileData,
  User,
};
