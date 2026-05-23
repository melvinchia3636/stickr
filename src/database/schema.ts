import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const stickerPacks = sqliteTable('sticker_packs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  identifier: text('identifier').notNull().unique(),
  publisher: text('publisher').default(''),
  trayImageFile: text('tray_image_file'),
  imageDataVersion: text('image_data_version').default('1'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  sigstickId: text('sigstick_id'),
  isAnimated: integer('is_animated', { mode: 'boolean' }).default(false).notNull()
})

export const stickers = sqliteTable('stickers', {
  id: text('id').primaryKey(),
  packId: text('pack_id')
    .notNull()
    .references(() => stickerPacks.id, { onDelete: 'cascade' }),
  imageFileName: text('image_file_name').notNull(),
  emojis: text('emojis').default(''),
  accessibilityText: text('accessibility_text').default(''),
  sortOrder: integer('sort_order').notNull()
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})
