import { MD3LightTheme } from 'react-native-paper'
import type { MD3Typescale } from 'react-native-paper/lib/typescript/types'

const fontConfig: Record<keyof MD3Typescale | 'default', { fontFamily: string }> = {
  default: { fontFamily: 'DMSans_400Regular' },
  displayLarge: { fontFamily: 'DMSans_400Regular' },
  displayMedium: { fontFamily: 'DMSans_400Regular' },
  displaySmall: { fontFamily: 'DMSans_400Regular' },
  headlineLarge: { fontFamily: 'DMSans_400Regular' },
  headlineMedium: { fontFamily: 'DMSans_400Regular' },
  headlineSmall: { fontFamily: 'DMSans_500Medium' },
  titleLarge: { fontFamily: 'DMSans_700Bold' },
  titleMedium: { fontFamily: 'DMSans_500Medium' },
  titleSmall: { fontFamily: 'DMSans_500Medium' },
  labelLarge: { fontFamily: 'DMSans_500Medium' },
  labelMedium: { fontFamily: 'DMSans_500Medium' },
  labelSmall: { fontFamily: 'DMSans_400Regular' },
  bodyLarge: { fontFamily: 'DMSans_400Regular' },
  bodyMedium: { fontFamily: 'DMSans_400Regular' },
  bodySmall: { fontFamily: 'DMSans_400Regular' }
}

function getThemeFonts(): MD3Typescale {
  const baseFonts = MD3LightTheme.fonts
  const merged = {} as Record<keyof MD3Typescale, unknown>
  const keys = Object.keys(baseFonts) as (keyof MD3Typescale)[]
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    merged[key] = {
      ...baseFonts[key],
      ...fontConfig[key]
    }
  }
  
  return merged as MD3Typescale
}

export const dmSansFonts = getThemeFonts()
