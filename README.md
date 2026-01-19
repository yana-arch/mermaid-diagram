<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Mermaid Diagram Generator

[![Angular](https://img.shields.io/badge/Angular-17%2B-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**A professional, AI-powered tool for creating, visualizing, and managing Mermaid diagrams on any device.**

<div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
  <img src="https://github.com/user-attachments/assets/6f54ee98-b6ee-4aac-a301-21ca55c2e095" width="70%" />
  <img src="https://github.com/user-attachments/assets/37dc80d6-d40d-47e8-ba37-44ce97d0bdc6" width="28%" />
</div>

[Live Demo]([https://ai.studio/apps/drive/1NeBj8DIF0CRy70Wsb2JCTwMhbRs4Yda0](https://mermaid-diagram.vercel.app/)) • [Report Bug](https://github.com/yana-arch/mermaid-diagram/issues) • [Request Feature](https://github.com/yana-arch/mermaid-diagram/issues)

</div>

---

## 📖 Overview

**Mermaid Diagram Generator** streamlines the process of creating complex diagrams using code. Enhanced with Gemini AI, it allows users to generate charts from natural language descriptions, refine them instantly, and manage their workflow seamlessly across desktop and mobile devices.

## ✨ Key Features

### 🎨 **Visual Editing & AI**
- **Real-time Preview**: Instant visualization of your Mermaid code changes.
- **AI-Powered Generation**: Describe your diagram in plain English and let Gemini AI write the code.
- **Smart Refinement**: Ask AI to "make it more colorful" or "add a decision node".

### 📱 **Mobile First Experience**
- **Responsive Design**: Optimized interface for phones and tablets.
- **Adaptive Layout**: Smart tab switching between **Editor** and **Preview** modes on smaller screens.
- **Touch-Friendly**: Large touch targets and intuitive controls.

### 💾 **Robust History Management**
- **Local Storage**: Your work is automatically saved to your device.
- **Snapshot System**: Manually save versions of your diagrams to a persistent history.
- **Smart Search**: Filter your history by diagram content or custom labels.
- **One-Click Restore**: Instantly revert to any previous version.

### 📤 **Export & Share**
- **Multi-format Export**: Save high-quality diagrams as **SVG**, **PNG**, or **JPEG**.
- **Clipboard Support**: Copy code or images instantly.

---

## 🛠️ Tech Stack

- **Framework**: [Angular](https://angular.io/) (Standalone Components, Signals)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Mobile Runtime**: [Capacitor](https://capacitorjs.com/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Diagramming**: [Mermaid.js](https://mermaid.js.org/)

---

## 📋 System Requirements

To develop and build this project effectively, ensure your system meets the following requirements:

### Development Environment
- **Operating System**: Windows 10/11, macOS 12+, or Linux (Ubuntu 22.04+ recommended).
- **Node.js**: v18.13.0 (LTS) or higher.
- **npm**: v9.0.0 or higher.
- **Git**: v2.30+ for version control.

### Mobile Development (Android)
- **Java Development Kit (JDK)**: Version 21 is **required** for the Gradle build system.
  - *Verify with:* `java -version`
- **Android SDK**: API Level 29+ (Android 10) installed.
- **Android Command Line Tools**: latest version via SDK Manager.
- **Gradle**: Wrapper included (v8.14+).

### Browser Compatibility
The application relies on modern web features (ES2022).
- **Chrome/Edge**: v110+
- **Firefox**: v110+
- **Safari**: v16+
- **Mobile**: iOS 16+, Android 10+ (WebView 110+)

---

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yana-arch/mermaid-diagram.git
   cd mermaid-diagram
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file (optional) or configure via the UI Settings.
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:4200`

---

## 🤖 Mobile Development (Android)

Build and deploy the application as a native Android app using Capacitor.

### Prerequisites
- **JDK 21+**: Required for Gradle.
  ```bash
  sudo apt install openjdk-21-jdk-headless
  ```
- **Android SDK**: via Android Studio or Command Line Tools.

### Build Instructions

1. **Build the Web Assets**
   ```bash
   npm run build
   ```

2. **Sync Native Project**
   ```bash
   npx cap sync
   ```

3. **Compile APK**
   Use the included Gradle wrapper to build a debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   📦 **Output**: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Open in Android Studio** (Optional)
   ```bash
   npx cap open android
   ```

---

## 🤝 Contributing

Contributions are welcome! Please check the [issues](https://github.com/yana-arch/mermaid-diagram/issues) page.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
