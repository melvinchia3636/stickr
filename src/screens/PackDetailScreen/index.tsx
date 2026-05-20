import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Alert, ScrollView, AppState, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import type { AppStateStatus } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import type { PackWithStickers } from '@/types';
import { getPackWithStickers } from '@/database/packRepository';
import { Icon } from 'react-native-paper';
import { getStickerPath } from '@/services/stickerFileManager';
import { isStickerPackWhitelisted, refreshContentProvider } from '@/services/whatsappBridge';
import { regenerateContentsJson } from '@/services/contentsJsonGenerator';
import { addPackToWhatsApp, prepareSubPacks, addSubPackToWhatsApp, needsSplitting, getPartCount } from '@/services/packSplitter';
import type { SubPack } from '@/services/packSplitter';
import { Text, useTheme } from 'react-native-paper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GAP = 8;
const GRID_PADDING = 16;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - (NUM_COLUMNS - 1) * GAP) / NUM_COLUMNS;

export default function PackDetailScreen() {
  const router = useRouter();
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const t = useTheme();

  const [pack, setPack] = useState<PackWithStickers | null>(null);
  const [whitelisted, setWhitelisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const pendingSubPacksRef = useRef<SubPack[]>([]);

  const showNextSubPackPrompt = useCallback(() => {
    const remaining = pendingSubPacksRef.current;
    if (remaining.length === 0) { setAdding(false); return; }
    const next = remaining[0];
    Alert.alert('Add Next Part', `Ready to add "${next.label}" to WhatsApp?`, [
      { text: 'Skip Remaining', style: 'cancel', onPress: () => { pendingSubPacksRef.current = []; setAdding(false); }},
      { text: 'Add', onPress: async () => {
        try {
          pendingSubPacksRef.current = remaining.slice(1);
          await addSubPackToWhatsApp(next);
        } catch (e: unknown) {
          Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          pendingSubPacksRef.current = [];
          setAdding(false);
        }
      }},
    ]);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && pendingSubPacksRef.current.length > 0)
        setTimeout(() => showNextSubPackPrompt(), 500);
    });
    return () => sub.remove();
  }, [showNextSubPackPrompt]);

  useEffect(() => { loadPack(); }, []);

  const loadPack = async () => {
    const p = await getPackWithStickers(packId);
    setPack(p);
    if (p) setWhitelisted(await isStickerPackWhitelisted(p.identifier));
  };

  const handleAddToWhatsApp = async () => {
    if (!pack) return;
    if (needsSplitting(pack.stickers.length)) {
      Alert.alert('Large Sticker Pack', `This pack has ${pack.stickers.length} stickers...`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => doSplitAdd() },
      ]);
    } else {
      await doDirectAdd();
    }
  };

  const doDirectAdd = async () => {
    if (!pack) return;
    setAdding(true);
    try {
      await regenerateContentsJson(pack.id);
      await refreshContentProvider();
      await addPackToWhatsApp(pack);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      Alert.alert('Error', msg.includes('not installed') ? 'Please install WhatsApp.' : msg);
    }
    setAdding(false);
  };

  const doSplitAdd = async () => {
    if (!pack) return;
    setAdding(true);
    try {
      await regenerateContentsJson(pack.id);
      await refreshContentProvider();
      const subPacks = await prepareSubPacks(pack);
      pendingSubPacksRef.current = subPacks.slice(1);
      await addSubPackToWhatsApp(subPacks[0]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
      pendingSubPacksRef.current = [];
      setAdding(false);
    }
  };

  const handleEdit = () => router.push('/edit-pack?packId=' + packId);

  if (!pack) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.colors.onSurfaceVariant }}>Loading pack...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      {pack.stickers.length > 0 && (
        <Image source={{ uri: `file://${getStickerPath(pack.identifier, pack.stickers[0].imageFileName)}` }}
          style={{ width: '100%', height: 208, backgroundColor: t.colors.surface }} contentFit="contain"
        />
      )}

      <Text variant="headlineSmall" style={{ fontWeight: '700', color: t.colors.onSurface, paddingHorizontal: 16, paddingTop: 16 }}>{pack.name}</Text>
      <Text variant="bodyLarge" style={{ color: t.colors.onSurfaceVariant, paddingHorizontal: 16, paddingBottom: 16 }}>
        {pack.stickers.length} sticker{pack.stickers.length !== 1 ? 's' : ''}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: GRID_PADDING }}>
        {pack.stickers.map((s) => (
          <View key={s.id} style={{ width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: t.colors.surface, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            <Image source={{ uri: `file://${getStickerPath(pack.identifier, s.imageFileName)}` }}
              style={{ width: ITEM_SIZE - 10, height: ITEM_SIZE - 10 }} contentFit="contain"
            />
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        {whitelisted ? (
          <View style={{ backgroundColor: t.colors.elevation.level1, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Icon source="check-circle" size={18} color={t.colors.primary} />
            <Text variant="titleSmall" style={{ color: t.colors.primary, marginLeft: 4 }}> Already Added to WhatsApp</Text>
          </View>
        ) : (
          <TouchableOpacity style={{ paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: adding ? t.colors.surfaceDisabled : t.colors.primary }}
            onPress={handleAddToWhatsApp} disabled={adding}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon source="whatsapp" size={22} color={t.colors.onPrimary} />
              <Text style={{ color: t.colors.onPrimary, fontWeight: '700', fontSize: 18 }}>
                {adding ? 'Opening WhatsApp...' : 'Add to WhatsApp'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: t.colors.outline, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
          onPress={handleEdit}
        >
          <Icon source="pencil" size={18} color={t.colors.onSurfaceVariant} />
          <Text style={{ color: t.colors.onSurfaceVariant, fontSize: 16, fontWeight: '600' }}>Edit Pack</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
