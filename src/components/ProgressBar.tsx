import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar as PaperProgressBar, useTheme } from 'react-native-paper';

interface Props {
  progress: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ progress, total, label }: Props) {
  const t = useTheme();
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      {label && <Text style={{ fontSize: 14, color: t.colors.onSurfaceVariant, marginBottom: 4 }}>{label}</Text>}
      <PaperProgressBar progress={pct / 100} color={t.colors.primary} />
      <Text style={{ fontSize: 12, color: t.colors.onSurfaceVariant, marginTop: 4, textAlign: 'right' }}>
        {progress} / {total}
      </Text>
    </View>
  );
}
