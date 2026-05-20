import React, { useCallback, useRef, useState } from "react";
import {
  View,
  FlatList,
  Alert,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Icon } from "react-native-paper";
import { FAB, Text, Surface, useTheme } from "react-native-paper";
import { useFocusEffect, useRouter } from 'expo-router';

import type { StickerPack } from "@/types";
import { getAllPacks, deletePack } from '@/database/packRepository';
import { getStickerCountForPack } from '@/database/packRepository';
import { deletePackDir } from '@/services/stickerFileManager';
import { refreshContentProvider } from '@/services/whatsappBridge';
import PackCard from '@/components/PackCard';

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [stickerCounts, setStickerCounts] = useState<Record<string, number>>(
    {},
  );
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  };

  const close = () => {
    setOpen(false);
    Animated.spring(anim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  };

  const loadPacks = useCallback(async () => {
    const all = await getAllPacks();
    setPacks(all);
    const c: Record<string, number> = {};
    for (const p of all) c[p.id] = await getStickerCountForPack(p.id);
    setStickerCounts(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPacks();
    }, [loadPacks]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPacks();
    setRefreshing(false);
  };

  const handleDelete = (pack: StickerPack) => {
    Alert.alert("Delete Pack", `Delete "${pack.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePackDir(pack.identifier);
          await deletePack(pack.id);
          await refreshContentProvider();
          await loadPacks();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: StickerPack }) => (
    <PackCard
      pack={item}
      stickerCount={stickerCounts[item.id] || 0}
      onPress={() => router.push("/pack-detail?packId=" + item.id)}
      onLongPress={() => handleDelete(item)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "baseline",
        }}
      >
        <Text
          variant="titleLarge"
          style={{ fontWeight: "700", color: t.colors.onSurface }}
        >
          Stickers Library
        </Text>
        {packs.length > 0 && (
          <Text
            variant="bodySmall"
            style={{ color: t.colors.onSurfaceVariant, marginLeft: 8 }}
          >
            ({packs.length})
          </Text>
        )}
      </View>

      {open && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }}
          activeOpacity={1}
          onPress={close}
        />
      )}

      <View
        style={{
          position: "absolute",
          bottom: 96,
          right: 24,
          alignItems: "flex-end",
          zIndex: 20,
          opacity: open ? 1 : 0,
        }}
        pointerEvents={open ? "auto" : "none"}
      >
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          }}
        >
          <Surface
            style={{ borderRadius: 999, marginBottom: 12, elevation: 4 }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 20,
                height: 44,
              }}
              onPress={() => {
                close();
                router.push("/sigstick-search");
              }}
            >
              <Icon source="sticker-emoji" size={20} color={t.colors.primary} />
              <Text
                variant="labelLarge"
                style={{ marginLeft: 8, color: t.colors.onSurface }}
              >
                Browse SigStick
              </Text>
            </TouchableOpacity>
          </Surface>
        </Animated.View>
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          }}
        >
          <Surface
            style={{ borderRadius: 999, marginBottom: 12, elevation: 4 }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 20,
                height: 44,
              }}
              onPress={() => {
                close();
                router.push("/create-pack");
              }}
            >
              <Icon source="plus" size={20} color={t.colors.primary} />
              <Text
                variant="labelLarge"
                style={{ marginLeft: 8, color: t.colors.onSurface }}
              >
                Create Pack
              </Text>
            </TouchableOpacity>
          </Surface>
        </Animated.View>
      </View>

      <FAB
        icon={() => (
          <Animated.View
            style={{
              transform: [
                {
                  rotate: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                  }),
                },
              ],
            }}
          >
            <Icon source="plus" size={24} color={t.colors.onPrimary} />
          </Animated.View>
        )}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          zIndex: 30,
          backgroundColor: t.colors.primary,
        }}
        onPress={toggle}
      />

      {packs.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Icon
              source="sticker-emoji"
              size={64}
              color={t.colors.onSurfaceVariant}
            />
          </View>
          <Text
            variant="titleMedium"
            style={{ color: t.colors.onSurface, marginBottom: 8 }}
          >
            No sticker packs yet
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: t.colors.onSurfaceVariant, textAlign: "center" }}
          >
            Create your own pack or browse SigStick to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={packs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
