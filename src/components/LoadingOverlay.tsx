import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: Props) {
  const t = useTheme();
  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
      <Surface style={{ borderRadius: 12, padding: 24, elevation: 6 }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </Surface>
    </View>
  );
}
