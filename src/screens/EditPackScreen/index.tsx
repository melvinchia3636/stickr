import React, { useState, useEffect } from "react";
import { View, Alert, ScrollView, TouchableOpacity } from "react-native";
import { Icon } from "react-native-paper";
import { Text, TextInput, Button, Surface, useTheme } from "react-native-paper";
import { useRouter, useLocalSearchParams } from 'expo-router';

import type { PackWithStickers } from '@/types';
import {
  getPackWithStickers,
  updatePackName,
  deletePack,
  deleteSticker,
} from '@/database/packRepository';
import {
  deletePackDir,
  deleteStickerFile,
} from '@/services/stickerFileManager';
import { regenerateContentsJson } from '@/services/contentsJsonGenerator';
import { refreshContentProvider } from '@/services/whatsappBridge';
import StickerGrid from '@/components/StickerGrid';

export default function EditPackScreen() {
  const router = useRouter();
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const t = useTheme();
  const [pack, setPack] = useState<PackWithStickers | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadPack();
  }, []);

  const loadPack = async () => {
    const p = await getPackWithStickers(packId);
    if (p) {
      setPack(p);
      setNewName(p.name);
    }
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Pack name cannot be empty");
      return;
    }
    await updatePackName(packId, trimmed);
    await regenerateContentsJson(packId);
    await refreshContentProvider();
    Alert.alert("Saved", "Pack name updated");
  };

  const handleDeleteSticker = (stickerId: string, fileName: string) => {
    Alert.alert("Delete Sticker", "Remove this sticker from the pack?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!pack) return;
          await deleteStickerFile(pack.identifier, fileName);
          await deleteSticker(stickerId);
          await regenerateContentsJson(packId);
          await refreshContentProvider();
          await loadPack();
        },
      },
    ]);
  };

  const handleDeletePack = () => {
    Alert.alert("Delete Pack", "This will permanently delete this pack.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!pack) return;
          await deletePackDir(pack.identifier);
          await deletePack(packId);
          await refreshContentProvider();
          router.back();
        },
      },
    ]);
  };

  if (!pack) return null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      style={{ flex: 1, backgroundColor: t.colors.background }}
    >
      <View style={{ gap: 8 }}>
        <TextInput
          mode="flat"
          label="Pack Name"
          value={newName}
          onChangeText={setNewName}
          maxLength={50}
          style={{ flex: 1 }}
        />
        <Button
          mode="contained"
          onPress={handleSaveName}
          icon={() => (
            <Icon source="check" size={20} color={t.colors.onPrimary} />
          )}
        >
          Save
        </Button>
      </View>

      <Text
        variant="titleMedium"
        style={{ color: t.colors.onSurface, marginTop: 20, marginBottom: 8 }}
      >
        Stickers ({pack.stickers.length})
      </Text>

      <StickerGrid identifier={pack.identifier} stickers={pack.stickers} />

      <View style={{ marginTop: 8 }}>
        {pack.stickers.map((s) => (
          <Surface
            key={s.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: t.colors.surface,
              padding: 12,
              borderRadius: 8,
              marginBottom: 4,
              elevation: 1,
            }}
          >
            <Text
              variant="bodyMedium"
              style={{ color: t.colors.onSurface, flex: 1 }}
              numberOfLines={1}
            >
              {s.imageFileName}
            </Text>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              onPress={() => handleDeleteSticker(s.id, s.imageFileName)}
            >
              <Icon source="close-circle" size={16} color={t.colors.error} />
              <Text
                style={{
                  color: t.colors.error,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Remove
              </Text>
            </TouchableOpacity>
          </Surface>
        ))}
      </View>

      <Button
        mode="outlined"
        textColor={t.colors.error}
        style={{ marginTop: 24, borderColor: t.colors.error }}
        onPress={handleDeletePack}
        icon={() => (
          <Icon source="delete-outline" size={20} color={t.colors.error} />
        )}
      >
        Delete Pack
      </Button>
    </ScrollView>
  );
}
