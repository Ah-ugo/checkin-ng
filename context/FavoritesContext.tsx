import { useAuth } from "@/context/AuthContext";
import { accommodationsAPI } from "@/services/api";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface FavoritesContextType {
  favorites: string[];
  isFavorited: (accommodationId: string) => boolean;
  addFavorite: (accommodationId: string) => Promise<void>;
  removeFavorite: (accommodationId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

// In-memory cache for favorites
let cachedFavorites: string[] = [];
let lastFavoritesFetch = 0;

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(cachedFavorites);

  const fetchFavorites = async () => {
    if (!user) return;
    // Skip if recently fetched (5 minutes)
    if (lastFavoritesFetch > Date.now() - 300000) {
      setFavorites(cachedFavorites);
      return;
    }
    try {
      const favoriteAccommodations = await accommodationsAPI.getFavorites();
      const favoriteIds = favoriteAccommodations.map((item) => item._id);
      setFavorites((prev) =>
        JSON.stringify(prev) !== JSON.stringify(favoriteIds)
          ? favoriteIds
          : prev
      );
      cachedFavorites = favoriteIds;
      lastFavoritesFetch = Date.now();
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const isFavorited = useMemo(
    () => (accommodationId: string) => favorites.includes(accommodationId),
    [favorites]
  );

  const addFavorite = async (accommodationId: string) => {
    try {
      await accommodationsAPI.addToFavorites(accommodationId);
      setFavorites((prev) => {
        if (!prev.includes(accommodationId)) {
          const newFavorites = [...prev, accommodationId];
          cachedFavorites = newFavorites;
          return newFavorites;
        }
        return prev;
      });
    } catch (err) {
      console.error("Error adding favorite:", err);
      throw err;
    }
  };

  const removeFavorite = async (accommodationId: string) => {
    try {
      await accommodationsAPI.removeFromFavorites(accommodationId);
      setFavorites((prev) => {
        const newFavorites = prev.filter((id) => id !== accommodationId);
        cachedFavorites = newFavorites;
        return newFavorites;
      });
    } catch (err) {
      console.error("Error removing favorite:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      cachedFavorites = [];
      lastFavoritesFetch = 0;
    }
  }, [user]);

  const value = useMemo(
    () => ({
      favorites,
      isFavorited,
      addFavorite,
      removeFavorite,
      fetchFavorites,
    }),
    [favorites, isFavorited]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
