#!/bin/bash
set -e

BACKUP_DIR="src/native/backup"
SRC="android/app/src/main/java/io/github/melvinchia3636/stickr"
MANIFEST="android/app/src/main/AndroidManifest.xml"
MANIFEST_MARKER="AddStickerPackActivity"

echo "📦 stickr Android prebuild"

# --- Backup ---
if [ ! -d "$SRC" ]; then
  echo "⚠️  No custom native source found at $SRC - skipping backup"
else
  mkdir -p "$BACKUP_DIR"
  cp "$SRC"/*.kt "$BACKUP_DIR/"
  echo "✅ Backed up $(ls "$SRC"/*.kt | wc -l | tr -d ' ') files"
fi

# --- Prebuild ---
echo "🏗️  Running expo prebuild --clean --platform android..."
bun expo prebuild --clean --platform android

# --- Restore Kotlin files ---
if [ -d "$BACKUP_DIR" ]; then
  mkdir -p "$SRC"
  cp "$BACKUP_DIR"/*.kt "$SRC/"
  echo "✅ Restored $(ls "$SRC"/*.kt | wc -l | tr -d ' ') custom files"
fi

# --- Restore manifest entries ---
if grep -q "$MANIFEST_MARKER" "$MANIFEST" 2>/dev/null; then
  echo "✅ Manifest already has custom entries"
else
  awk '
    /<\/queries>/ {
      print "    <package android:name=\"com.whatsapp\" />"
      print "    <package android:name=\"com.whatsapp.w4b\" />"
    }
    /<\/application>/ {
      print "    <activity android:name=\".AddStickerPackActivity\" android:exported=\"false\"/>"
      print "    <provider android:name=\".StickerContentProvider\" android:authorities=\"\${applicationId}.stickercontentprovider\" android:enabled=\"true\" android:exported=\"true\" android:readPermission=\"com.whatsapp.sticker.READ\"/>"
    }
    { print }
  ' "$MANIFEST" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
  echo "✅ Added custom entries to AndroidManifest.xml"
fi

echo "🎉 Android prebuild complete"
