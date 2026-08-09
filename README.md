# 🧭 Travel Guardian - React Native & Expo

**Travel Guardian** is a modern, feature-rich React Native application built with Expo SDK 54. It serves as your ultimate travel companion—allowing you to capture geotagged photos, track real-time GPS locations, scan QR/barcodes, manage a personalized travel journal, and organize an offline-capable photo gallery with search and favorite features.

---

## 🌟 Key Features & Capabilities

### 📱 1. Bottom Navigation & Responsive UX
- **Expo Router Tabs**: Smooth file-based bottom tab navigation configured with `@expo/vector-icons` (`Ionicons`).
- **Dynamic Dark/Light Mode**: Full theme adaptation (`useColorScheme`) supporting dark backgrounds (`#0F172A`) and light themes.
- **Responsive Layout**: Fluid layout calculations for mobile and tablet screens with auto-adjusting photo grids.
- **Pull to Refresh**: `RefreshControl` integrated across all main screens for instant updates.

### 📷 2. Pro Camera & Scanner
- **Photo & Video Modes**: High-quality photo capture and video recording with integrated `expo-video` player preview.
- **QR & Barcode Scanner**: Scans QR codes, EAN13, and Code128 barcodes with real-time result displays.
- **Rule of Thirds Grid**: 3x3 grid overlay toggle for professional photo composition.
- **Zoom & Tap to Focus**: Adjustable zoom levels (1x, 2x, 3x, 5x) and interactive tap-to-focus animated ring (`Animated.spring`).
- **Self-Timer & Flash Shutter**: Countdown timer options (Off, 3s, 5s, 10s) with a full-screen countdown overlay and white shutter flash animation.
- **Shutter Sound Toggle**: Mute / Unmute camera shutter feedback.

### 📍 3. GPS & Location Engine
- **Current & Live Location Tracking**: High-accuracy GPS positioning with position tracking history log.
- **Geocoding & Address Search**: Forward address geocoding and reverse geocoding to retrieve street, city, region, and country details.
- **Compass Heading**: Live compass heading angle display (°).
- **Distance Calculator**: Calculates Haversine distance (in km) between current position and any target destination.
- **Maps & Location Sharing**: One-tap Google Maps integration and coordinate sharing via native device share sheet.

### 🗺️ 4. Geotagged Travel Journal
- **Automatic GPS Geotagging**: Snaps photos with live coordinate and address overlays.
- **Journal Storage**: Persists entries to `@react-native-async-storage/async-storage`.
- **JSON Export**: Export full travel journal as a formatted `travelJournal.json` file using `expo-file-system` and `expo-sharing`.

### 🖼️ 5. Travel Photo Gallery
- **Search & Filter**: Search photos by title, city, region, or country. Filter by **All Photos** or **Favorites Only (❤️)**.
- **Photo Management**: Rename photo titles and delete photos with custom modal confirmation dialogs.
- **Fullscreen Modal Preview**: High-resolution image preview card with location details, date/time, maps shortcut, and sharing.

### ⚡ 6. Offline Address Cache
- **Offline Reverse Geocoding**: Custom caching layer (`utils/address-cache.js`) storing rounded GPS coordinate lookups in `AsyncStorage` (`offline_address_cache_v1`).
- **Seamless Offline Fallback**: Guarantees location addresses are displayed even without an active internet connection.

---

## 🛠️ Technology Stack

- **Framework**: React Native 0.81 & Expo SDK 54
- **Routing**: Expo Router 6 (File-based navigation)
- **Camera & Video**: `expo-camera` & `expo-video`
- **Location Services**: `expo-location`
- **Storage**: `@react-native-async-storage/async-storage`
- **File System & Sharing**: `expo-file-system` & `expo-sharing`
- **Icons & UI**: `@expo/vector-icons` (`Ionicons`)

---

## 📁 Project Structure

```text
Travel_guardian_React_Native/
├── app/
│   ├── _layout.jsx             # Root Stack layout
│   └── (tabs)/
│       ├── _layout.jsx         # Bottom Navigation Tabs configuration
│       ├── index.jsx           # Home Dashboard & Quick Access
│       ├── camera.jsx          # Pro Camera, Video & Barcode Scanner
│       ├── location.jsx        # GPS Tracking, Compass & Distance Calculator
│       ├── camera-location.jsx # Geotagged Travel Journal & JSON Export
│       ├── gallery.jsx         # Image Gallery, Search, Favorites & Edit/Delete
│       └── explore.jsx         # App Explore & Tech Overview
├── utils/
│   └── address-cache.js        # Offline Address Cache utility
├── constants/
│   └── theme.ts                # Application theme colors
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm/npx installed.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/nishit546/Travel_guardian_React_Native.git
cd Travel_guardian_React_Native
npm install
```

### 3. Running the App
Start the Expo development server:

```bash
npx expo start
```

Press:
- `a` to open in **Android Emulator**
- `i` to open in **iOS Simulator**
- `w` to open in **Web Browser**
- Or scan the QR code with **Expo Go** on your mobile device.

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm start` / `npx expo start` | Starts the Expo development server |
| `npm run android` | Starts app on connected Android device/emulator |
| `npm run ios` | Starts app on iOS simulator |
| `npm run web` | Launches web preview |
| `npm run lint` | Runs `expo lint` to verify code quality |

---

## 🔒 Permissions

The app requests the following device permissions:
- **Camera**: Required for photo/video recording and QR code scanning.
- **Microphone**: Required for audio capture during video recording.
- **Location**: Required for GPS position tracking and photo geotagging.

Clear permission request banners and fallback UI states are displayed if any permission is denied.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
