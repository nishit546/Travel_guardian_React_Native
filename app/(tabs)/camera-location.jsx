import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = 'travelJournal';

const CameraLocation = () => {
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);

  const [capturing, setCapturing] = useState(false);
  const [capturedData, setCapturedData] = useState(null);
  const [journal, setJournal] = useState([]);
  const [facing, setFacing] = useState('back');

  // Rename modal states
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);

  useEffect(() => {
    checkPermissions();
    loadJournal();
  }, []);

  const checkPermissions = async () => {
    try {
      const locPerm = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(locPerm.status);
    } catch (e) {
      console.log('Error checking permissions:', e);
    }
  };

  const requestAllPermissions = async () => {
    await requestCameraPermission();
    const locPerm = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(locPerm.status);
  };

  const loadJournal = async () => {
    try {
      const storedJournal = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedJournal) {
        const parsed = JSON.parse(storedJournal);
        const formatted = parsed.map((item, idx) => ({
          id: item.id || item.timestamp?.toString() || idx.toString(),
          title: item.title || (item.address?.city ? `Photo at ${item.address.city}` : `Travel Entry #${idx + 1}`),
          isFavorite: item.isFavorite || false,
          ...item,
        }));
        setJournal(formatted);
      }
    } catch (error) {
      console.log('Error loading journal:', error);
    }
  };

  const saveJournal = async (journalData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(journalData));
    } catch (error) {
      console.log('Error saving journal:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(perm.status);
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to tag your travel photo.');
        return null;
      }
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      Alert.alert('Location Error', 'Unable to fetch current location coordinates.');
      return null;
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera is not ready yet.');
      return;
    }

    try {
      setCapturing(true);

      const currLocation = await getCurrentLocation();
      if (!currLocation) {
        setCapturing(false);
        return;
      }

      const photo = await cameraRef.current.takePictureAsync();

      let address = null;
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: currLocation.coords.latitude,
          longitude: currLocation.coords.longitude,
        });
        if (result && result.length > 0) {
          address = result[0];
        }
      } catch (geoErr) {
        console.log('Reverse geocode error:', geoErr);
      }

      const timestamp = Date.now();
      const defaultTitle = address?.city
        ? `Photo at ${address.city}`
        : `Journal Photo ${new Date(timestamp).toLocaleDateString()}`;

      const newData = {
        id: timestamp.toString(),
        title: defaultTitle,
        uri: photo.uri,
        latitude: currLocation.coords.latitude,
        longitude: currLocation.coords.longitude,
        accuracy: currLocation.coords.accuracy,
        timestamp: timestamp,
        address: address,
        isFavorite: false,
      };

      setCapturedData(newData);

      const updated = [newData, ...journal];
      setJournal(updated);
      await saveJournal(updated);
    } catch (error) {
      console.log('Error capturing photo:', error);
      Alert.alert('Capture Failed', 'An error occurred while capturing the photo.');
    } finally {
      setCapturing(false);
    }
  };

  const toggleFavorite = async (id) => {
    const updated = journal.map((item) => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    setJournal(updated);

    if (capturedData && capturedData.id === id) {
      setCapturedData((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
    await saveJournal(updated);
  };

  const openRenameModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setRenameModalVisible(true);
  };

  const handleSaveRename = async () => {
    if (!editingItem) return;
    const trimmed = editTitle.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Title cannot be empty.');
      return;
    }

    const updated = journal.map((item) => {
      if (item.id === editingItem.id) {
        return { ...item, title: trimmed };
      }
      return item;
    });

    setJournal(updated);
    if (capturedData && capturedData.id === editingItem.id) {
      setCapturedData((prev) => ({ ...prev, title: trimmed }));
    }

    await saveJournal(updated);
    setRenameModalVisible(false);
    setEditingItem(null);
  };

  const confirmDelete = (id) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this travel entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id) => {
    const updated = journal.filter((item) => item.id !== id);
    setJournal(updated);
    if (capturedData && capturedData.id === id) {
      setCapturedData(null);
    }
    await saveJournal(updated);
  };

  const openGoogleMaps = async (targetData = capturedData) => {
    if (!targetData) {
      Alert.alert('No Data', 'Please select or capture a photo first.');
      return;
    }
    const { latitude, longitude } = targetData;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open maps.'));
  };

  const shareLocation = async (targetData = capturedData) => {
    if (!targetData) {
      Alert.alert('No Data', 'Please select or capture a photo first.');
      return;
    }
    const { latitude, longitude, title, address } = targetData;
    const locText = address?.city ? `${address.city}, ${address.region}` : 'My location';
    const message = `Check out "${title}" taken at ${locText}:\n\nLatitude: ${latitude}\nLongitude: ${longitude}\n\nhttps://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    await Share.share({ message });
  };

  const exportJournal = async () => {
    try {
      if (journal.length === 0) {
        Alert.alert('Empty Journal', 'There are no travel entries to export.');
        return;
      }

      const jsonData = JSON.stringify(journal, null, 2);
      const fileUri = `${FileSystem.documentDirectory}travelJournal.json`;

      await FileSystem.writeAsStringAsync(fileUri, jsonData);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing Unavailable', 'Export sharing is not supported on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Travel Journal',
        UTI: 'public.json',
      });
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Export Error', 'Failed to export travel journal JSON.');
    }
  };

  // Permission Check Screen
  if (!cameraPermission?.granted || locationPermissionStatus !== 'granted') {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="shield-checkmark-outline" size={64} color="#4A90E2" />
        <Text style={styles.permissionTitle}>Permissions Needed</Text>
        <Text style={styles.permissionText}>
          Travel Guardian requires access to your Camera & Location to capture photos with automatic GPS geotagging.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestAllPermissions}>
          <Ionicons name="key-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Grant Camera & Location Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Camera & Location Journal</Text>
          <Text style={styles.headerSubtitle}>Snap photos with live GPS address overlays</Text>
        </View>

        {/* Live Camera View Card */}
        <View style={styles.cameraCard}>
          <CameraView ref={cameraRef} style={styles.cameraPreview} facing={facing} mode="picture" />
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Action Controls */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.captureBtn, capturing && styles.btnDisabled]}
            onPress={capturePhoto}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="aperture" size={22} color="#FFFFFF" />
                <Text style={styles.captureBtnText}>Capture Photo + Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={exportJournal}>
            <Ionicons name="download-outline" size={18} color="#4A90E2" />
            <Text style={styles.secondaryBtnText}>Export JSON</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Capture Preview Section */}
        {capturedData ? (
          <View style={styles.latestSection}>
            <Text style={styles.sectionTitle}>Latest Capture</Text>
            <View style={styles.previewCard}>
              <Image source={{ uri: capturedData.uri }} style={styles.previewImage} />

              <View style={styles.overlayInfo}>
                <Text style={styles.overlayCity}>
                  {capturedData.address?.city || 'Unknown City'}
                  {capturedData.address?.region ? `, ${capturedData.address.region}` : ''}
                </Text>
                <Text style={styles.overlayCoords}>
                  Lat: {capturedData.latitude.toFixed(4)}, Lon: {capturedData.longitude.toFixed(4)}
                </Text>
                <Text style={styles.overlayMeta}>
                  Accuracy: {capturedData.accuracy?.toFixed(1)}m |{' '}
                  {new Date(capturedData.timestamp).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.previewToolbar}>
                <TouchableOpacity
                  style={styles.previewToolItem}
                  onPress={() => openGoogleMaps(capturedData)}
                >
                  <Ionicons name="map" size={18} color="#4A90E2" />
                  <Text style={styles.previewToolText}>Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewToolItem}
                  onPress={() => shareLocation(capturedData)}
                >
                  <Ionicons name="share-social" size={18} color="#4A90E2" />
                  <Text style={styles.previewToolText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewToolItem}
                  onPress={() => toggleFavorite(capturedData.id)}
                >
                  <Ionicons
                    name={capturedData.isFavorite ? 'heart' : 'heart-outline'}
                    size={18}
                    color={capturedData.isFavorite ? '#E63946' : '#4A90E2'}
                  />
                  <Text style={styles.previewToolText}>Favorite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Journal Entries List */}
        <View style={styles.journalSection}>
          <Text style={styles.sectionTitle}>Travel Entries ({journal.length})</Text>

          {journal.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="journal-outline" size={48} color="#A0AEC0" />
              <Text style={styles.emptyText}>No entries captured yet.</Text>
            </View>
          ) : (
            journal.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <Image source={{ uri: item.uri }} style={styles.entryThumbnail} />
                <View style={styles.entryContent}>
                  <View style={styles.entryTitleRow}>
                    <Text style={styles.entryTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                      <Ionicons
                        name={item.isFavorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.isFavorite ? '#E63946' : '#A0AEC0'}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.entrySubtitle}>
                    {item.address?.city ? `${item.address.city}, ${item.address.country || ''}` : 'Tagged Location'}
                  </Text>
                  <Text style={styles.entryDate}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>

                  <View style={styles.entryActionRow}>
                    <TouchableOpacity style={styles.smallAction} onPress={() => openGoogleMaps(item)}>
                      <Ionicons name="location-outline" size={14} color="#4A90E2" />
                      <Text style={styles.smallActionText}>Map</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallAction} onPress={() => openRenameModal(item)}>
                      <Ionicons name="pencil-outline" size={14} color="#718096" />
                      <Text style={styles.smallActionText}>Rename</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallAction} onPress={() => confirmDelete(item.id)}>
                      <Ionicons name="trash-outline" size={14} color="#E63946" />
                      <Text style={[styles.smallActionText, { color: '#E63946' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Rename Journal Entry</Text>
            <TextInput
              style={styles.dialogInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter new entry title"
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogSave} onPress={handleSaveRename}>
                <Text style={styles.dialogSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CameraLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  cameraCard: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    marginBottom: 16,
  },
  cameraPreview: {
    flex: 1,
  },
  flipBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  controlRow: {
    marginBottom: 12,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  secondaryBtnText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  latestSection: {
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  overlayInfo: {
    backgroundColor: '#1E293B',
    padding: 12,
  },
  overlayCity: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  overlayCoords: {
    color: '#CBD5E0',
    fontSize: 13,
    marginTop: 2,
  },
  overlayMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  previewToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  previewToolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewToolText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  journalSection: {
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0AEC0',
    marginTop: 8,
    fontSize: 14,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  entryThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  entryContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  entryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    maxWidth: '80%',
  },
  entrySubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  entryDate: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
  },
  entryActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  smallActionText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  dialogInput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dialogCancelText: {
    color: '#718096',
    fontWeight: '600',
  },
  dialogSave: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});