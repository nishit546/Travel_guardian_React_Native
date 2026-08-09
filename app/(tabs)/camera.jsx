import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useCameraPermissions, CameraView, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const VideoPlayer = ({ videoUri }) => {
  const player = useVideoPlayer(videoUri);
  return (
    <View style={styles.videoCard}>
      <Text style={styles.previewTitle}>Recorded Video Preview</Text>
      <VideoView player={player} style={styles.videoPlayer} nativeControls />
    </View>
  );
};

const CameraScreen = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [recording, setRecording] = useState(false);
  const [torch, setTorch] = useState(false);
  const [mode, setMode] = useState('picture'); // 'picture' | 'video'
  const [scanned, setScanned] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  const cameraRef = useRef(null);

  const handleGrantPermissions = async () => {
    try {
      await requestCameraPermission();
      await requestAudioPermission();
    } catch (e) {
      Alert.alert('Permission Error', 'Failed to request camera/mic permission.');
    }
  };

  if (!cameraPermission?.granted || !audioPermission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#4A90E2" />
        <Text style={styles.permissionTitle}>Camera & Mic Access Required</Text>
        <Text style={styles.permissionText}>
          Please grant permission to use the camera, microphone, and barcode scanner features.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={handleGrantPermissions}>
          <Ionicons name="key-outline" size={20} color="#FFFFFF" />
          <Text style={styles.permissionBtnText}>Grant Camera & Mic Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleClickCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const captured = await cameraRef.current.takePictureAsync();
      setPhoto(captured.uri);
    } catch (error) {
      console.log('Capture error:', error);
      Alert.alert('Capture Failed', 'Could not take picture.');
    }
  };

  const changeFlash = () => {
    if (flash === 'off') setFlash('on');
    else if (flash === 'on') setFlash('auto');
    else setFlash('off');
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setRecording(true);
      const recVideo = await cameraRef.current.recordAsync();
      setVideo(recVideo.uri);
    } catch (error) {
      console.log('Recording error:', error);
      Alert.alert('Recording Failed', 'Failed to start video recording.');
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;
    try {
      await cameraRef.current.stopRecording();
      setRecording(false);
    } catch (error) {
      console.log('Stop recording error:', error);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setScannedResult({ type, data });
  };

  const resetScan = () => {
    setScanned(false);
    setScannedResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Camera & Scanner</Text>
          <Text style={styles.headerSubtitle}>Photo, Video & QR/Barcode Reader</Text>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'picture' && styles.modeTabActive]}
            onPress={() => setMode('picture')}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={mode === 'picture' ? '#FFFFFF' : '#4A5568'}
            />
            <Text style={[styles.modeText, mode === 'picture' && styles.modeTextActive]}>
              Photo Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
            onPress={() => setMode('video')}
          >
            <Ionicons
              name="videocam-outline"
              size={18}
              color={mode === 'video' ? '#FFFFFF' : '#4A5568'}
            />
            <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>
              Video Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera Preview */}
        <View style={styles.cameraBox}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
            mode={mode}
            enableTorch={torch}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'code128'],
            }}
          />

          {/* Flash & Torch Badges */}
          <View style={styles.topControlOverlay}>
            <TouchableOpacity style={styles.iconCircle} onPress={changeFlash}>
              <Ionicons
                name={
                  flash === 'on'
                    ? 'flash'
                    : flash === 'auto'
                    ? 'flash-outline'
                    : 'flash-off-outline'
                }
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconCircle, torch && styles.iconCircleActive]}
              onPress={() => setTorch((prev) => !prev)}
            >
              <Ionicons name="flashlight" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barcode Scanner Status */}
        <View style={styles.statusRow}>
          <Ionicons
            name={scanned ? 'checkmark-circle' : 'qr-code-outline'}
            size={18}
            color={scanned ? '#2EC4B6' : '#4A90E2'}
          />
          <Text style={styles.statusText}>
            Scanner Status: {scanned ? 'Code Scanned!' : 'Ready to Scan Barcode / QR'}
          </Text>
        </View>

        {/* Main Controls Grid */}
        <View style={styles.controlsGrid}>
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="#4A90E2" />
            <Text style={styles.ctrlBtnText}>Flip Camera</Text>
          </TouchableOpacity>

          {mode === 'picture' ? (
            <TouchableOpacity style={styles.capturePrimaryBtn} onPress={handleClickCapture}>
              <Ionicons name="radio-button-on" size={24} color="#FFFFFF" />
              <Text style={styles.capturePrimaryText}>Take Photo</Text>
            </TouchableOpacity>
          ) : !recording ? (
            <TouchableOpacity style={styles.recordPrimaryBtn} onPress={startRecording}>
              <Ionicons name="videocam" size={22} color="#FFFFFF" />
              <Text style={styles.capturePrimaryText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording}>
              <Ionicons name="square" size={20} color="#FFFFFF" />
              <Text style={styles.capturePrimaryText}>Stop Recording</Text>
            </TouchableOpacity>
          )}

          {scanned ? (
            <TouchableOpacity style={styles.ctrlBtn} onPress={resetScan}>
              <Ionicons name="refresh-outline" size={20} color="#4A90E2" />
              <Text style={styles.ctrlBtnText}>Scan Again</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Photo Preview */}
        {photo ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Photo Captured</Text>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
          </View>
        ) : null}

        {/* Barcode Scanned Result */}
        {scannedResult ? (
          <View style={styles.scannedCard}>
            <Text style={styles.scannedTitle}>Barcode Result</Text>
            <Text style={styles.scannedDetail}>Type: {scannedResult.type}</Text>
            <Text style={styles.scannedData} selectable>
              Data: {scannedResult.data}
            </Text>
          </View>
        ) : null}

        {/* Video Preview */}
        {video ? <VideoPlayer videoUri={video} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CameraScreen;

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
    fontSize: 26,
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
    fontSize: 20,
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
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#4A90E2',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  cameraBox: {
    height: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: 12,
  },
  camera: {
    flex: 1,
  },
  topControlOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  iconCircle: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 8,
    borderRadius: 20,
  },
  iconCircleActive: {
    backgroundColor: '#E63946',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '500',
  },
  controlsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  ctrlBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  capturePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  recordPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  stopRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3748',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  capturePrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
  },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  scannedCard: {
    backgroundColor: '#EBF8FF',
    borderColor: '#BEE3F8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  scannedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B6CB0',
    marginBottom: 4,
  },
  scannedDetail: {
    fontSize: 13,
    color: '#4A5568',
  },
  scannedData: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 4,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});