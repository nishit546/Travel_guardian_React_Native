import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Linking,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const STORAGE_KEY = 'travelJournal';

export default function GalleryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2;
  const itemWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'favorites'

  // Modal states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Load photos whenever tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const storedJournal = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedJournal) {
        const parsed = JSON.parse(storedJournal);
        const formatted = parsed.map((item, index) => ({
          id: item.id || item.timestamp?.toString() || index.toString(),
          title:
            item.title ||
            item.name ||
            (item.address?.city
              ? `Photo at ${item.address.city}`
              : `Travel Photo #${index + 1}`),
          isFavorite: item.isFavorite || false,
          ...item,
        }));
        setPhotos(formatted);
      } else {
        setPhotos([]);
      }
    } catch (_error) {
      setErrorMessage('Failed to load gallery photos from storage.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setTimeout(() => setRefreshing(false), 500);
  };

  const savePhotosToStorage = async (updatedPhotos) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    } catch (_error) {
      Alert.alert('Save Error', 'Could not persist changes to storage.');
    }
  };

  // Toggle Favorite
  const toggleFavorite = async (photoId) => {
    try {
      const updated = photos.map((item) => {
        if (item.id === photoId) {
          return { ...item, isFavorite: !item.isFavorite };
        }
        return item;
      });
      setPhotos(updated);

      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
      }

      await savePhotosToStorage(updated);
    } catch (_error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  };

  // Open Rename Modal
  const openRenameModal = (photo) => {
    setEditingPhoto(photo);
    setNewTitle(photo.title || '');
    setRenameModalVisible(true);
  };

  // Confirm Rename
  const handleRenameSave = async () => {
    if (!editingPhoto) return;
    const trimmed = newTitle.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Title cannot be empty.');
      return;
    }

    try {
      const updated = photos.map((item) => {
        if (item.id === editingPhoto.id) {
          return { ...item, title: trimmed };
        }
        return item;
      });
      setPhotos(updated);

      if (selectedPhoto && selectedPhoto.id === editingPhoto.id) {
        setSelectedPhoto((prev) => ({ ...prev, title: trimmed }));
      }

      await savePhotosToStorage(updated);
      setRenameModalVisible(false);
      setEditingPhoto(null);
      setNewTitle('');
    } catch (_error) {
      Alert.alert('Error', 'Failed to rename photo.');
    }
  };

  // Delete Photo
  const confirmDelete = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo from your travel gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePhoto(photoId),
        },
      ]
    );
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const updated = photos.filter((item) => item.id !== photoId);
      setPhotos(updated);
      await savePhotosToStorage(updated);

      if (selectedPhoto && selectedPhoto.id === photoId) {
        setSelectedPhoto(null);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to delete photo.');
    }
  };

  // Share Photo
  const handleShare = async (photo) => {
    try {
      const lat = photo.latitude;
      const lon = photo.longitude;
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const message = `Check out my photo "${photo.title}" taken at ${
        photo.address?.city || 'Travel Location'
      }!\n\nLocation: ${mapUrl}`;

      if (photo.uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(photo.uri, {
          dialogTitle: photo.title,
        });
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Open Google Maps
  const openMaps = (photo) => {
    if (!photo.latitude || !photo.longitude) {
      Alert.alert('No Location', 'Location coordinates are not available for this photo.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${photo.latitude},${photo.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open maps app.'));
  };

  // Filter & Search Logic
  const filteredPhotos = photos.filter((item) => {
    const matchesFilter = activeFilter === 'favorites' ? item.isFavorite : true;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesFilter;

    const titleMatch = item.title?.toLowerCase().includes(query);
    const cityMatch = item.address?.city?.toLowerCase().includes(query);
    const regionMatch = item.address?.region?.toLowerCase().includes(query);
    const countryMatch = item.address?.country?.toLowerCase().includes(query);

    return matchesFilter && (titleMatch || cityMatch || regionMatch || countryMatch);
  });

  const renderPhotoCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark, { width: itemWidth }]}
      activeOpacity={0.8}
      onPress={() => setSelectedPhoto(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.cardImage} />

      {/* Favorite Quick Button */}
      <TouchableOpacity
        style={styles.favoriteBadge}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons
          name={item.isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={item.isFavorite ? '#E63946' : '#FFFFFF'}
        />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.address?.city ? (
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={12} color="#4A90E2" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address.city}
              {item.address.region ? `, ${item.address.region}` : ''}
            </Text>
          </View>
        ) : null}
        <Text style={styles.cardDate}>
          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}
        </Text>

        {/* Quick Action Bar */}
        <View style={[styles.cardActions, isDark && styles.borderDark]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openRenameModal(item)}
          >
            <Ionicons name="pencil" size={16} color={isDark ? '#A0AEC0' : '#4A5568'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash" size={16} color="#E63946" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Travel Gallery</Text>
        <Text style={[styles.headerSubtitle, isDark && styles.textSubDark]}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} saved | Offline Cache Enabled
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDark && styles.searchDark]}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Search by title, city, region..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Segment (All vs Favorites) */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            isDark && styles.filterTabDark,
            activeFilter === 'all' && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Ionicons
            name="images-outline"
            size={16}
            color={activeFilter === 'all' ? '#FFFFFF' : isDark ? '#CBD5E0' : '#4A5568'}
          />
          <Text
            style={[
              styles.filterText,
              isDark && styles.filterTextDark,
              activeFilter === 'all' && styles.filterTextActive,
            ]}
          >
            All Photos ({photos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            isDark && styles.filterTabDark,
            activeFilter === 'favorites' && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeFilter === 'favorites' ? '#FFFFFF' : '#E63946'}
          />
          <Text
            style={[
              styles.filterText,
              isDark && styles.filterTextDark,
              activeFilter === 'favorites' && styles.filterTextActive,
            ]}
          >
            Favorites ({photos.filter((p) => p.isFavorite).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#E63946" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Photos Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={[styles.loadingText, isDark && styles.textSubDark]}>Loading gallery...</Text>
        </View>
      ) : filteredPhotos.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
          }
        >
          <Ionicons
            name={activeFilter === 'favorites' ? 'heart-dislike-outline' : 'camera-outline'}
            size={64}
            color="#CBD5E0"
          />
          <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
            {activeFilter === 'favorites'
              ? 'No Favorite Photos Yet'
              : 'No Photos Captured'}
          </Text>
          <Text style={[styles.emptySubtitle, isDark && styles.textSubDark]}>
            {activeFilter === 'favorites'
              ? 'Tap the heart icon on any photo to add it to your favorites.'
              : 'Capture photos from the Travel Journal or Camera screen.'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredPhotos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhotoCard}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
          }
        />
      )}

      {/* Fullscreen Photo Preview Modal */}
      {selectedPhoto && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedPhoto.title}
              </Text>
              <TouchableOpacity
                onPress={() => toggleFavorite(selectedPhoto.id)}
              >
                <Ionicons
                  name={selectedPhoto.isFavorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={selectedPhoto.isFavorite ? '#E63946' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.modalImage}
                resizeMode="cover"
              />

              <View style={styles.detailsCard}>
                <View style={styles.detailsRow}>
                  <Ionicons name="time-outline" size={18} color="#4A90E2" />
                  <Text style={styles.detailsText}>
                    {selectedPhoto.timestamp
                      ? new Date(selectedPhoto.timestamp).toLocaleString()
                      : 'Unknown Date'}
                  </Text>
                </View>

                {selectedPhoto.address ? (
                  <View style={styles.detailsRow}>
                    <Ionicons name="location-outline" size={18} color="#E63946" />
                    <Text style={styles.detailsText}>
                      {[
                        selectedPhoto.address.street,
                        selectedPhoto.address.city,
                        selectedPhoto.address.region,
                        selectedPhoto.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                ) : null}

                {selectedPhoto.latitude ? (
                  <View style={styles.detailsRow}>
                    <Ionicons name="compass-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailsText}>
                      Lat: {selectedPhoto.latitude.toFixed(5)} | Lon:{' '}
                      {selectedPhoto.longitude.toFixed(5)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalToolbar}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => openMaps(selectedPhoto)}
                >
                  <Ionicons name="map-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.toolBtnText}>View Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => handleShare(selectedPhoto)}
                >
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.toolBtnText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => openRenameModal(selectedPhoto)}
                >
                  <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.toolBtnText}>Rename</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, styles.toolBtnDanger]}
                  onPress={() => confirmDelete(selectedPhoto.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.toolBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, isDark && styles.cardDark]}>
            <Text style={[styles.dialogTitle, isDark && styles.textDark]}>Rename Photo</Text>
            <TextInput
              style={[styles.dialogInput, isDark && styles.dialogInputDark]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new photo title"
              placeholderTextColor="#A0AEC0"
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogBtnCancel}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogBtnSave}
                onPress={handleRenameSave}
              >
                <Text style={styles.dialogBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  borderDark: {
    borderTopColor: '#334155',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchDark: {
    backgroundColor: '#1E293B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterTabDark: {
    backgroundColor: '#1E293B',
  },
  filterTabActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  filterTextDark: {
    color: '#CBD5E0',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    color: '#E63946',
    fontSize: 13,
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
    padding: 6,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    flex: 1,
  },
  cardDate: {
    fontSize: 11,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 6,
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A5568',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: '70%',
  },
  modalScroll: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#1E293B',
  },
  detailsCard: {
    backgroundColor: '#1E293B',
    width: '90%',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsText: {
    color: '#E2E8F0',
    fontSize: 14,
    flex: 1,
  },
  modalToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    marginTop: 24,
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  toolBtnDanger: {
    backgroundColor: '#991B1B',
  },
  toolBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 14,
  },
  dialogInput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D3748',
    marginBottom: 18,
  },
  dialogInputDark: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogBtnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dialogBtnCancelText: {
    color: '#718096',
    fontWeight: '600',
    fontSize: 15,
  },
  dialogBtnSave: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  dialogBtnSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
