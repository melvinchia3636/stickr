import { MD3LightTheme } from 'react-native-paper'

import { dmSansFonts } from './fonts'

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 8,
  fonts: {
    ...MD3LightTheme.fonts,
    ...dmSansFonts
  },
  colors: {
    ...MD3LightTheme.colors,
    primary: '#558B2F',
    primaryContainer: '#F1F8E9',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#33691E',
    secondary: '#689F38',
    secondaryContainer: '#DCEDC8',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#33691E',
    tertiary: '#7CB342',
    tertiaryContainer: '#F1F8E9',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#33691E',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#F8F9FA',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#555',
    outline: '#E0E0E0',
    outlineVariant: '#E0E0E0',
    inversePrimary: '#AED581',
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#F0F0F0',
      level3: '#EEEEEE',
      level4: '#EBEBEB',
      level5: '#E8E8E8'
    }
  }
}
