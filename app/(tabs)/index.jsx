import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const featureCards = [
    {
      id: 'camera',
      title: 'Pro Camera & Scanner',
      subtitle: 'Grid overlay, Zoom, Tap-Focus, Self-Timer & Sound',
      icon: 'camera-outline',
      color: '#4A90E2',
      route: '/camera',
    },
    {
      id: 'location',
      title: 'GPS & Offline Geocoding',
      subtitle: 'Track location, compass heading & offline address cache',
      icon: 'location-outline',
      color: '#2EC4B6',
      route: '/location',
    },
    {
      id: 'journal',
      title: 'Geotagged Travel Journal',
      subtitle: 'Snap photos with live GPS address overlays & export JSON',
      icon: 'map-outline',
      color: '#FF9F1C',
      route: '/camera-location',
    },
    {
      id: 'gallery',
      title: 'Photo Gallery',
      subtitle: 'Browse, search, favorite, rename & manage travel photos',
      icon: 'images-outline',
      color: '#E63946',
      route: '/gallery',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
        }
      >
        {/* Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroBadge}>TRAVEL GUARDIAN • PART 10 COMPLETE</Text>
            <Text style={styles.heroTitle}>Your Smart Travel Companion</Text>
            <Text style={styles.heroSubtitle}>
              Capture geotagged memories, track GPS coordinates with offline address caching, and organize your photo gallery with ease.
            </Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <Text style={[styles.sectionHeader, isDark && styles.textDark]}>Quick Access</Text>
        <View style={styles.grid}>
          {featureCards.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isDark && styles.cardDark]}
              activeOpacity={0.8}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, isDark && styles.textSubDark]}>{item.subtitle}</Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={16} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Checklist */}
        <View style={[styles.summaryCard, isDark && styles.cardDark]}>
          <Text style={[styles.summaryTitle, isDark && styles.textDark]}>Part 10 Enhancements</Text>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Dark Mode & Smooth Animations</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Rule of Thirds Camera Grid Overlay</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Zoom & Tap-to-Focus Target Ring</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Self-Timer Countdown & Flash Shutter</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Shutter Sound Toggle & Pull to Refresh</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2EC4B6" />
            <Text style={[styles.checkText, isDark && styles.textSubDark]}>Offline Address Cache Layer</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTextContainer: {
    gap: 8,
  },
  heroBadge: {
    color: '#4A90E2',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  grid: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    lineHeight: 18,
  },
  cardArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
});
