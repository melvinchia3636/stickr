<center><h1 align="center">🧾 stickr</h1></center>

<p align="center">A React Native app for creating, browsing, and managing WhatsApp sticker packs. No ads, no bloat, no nonsense.</p>

>[!NOTE]  
> **On Supervised Vibe Coding**  
> This project is built using supervised vibe coding: where intuition drives exploration, and discipline shapes what stays.

## 🤔 The Problem

I have dozens of sacabambaspis sticker packs I wanted to download from the Sigstick official app, but a 30-second ad shows up on every single pack download. That's a massive waste of time, and you have to pay just to remove those pesky ads. I needed a way to download and manage sticker packs without sitting through ads, and I wanted full control over conversion quality for my own custom stickers without relying on bloated, ad-ridden third-party apps.

## ✅ The Solution

So yeah, instead of wasting time sitting through ads, I've decided to waste more time developing my own custom app. Initially I was hoping to ship the conversion mechanism alongside within the app itself, but I faced a lot of issues with native FFmpeg bindings and cross-platform compatibility. So I ended up decoupling it into a separate self-hosted backend server. 

The result is a React Native (Expo) mobile app paired with a lightweight Express.js + FFmpeg conversion server. Pick images from your gallery, paste a URL, or download packs from sigstick.com - the server handles conversion with automatic quality compression to meet WhatsApp's strict size limits. All sticker data is stored locally in SQLite. No ads, no accounts, no cloud dependency.

## ✨ Features

- **Sticker Conversion** - Upload images/videos and convert them to WhatsApp-compliant 512×512 WebP stickers, static or animated
- **Automatic Compression** - Progressive quality fallback (100 KB limit for static, 500 KB for animated) ensures WhatsApp never rejects your stickers
- **Tray Icon Generation** - Automatically generates 96×96 PNG tray icons with palette reduction to stay under 50 KB
- **Sigstick Integration** - Browse and download sticker packs directly from sigstick.com with a single tap
- **Local-First Storage** - All sticker packs and metadata stored in SQLite via Drizzle ORM - no internet required after download
- **WhatsApp Import** - One-tap import to WhatsApp via Android native modules (StickerContentProvider)
- **Minimal, Clean UI** - Built with React Native Paper, Reanimated, and dark/light theme support
- **Self-Hosted Server** - Run the conversion server on your own machine or network - no data leaves your control

## 🖥 Screenshots

*(Screenshots coming soon)*

## 🔬 Technologies Used

![skills](https://img.shields.io/badge/-TYPESCRIPT-FF0000?style=for-the-badge&logo=typescript&logoColor=white&color=blue)
![skills](https://img.shields.io/badge/-REACT_NATIVE-FF0000?style=for-the-badge&logo=react&logoColor=white&color=38BDF8)
![skills](https://img.shields.io/badge/-EXPO-FF0000?style=for-the-badge&logo=expo&logoColor=white&color=000020)
![skills](https://img.shields.io/badge/-EXPRESS-FF0000?style=for-the-badge&logo=express&logoColor=white&color=000000)
![skills](https://img.shields.io/badge/-FFMPEG-FF0000?style=for-the-badge&logo=ffmpeg&logoColor=white&color=007808)
![skills](https://img.shields.io/badge/-SQLITE-FF0000?style=for-the-badge&logo=sqlite&logoColor=white&color=003B57)
![skills](https://img.shields.io/badge/-DRIZZLE-FF0000?style=for-the-badge&logo=drizzle&logoColor=white&color=C5F74F)
![skills](https://img.shields.io/badge/-REACT_NATIVE_PAPER-FF0000?style=for-the-badge&logo=materialdesign&logoColor=white&color=757575)

**Mobile App:** React Native, Expo, TypeScript, Drizzle ORM, React Native Paper, Reanimated  
**Conversion Server:** Express.js, FFmpeg, Bun, Morgan  
**Tools:** cwebp, dwebp, webpmux (WebP Processing)

## ⌨️ Setup

### Prerequisites

- Bun (or Node.js 18+)
- FFmpeg installed on your system
- WebP tools: `cwebp`, `dwebp`, `webpmux`
- Android device/emulator for the mobile app

### Server

```bash
cd server
bun install
bun start
```

The server runs on `http://localhost:3000`.

### Mobile App

```bash
bun install
npx expo run:android
```

Configure the server URL in the app settings to point to your running server.

### Building the APK

> [!WARNING]
> EAS Build does **not** support native Kotlin code. Since this app includes Android native modules for WhatsApp sticker integration, you must build locally using the Gradle method above.

Unfortunately in Expo's architecture, the `android/` folder will always be completely wiped out and regenerated when doing prebuild, which also eliminates that native modules we've put inside. Therefore, before bundling the app into an APK, the app has to be prebuilt through a custom-written script. This generates the `android/` folder and injects the custom native Kotlin code for WhatsApp sticker integration:

```bash
bun run prebuild
```

Then build the release APK:

```bash
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`. You can send it to your mobile app for installation, or simply install through `adb` if it's available (which it should):

`adb install app-release.apk`


## 🧪 Running Tests

```bash
cd server
bun test
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/convert` | Convert image/video to WebP sticker (accepts `url` or `fileData` + `animated`) |
| `POST` | `/api/tray` | Generate 96×96 PNG tray icon (accepts `url` or `fileData`) |

## 📈 Status

All core functionality is complete. Custom sticker creation, sigstick downloads, tray icon generation, and WhatsApp import are all working. If you encounter any bugs, feel free to file an issue in this GitHub Repo.

## 🙏 Credits

- **[Gemini 5.5](https://antigravity.ai) via Antigravity** - Assisted with debugging and conversion logic
- **[Deepseek](https://opencode.ai) via OpenCode** - Assisted with implementation and boring tasks
- **[My Brain](https://github.com/melvinchia3636)** - For all the ideas, late-night debugging, and questionable life choices
- **[WhatsApp Stickers](https://github.com/whatsapp/stickers)** - Demo app reference for Android sticker integration
- **[sigstick.com](https://sigstick.com)** - For all the gorgeous sacabambaspis sticker packs

## 📄 License

This project is licensed under the MIT License.
