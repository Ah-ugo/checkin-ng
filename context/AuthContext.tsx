import { authAPI, tokenUtils } from "@/services/api";
import { router } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isTokenValid = await tokenUtils.isAuthenticated();
        if (isTokenValid) {
          try {
            const userProfile = await authAPI.getCurrentUser();
            setUser((prev: any) =>
              JSON.stringify(prev) !== JSON.stringify(userProfile)
                ? userProfile
                : prev
            );
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to get user profile:", error);
            await authAPI.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authAPI.login(email, password);
      const userProfile = await authAPI.getCurrentUser();
      setUser(userProfile);
      setIsAuthenticated(true);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      setUser(null);
      router.replace("/auth/LoginScreen");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!isAuthenticated) return;
    try {
      const userProfile = await authAPI.getCurrentUser();
      setUser((prev: any) =>
        JSON.stringify(prev) !== JSON.stringify(userProfile)
          ? userProfile
          : prev
      );
    } catch (error) {
      console.error("Failed to refresh user:", error);
      await logout();
    }
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      refreshUser,
      isLoading,
    }),
    [isAuthenticated, user, isLoading]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
