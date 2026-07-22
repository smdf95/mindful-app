# Mindful 🌿

A minimal, intuitive React Native mobile application built with Expo, designed to help users build daily meditation habits through custom sessions, local scheduling, and flexible durations.

---

## ✨ Features

* **Custom Meditation Sessions:** Choose guided themes (Breathing, Body Scan, Leaves on a Stream, Ambient Sounds) or hit *"Surprise Me"* for a randomized session.
* **Flexible Durations:** Quick 1-to-7 minute session selectors designed to fit easily into any daily schedule.
* **Daily Local Reminders:** Custom push notifications using `expo-notifications`, allowing users to configure, toggle, and manage scheduled daily reminder times.
* **Smart Time Sorting:** Reminders are automatically sorted chronologically by time from midnight for clean list management.
* **Fluid UI/UX:** Smooth native modal animations using React Native's `Animated` driver and `expo-linear-gradient` backgrounds.
* **Over-the-Air (OTA) Updates:** Configured with `expo-updates` and EAS (Expo Application Services) for instant over-the-air code deployments without requiring native APK rebuilds.

---

## 🛠️ Tech Stack

* **Framework:** [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) (SDK 52+)
* **Navigation:** React Navigation
* **Storage:** `@react-native-async-storage/async-storage`
* **Notifications:** `expo-notifications` & `@react-native-community/datetimepicker`
* **Build & Updates:** EAS Build (`.apk` output) & `expo-updates` (OTA channel updates)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Expo Go](https://expo.dev/go) app installed on your physical mobile device (or an Android Emulator / iOS Simulator)
* [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/mindful-app.git](https://github.com/YOUR-USERNAME/mindful-app.git)
   cd mindful-app
