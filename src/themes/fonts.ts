import type { MD3Typescale } from 'react-native-paper/lib/typescript/types'

export const dmSansFonts = {
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
} satisfies Record<keyof MD3Typescale | 'default', { fontFamily: string }>
