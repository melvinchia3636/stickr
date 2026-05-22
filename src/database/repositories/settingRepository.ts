import { eq } from 'drizzle-orm'

import { getDrizzle } from '../init'
import { settings } from '../schema'

export async function getSetting(
  key: string,
  defaultValue: string
): Promise<string> {
  const rows = await getDrizzle()
    .select()
    .from(settings)
    .where(eq(settings.key, key))

  return rows.length > 0 ? rows[0].value : defaultValue
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDrizzle()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value }
    })
}
