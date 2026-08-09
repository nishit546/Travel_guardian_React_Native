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
  Animated,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useCameraPermissions, CameraView, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const VideoPlayer = ({ videoUri, isDark }) => {
  const player = useVideoPlayer(videoUri);
  return (
    <View style={[styles.videoCard, isDark && styles.cardDark]}>
      <Text style={[styles.previewTitle, isDark && styles.textDark]}>Recorded Video Preview</Text>
      <VideoView player={player} style={styles.videoPlayer} nativeControls />
    </View>
  );
};

const CameraScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  // Part 10 Enhancements State
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(0); // 0.0 to 1.0
  const [timerSeconds, setTimerSeconds] = useState(0); // 0, 3, 5, 10
  const [countdown, setCountdown] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tap to Focus State & Animation
  const [focusPos, setFocusPos] = useState(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  // Flash Shutter Animation
  const flashAnim = useRef(new Animated.Value(0)).current;

  const cameraRef = useRef(null);

  const handleGrantPermissions = async () => {
    try {
      await requestCameraPermission();
      await requestAudioPermission();
    } catch (_e) {
      Alert.alert('Permission Error', 'Failed to request camera/mic permission.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPhoto(null);
    setVideo(null);
    setScannedResult(null);
    setScanned(false);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Trigger White Flash Shutter Animation
  const triggerShutterFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // Tap to Focus Handler
  const handleTapToFocus = (event) => {
    const {locationX, locationY} = event.nativeEvent;
    setFocusPos({ x: locationX, y: locationY });

    focusAnim.setValue(1.4);
    Animated.spring(focusAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => setFocusPos(null), 1200);
    });
  };

  // Self Timer Execution
  const executeCapture = async () => {
    if (timerSeconds > 0) {
      for (let i = timerSeconds; i > 0; i--) {
        setCountdown(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(null);
    }
    performCapture();
  };

  const performCapture = async () => {
    if (!cameraRef.current) return;
    try {
      triggerShutterFlash();
      const captured = await cameraRef.current.takePictureAsync({
        shutterSound: soundEnabled,
      });
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

  if (!cameraPermission?.granted || !audioPermission?.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, isDark && styles.containerDark]}>
        <Ionicons name="camera-outline" size={64} color="#4A90E2" />
        <Text style={[styles.permissionTitle, isDark && styles.textDark]}>Camera & Mic Access Required</Text>
        <Text style={[styles.permissionText, isDark && styles.textSubDark]}>
          Please grant permission to use the camera, microphone, and barcode scanner features.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={handleGrantPermissions}>
          <Ionicons name="key-outline" size={20} color="#FFFFFF" />
          <Text style={styles.permissionBtnText}>Grant Camera & Mic Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>Pro Camera & Scanner</Text>
          <Text style={[styles.headerSubtitle, isDark && styles.textSubDark]}>
            Grid, Zoom, Tap-Focus, Self-Timer & Sound
          </Text>
        </View>

        {/* Mode Switcher */}
        <View style={[styles.modeRow, isDark && styles.modeRowDark]}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'picture' && styles.modeTabActive]}
            onPress={() => setMode('picture')}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={mode === 'picture' ? '#FFFFFF' : isDark ? '#A0AEC0' : '#4A5568'}
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
              color={mode === 'video' ? '#FFFFFF' : isDark ? '#A0AEC0' : '#4A5568'}
            />
            <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>
              Video Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera Container with Grid & Focus */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTapToFocus}
          style={styles.cameraBox}
        >
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
            mode={mode}
            zoom={zoom}
            enableTorch={torch}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'code128'],
            }}
          />

          {/* Rule of Thirds Grid Overlay */}
          {showGrid && (
            <View style={styles.gridOverlay} pointerEvents="none">
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
            </View>
          )}

          {/* Tap-to-Focus Target Ring */}
          {focusPos && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusRing,
                {
                  left: focusPos.x - 28,
                  top: focusPos.y - 28,
                  transform: [{ scale: focusAnim }],
                },
              ]}
            />
          )}

          {/* Shutter White Flash Overlay */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />

          {/* Countdown Timer Large Overlay */}
          {countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Top Camera Controls */}
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

            <TouchableOpacity
              style={[styles.iconCircle, showGrid && styles.iconCircleActive]}
              onPress={() => setShowGrid((prev) => !prev)}
            >
              <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconCircle, !soundEnabled && styles.iconCircleActive]}
              onPress={() => setSoundEnabled((prev) => !prev)}
            >
              <Ionicons
                name={soundEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Zoom & Self-Timer Controls Toolbar */}
        <View style={[styles.toolbarCard, isDark && styles.cardDark]}>
          {/* Zoom Selector */}
          <View style={styles.toolSection}>
            <Ionicons name="search" size={16} color={isDark ? '#CBD5E0' : '#4A5568'} />
            <Text style={[styles.toolLabel, isDark && styles.textDark]}>Zoom:</Text>
            {[0, 0.25, 0.5, 0.75, 1].map((zVal) => (
              <TouchableOpacity
                key={zVal}
                style={[styles.chip, zoom === zVal && styles.chipActive]}
                onPress={() => setZoom(zVal)}
              >
                <Text style={[styles.chipText, zoom === zVal && styles.chipTextActive]}>
                  {zVal === 0 ? '1x' : `${(zVal * 4 + 1).toFixed(0)}x`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Self Timer Selector */}
          <View style={styles.toolSection}>
            <Ionicons name="timer-outline" size={16} color={isDark ? '#CBD5E0' : '#4A5568'} />
            <Text style={[styles.toolLabel, isDark && styles.textDark]}>Timer:</Text>
            {[0, 3, 5, 10].map((tVal) => (
              <TouchableOpacity
                key={tVal}
                style={[styles.chip, timerSeconds === tVal && styles.chipActive]}
                onPress={() => setTimerSeconds(tVal)}
              >
                <Text style={[styles.chipText, timerSeconds === tVal && styles.chipTextActive]}>
                  {tVal === 0 ? 'Off' : `${tVal}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Barcode Scanner Status */}
        <View style={[styles.statusRow, isDark && styles.cardDark]}>
          <Ionicons
            name={scanned ? 'checkmark-circle' : 'qr-code-outline'}
            size={18}
            color={scanned ? '#2EC4B6' : '#4A90E2'}
          />
          <Text style={[styles.statusText, isDark && styles.textDark]}>
            Scanner Status: {scanned ? 'Code Scanned!' : 'Ready to Scan Barcode / QR'}
          </Text>
        </View>

        {/* Main Actions Grid */}
        <View style={styles.controlsGrid}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isDark && styles.ctrlBtnDark]}
            onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="#4A90E2" />
            <Text style={styles.ctrlBtnText}>Flip Camera</Text>
          </TouchableOpacity>

          {mode === 'picture' ? (
            <TouchableOpacity style={styles.capturePrimaryBtn} onPress={executeCapture}>
              <Ionicons name="radio-button-on" size={24} color="#FFFFFF" />
              <Text style={styles.capturePrimaryText}>
                {timerSeconds > 0 ? `Capture (${timerSeconds}s)` : 'Take Photo'}
              </Text>
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
            <TouchableOpacity style={[styles.ctrlBtn, isDark && styles.ctrlBtnDark]} onPress={resetScan}>
              <Ionicons name="refresh-outline" size={20} color="#4A90E2" />
              <Text style={styles.ctrlBtnText}>Scan Again</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Photo Preview */}
        {photo ? (
          <View style={[styles.previewCard, isDark && styles.cardDark]}>
            <Text style={[styles.previewTitle, isDark && styles.textDark]}>Photo Captured</Text>
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
        {video ? <VideoPlayer videoUri={video} isDark={isDark} /> : null}
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
    borderColor: '#334155',
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
  modeRowDark: {
    backgroundColor: '#1E293B',
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
    height: 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: 12,
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  gridCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  focusRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topControlOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 8,
    borderRadius: 20,
  },
  iconCircleActive: {
    backgroundColor: '#E63946',
  },
  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    elevation: 2,
  },
  toolSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  chip: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: '#4A90E2',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
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
  ctrlBtnDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
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