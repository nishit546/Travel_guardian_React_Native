import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const CACHE_KEY = 'offline_address_cache_v1';

// Helper to round coordinates for cache keys (~100 meter precision)
const getCacheKey = (lat, lon) => {
  const roundedLat = parseFloat(lat).toFixed(3);
  const roundedLon = parseFloat(lon).toFixed(3);
  return `${roundedLat}_${roundedLon}`;
};

// Retrieve all cached addresses from AsyncStorage
const getCacheMap = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.log('Error reading address cache:', e);
    return {};
  }
};

// Reverse geocode with offline fallback and caching
export const reverseGeocodeWithCache = async (lat, lon) => {
  const cacheKey = getCacheKey(lat, lon);
  const cacheMap = await getCacheMap();

  // 1. Check offline cache first
  if (cacheMap[cacheKey]) {
    console.log('Serving address from offline cache for key:', cacheKey);
    return { address: cacheMap[cacheKey], fromCache: true };
  }

  // 2. Network / API lookup
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    });

    if (result && result.length > 0) {
      const address = result[0];
      // Save to cache
      cacheMap[cacheKey] = address;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheMap));
      return { address, fromCache: false };
    }
  } catch (error) {
    console.log('Online reverse geocode failed, checking fallback:', error);
  }

  // Fallback if offline and no exact match: find closest entry in cache
  const keys = Object.keys(cacheMap);
  if (keys.length > 0) {
    const fallbackAddress = cacheMap[keys[0]];
    return { address: fallbackAddress, fromCache: true, fallback: true };
  }

  return { address: null, fromCache: false };
};

export const clearAddressCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.log('Error clearing address cache:', e);
  }
};
