import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'

export function createGreenTheme(base: typeof MD3LightTheme) {
  return {
    ...base,
    roundness: 8,
    fonts: {
      ...base.fonts,
      default: { ...base.fonts.default, fontFamily: 'DMSans_400Regular' },
      displayLarge: {
        ...base.fonts.displayLarge,
        fontFamily: 'DMSans_400Regular'
      },
      displayMedium: {
        ...base.fonts.displayMedium,
        fontFamily: 'DMSans_400Regular'
      },
      displaySmall: {
        ...base.fonts.displaySmall,
        fontFamily: 'DMSans_400Regular'
      },
      headlineLarge: {
        ...base.fonts.headlineLarge,
        fontFamily: 'DMSans_400Regular'
      },
      headlineMedium: {
        ...base.fonts.headlineMedium,
        fontFamily: 'DMSans_400Regular'
      },
      headlineSmall: {
        ...base.fonts.headlineSmall,
        fontFamily: 'DMSans_500Medium'
      },
      titleLarge: { ...base.fonts.titleLarge, fontFamily: 'DMSans_700Bold' },
      titleMedium: {
        ...base.fonts.titleMedium,
        fontFamily: 'DMSans_500Medium'
      },
      titleSmall: { ...base.fonts.titleSmall, fontFamily: 'DMSans_500Medium' },
      labelLarge: { ...base.fonts.labelLarge, fontFamily: 'DMSans_500Medium' },
      labelMedium: {
        ...base.fonts.labelMedium,
        fontFamily: 'DMSans_500Medium'
      },
      labelSmall: { ...base.fonts.labelSmall, fontFamily: 'DMSans_400Regular' },
      bodyLarge: { ...base.fonts.bodyLarge, fontFamily: 'DMSans_400Regular' },
      bodyMedium: { ...base.fonts.bodyMedium, fontFamily: 'DMSans_400Regular' },
      bodySmall: { ...base.fonts.bodySmall, fontFamily: 'DMSans_400Regular' }
    },
    colors: {
      ...base.colors,
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
}

export function createGreenDarkTheme(base: typeof MD3DarkTheme) {
  return {
    ...base,
    roundness: 2,
    fonts: {
      ...base.fonts,
      default: { ...base.fonts.default, fontFamily: 'DMSans_400Regular' },
      displayLarge: {
        ...base.fonts.displayLarge,
        fontFamily: 'DMSans_400Regular'
      },
      displayMedium: {
        ...base.fonts.displayMedium,
        fontFamily: 'DMSans_400Regular'
      },
      displaySmall: {
        ...base.fonts.displaySmall,
        fontFamily: 'DMSans_400Regular'
      },
      headlineLarge: {
        ...base.fonts.headlineLarge,
        fontFamily: 'DMSans_400Regular'
      },
      headlineMedium: {
        ...base.fonts.headlineMedium,
        fontFamily: 'DMSans_400Regular'
      },
      headlineSmall: {
        ...base.fonts.headlineSmall,
        fontFamily: 'DMSans_500Medium'
      },
      titleLarge: { ...base.fonts.titleLarge, fontFamily: 'DMSans_700Bold' },
      titleMedium: {
        ...base.fonts.titleMedium,
        fontFamily: 'DMSans_500Medium'
      },
      titleSmall: { ...base.fonts.titleSmall, fontFamily: 'DMSans_500Medium' },
      labelLarge: { ...base.fonts.labelLarge, fontFamily: 'DMSans_500Medium' },
      labelMedium: {
        ...base.fonts.labelMedium,
        fontFamily: 'DMSans_500Medium'
      },
      labelSmall: { ...base.fonts.labelSmall, fontFamily: 'DMSans_400Regular' },
      bodyLarge: { ...base.fonts.bodyLarge, fontFamily: 'DMSans_400Regular' },
      bodyMedium: { ...base.fonts.bodyMedium, fontFamily: 'DMSans_400Regular' },
      bodySmall: { ...base.fonts.bodySmall, fontFamily: 'DMSans_400Regular' }
    },
    colors: {
      ...base.colors,
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
}
