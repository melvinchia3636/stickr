import { MD3DarkTheme } from 'react-native-paper'

import { dmSansFonts } from './fonts'

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 8,
  fonts: {
    ...MD3DarkTheme.fonts,
    ...dmSansFonts
  },
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#AED581',
    primaryContainer: '#33691E',
    onPrimary: '#1A1A1A',
    onPrimaryContainer: '#DCEDC8',
    secondary: '#9CCC65',
    secondaryContainer: '#558B2F',
    onSecondary: '#1A1A1A',
    onSecondaryContainer: '#DCEDC8',
    tertiary: '#AED581',
    tertiaryContainer: '#33691E',
    onTertiary: '#1A1A1A',
    onTertiaryContainer: '#DCEDC8',
    surface: '#1A1A1A',
    surfaceVariant: '#2A2A2A',
    background: '#121212',
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#A0A0A0',
    outline: '#333333',
    outlineVariant: '#444444',
    inversePrimary: '#558B2F',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#222222',
      level3: '#252525',
      level4: '#282828',
      level5: '#2A2A2A'
    }
  }
}
