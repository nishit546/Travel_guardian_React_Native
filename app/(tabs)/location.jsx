import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Share,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocodeWithCache } from '@/utils/address-cache';

const LocationScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationType, setLocationType] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [calculatedDist, setCalculatedDist] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const headingSubscriptionRef = useRef(null);
  const liveTrackingSubscriptionRef = useRef(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [searchText, setSearchText] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    if (location) {
      await geoCoding();
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to access GPS data.');
        return;
      }

      const lastLoc = await Location.getLastKnownPositionAsync();
      if (lastLoc) {
        setLocation(lastLoc);
        setLocationType('Last Known Location');
      }

      const currLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currLoc);
      setLocationType('Current Location');
    } catch (error) {
      console.log('Location fetch error:', error);
      Alert.alert('Location Error', 'Unable to fetch current location.');
    }
  };

  const startTracking = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission.');
        return;
      }

      setIsTracking(true);
      liveTrackingSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (newLoc) => {
          setLocation(newLoc);
          setLocationType('Live Tracking');
          setLocationHistory((prev) => [newLoc, ...prev.slice(0, 9)]);
        }
      );
    } catch (error) {
      console.log('Tracking error:', error);
      setIsTracking(false);
      Alert.alert('Tracking Error', 'Could not start live tracking.');
    }
  };

  const stopTracking = () => {
    if (liveTrackingSubscriptionRef.current) {
      liveTrackingSubscriptionRef.current.remove();
      liveTrackingSubscriptionRef.current = null;
    }
    setIsTracking(false);
  };

  const geoCoding = async () => {
    if (!location) {
      Alert.alert('No Location', 'Please get your current location first.');
      return;
    }
    try {
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      // Use offline address cache
      const { address: cachedAddr } = await reverseGeocodeWithCache(lat, lon);
      if (cachedAddr) {
        setAddress(cachedAddr);
      }
    } catch (_error) {
      Alert.alert('Geocoding Error', 'Failed to reverse geocode location.');
    }
  };

  const startCompass = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for compass.');
        return;
      }
      headingSubscriptionRef.current = await Location.watchHeadingAsync((data) => {
        setHeading(Math.round(data.trueHeading || data.magHeading));
      });
    } catch (_error) {
      console.log('Compass error:', _error);
      Alert.alert('Compass Error', 'Compass feature is not supported or failed to start.');
    }
  };

  const stopCompass = async () => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    setHeading(null);
  };

  const computeDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const handleCalculateDistance = () => {
    if (!location || !searchLocation) {
      Alert.alert(
        'Missing Coordinates',
        'Please get current location AND search a destination address first.'
      );
      return;
    }
    const dist = computeDistance(
      location.coords.latitude,
      location.coords.longitude,
      searchLocation.latitude,
      searchLocation.longitude
    );
    setCalculatedDist(dist);
  };

  const openGoogleMaps = async () => {
    if (!location) {
      Alert.alert('No Location', 'Get current location first.');
      return;
    }
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open Google Maps.'));
  };

  const shareCoordinates = async () => {
    if (!location) {
      Alert.alert('No Location', 'Get current location first.');
      return;
    }
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    const message = `My current location:\nLatitude: ${lat}\nLongitude: ${lon}\n\nhttps://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    await Share.share({ message });
  };

  const searchAddress = async () => {
    if (!searchText.trim()) {
      Alert.alert('Input Error', 'Please enter an address or city to search.');
      return;
    }
    try {
      const result = await Location.geocodeAsync(searchText.trim());
      if (!result || result.length === 0) {
        Alert.alert('Not Found', 'Could not find coordinates for the entered address.');
        return;
      }
      setSearchLocation(result[0]);
    } catch (_error) {
      Alert.alert('Search Error', 'Failed to geocode address.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>GPS & Location</Text>
          <Text style={[styles.headerSubtitle, isDark && styles.textSubDark]}>
            Real-time coordinates, tracking, geocoding & maps
          </Text>
        </View>

        {/* Primary Location Actions */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLocation}>
            <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Get Location</Text>
          </TouchableOpacity>

          {!isTracking ? (
            <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={startTracking}>
              <Ionicons name="play" size={18} color="#4A90E2" />
              <Text style={[styles.actionBtnText, isDark && styles.textDark]}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopBtn} onPress={stopTracking}>
              <Ionicons name="stop" size={18} color="#FFFFFF" />
              <Text style={styles.stopBtnText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={geoCoding}>
            <Ionicons name="map-outline" size={18} color="#4A90E2" />
            <Text style={[styles.actionBtnText, isDark && styles.textDark]}>Get Address</Text>
          </TouchableOpacity>

          {heading === null ? (
            <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={startCompass}>
              <Ionicons name="compass-outline" size={18} color="#4A90E2" />
              <Text style={[styles.actionBtnText, isDark && styles.textDark]}>Start Compass</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={stopCompass}>
              <Ionicons name="compass" size={18} color="#E63946" />
              <Text style={[styles.actionBtnText, { color: '#E63946' }]}>Stop Compass</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={openGoogleMaps}>
            <Ionicons name="open-outline" size={18} color="#4A90E2" />
            <Text style={[styles.actionBtnText, isDark && styles.textDark]}>Open Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]} onPress={shareCoordinates}>
            <Ionicons name="share-social-outline" size={18} color="#4A90E2" />
            <Text style={[styles.actionBtnText, isDark && styles.textDark]}>Share GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Current Location Display Card */}
        {location ? (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color="#4A90E2" />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>
                {locationType || 'GPS Position'}
              </Text>
            </View>
            <View style={[styles.infoRow, isDark && styles.borderDark]}>
              <Text style={[styles.infoLabel, isDark && styles.textSubDark]}>Latitude:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {location.coords.latitude}
              </Text>
            </View>
            <View style={[styles.infoRow, isDark && styles.borderDark]}>
              <Text style={[styles.infoLabel, isDark && styles.textSubDark]}>Longitude:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {location.coords.longitude}
              </Text>
            </View>
            <View style={[styles.infoRow, isDark && styles.borderDark]}>
              <Text style={[styles.infoLabel, isDark && styles.textSubDark]}>Accuracy:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {location.coords.accuracy?.toFixed(1)} meters
              </Text>
            </View>
            {location.coords.speed !== null ? (
              <View style={[styles.infoRow, isDark && styles.borderDark]}>
                <Text style={[styles.infoLabel, isDark && styles.textSubDark]}>Speed:</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {location.coords.speed?.toFixed(1)} m/s
                </Text>
              </View>
            ) : null}
            <View style={[styles.infoRow, isDark && styles.borderDark]}>
              <Text style={[styles.infoLabel, isDark && styles.textSubDark]}>Timestamp:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Reverse Geocoded Address Card */}
        {address ? (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Ionicons name="business-outline" size={20} color="#2EC4B6" />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>Geocoded Address</Text>
            </View>
            <Text style={[styles.addressText, isDark && styles.textDark]}>
              {[address.street, address.city, address.region, address.country, address.postalCode]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Compass Heading Card */}
        {heading !== null ? (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Ionicons name="compass" size={20} color="#E63946" />
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>Compass Heading</Text>
            </View>
            <Text style={styles.headingValue}>{heading}°</Text>
          </View>
        ) : null}

        {/* Search Address Section */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Search Address & Distance</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="e.g. Kalol, Gandhinagar"
              placeholderTextColor="#A0AEC0"
              value={searchText}
              onChangeText={setSearchText}
              style={[styles.searchInput, isDark && styles.searchInputDark]}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={searchAddress}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {searchLocation ? (
            <View style={[styles.searchResultBox, isDark && styles.resultBoxDark]}>
              <Text style={[styles.searchResultTitle, isDark && styles.textDark]}>Target Coordinates:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                Lat: {searchLocation.latitude}, Lon: {searchLocation.longitude}
              </Text>
              <TouchableOpacity
                style={styles.calcBtn}
                onPress={handleCalculateDistance}
              >
                <Ionicons name="calculator-outline" size={16} color="#FFFFFF" />
                <Text style={styles.calcBtnText}>Calculate Distance</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {calculatedDist !== null ? (
            <View style={styles.distBadge}>
              <Ionicons name="git-commit-outline" size={18} color="#2B6CB0" />
              <Text style={styles.distText}>Distance: {calculatedDist} km</Text>
            </View>
          ) : null}
        </View>

        {/* Live Location History Log */}
        {locationHistory.length > 0 ? (
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Tracking History Log</Text>
            {locationHistory.map((item, idx) => (
              <View key={idx} style={styles.historyRow}>
                <Ionicons name="ellipse" size={8} color="#4A90E2" />
                <Text style={[styles.historyText, isDark && styles.textSubDark]}>
                  {item.coords.latitude.toFixed(4)}, {item.coords.longitude.toFixed(4)} (
                  {new Date(item.timestamp).toLocaleTimeString()})
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSubDark: {
    color: '#94A3B8',
  },
  cardDark: {
    backgroundColor: '#1E293B',
  },
  borderDark: {
    borderBottomColor: '#334155',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  actionBtnDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 13,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  infoLabel: {
    fontSize: 13,
    color: '#718096',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  addressText: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  headingValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E63946',
    textAlign: 'center',
    marginVertical: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2D3748',
  },
  searchInputDark: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
  },
  searchBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultBox: {
    marginTop: 12,
    backgroundColor: '#F7FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  resultBoxDark: {
    backgroundColor: '#334155',
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2EC4B6',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  distText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  historyText: {
    fontSize: 12,
    color: '#718096',
  },
});
