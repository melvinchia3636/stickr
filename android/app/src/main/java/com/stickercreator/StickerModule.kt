package com.stickercreator

import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import org.json.JSONObject
import java.io.File

class StickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "StickerModule"
        private const val CONSUMER_WHATSAPP_PACKAGE = "com.whatsapp"
        private const val MAX_STICKER_SIZE_STATIC = 100 * 1024L
        private const val MAX_STICKER_SIZE_ANIMATED = 500 * 1024L
        private const val MAX_TRAY_SIZE = 50 * 1024L
        private const val STICKER_DIMENSION = 512
        private const val TRAY_DIMENSION = 96
        private const val MIN_STICKERS = 3
        private const val MAX_STICKERS = 30
    }

    override fun getName(): String = "StickerModule"

    private fun getStickersDir(): File = File(reactApplicationContext.filesDir, "stickers")

    @ReactMethod
    fun validateStickerPack(identifier: String, promise: Promise) {
        Log.d(TAG, "=== VALIDATE PACK: $identifier ===")
        val errors = mutableListOf<String>()
        val warnings = mutableListOf<String>()

        val packDir = File(getStickersDir(), identifier)
        if (!packDir.exists()) {
            Log.e(TAG, "  FAIL: pack directory does not exist: ${packDir.absolutePath}")
            promise.reject("VALIDATE_ERROR", "Pack directory not found: ${packDir.absolutePath}")
            return
        }
        Log.d(TAG, "  pack dir: ${packDir.absolutePath}")
        Log.d(TAG, "  files: ${packDir.listFiles()?.map { "${it.name} (${it.length()} bytes)" }?.joinToString()}")

        val contentsFile = File(packDir, "contents.json")
        if (!contentsFile.exists()) {
            errors.add("contents.json not found in ${packDir.absolutePath}")
            Log.e(TAG, "  FAIL: contents.json missing")
            returnValidation(errors, warnings, promise)
            return
        }

        val json: JSONObject
        try {
            json = JSONObject(contentsFile.readText())
        } catch (e: Exception) {
            errors.add("contents.json is invalid JSON: ${e.message}")
            Log.e(TAG, "  FAIL: invalid JSON: ${e.message}")
            returnValidation(errors, warnings, promise)
            return
        }

        val packsArr = json.optJSONArray("sticker_packs")
        if (packsArr == null || packsArr.length() == 0) {
            errors.add("contents.json has no sticker_packs array")
            Log.e(TAG, "  FAIL: no sticker_packs array")
            returnValidation(errors, warnings, promise)
            return
        }

        val packObj = packsArr.getJSONObject(0)
        val packIdentifier = packObj.optString("identifier", "")
        val packName = packObj.optString("name", "")
        val publisher = packObj.optString("publisher", "")
        val trayImageFile = packObj.optString("tray_image_file", "")
        val animatedFlag = packObj.optBoolean("animated_sticker_pack", false)
        val stickersArr = packObj.optJSONArray("stickers")

        Log.d(TAG, "  identifier: '$packIdentifier'")
        Log.d(TAG, "  name: '$packName'")
        Log.d(TAG, "  publisher: '$publisher'")
        Log.d(TAG, "  tray_image_file: '$trayImageFile'")
        Log.d(TAG, "  animated_sticker_pack: $animatedFlag")
        Log.d(TAG, "  stickers count: ${stickersArr?.length() ?: 0}")

        if (packIdentifier.isEmpty()) errors.add("identifier is empty")
        if (packName.isEmpty()) errors.add("name is empty")
        if (publisher.isEmpty()) errors.add("publisher is empty")

        // Validate tray icon
        if (trayImageFile.isEmpty()) {
            errors.add("tray_image_file is empty")
        } else {
            val trayFile = File(packDir, trayImageFile)
            if (!trayFile.exists()) {
                errors.add("tray file '$trayImageFile' does not exist at ${trayFile.absolutePath}")
                Log.e(TAG, "  FAIL: tray file missing: ${trayFile.absolutePath}")
            } else {
                val traySize = trayFile.length()
                Log.d(TAG, "  tray file size: $traySize bytes (max: $MAX_TRAY_SIZE)")
                if (traySize > MAX_TRAY_SIZE) {
                    errors.add("tray file too large: $traySize bytes (max: $MAX_TRAY_SIZE)")
                }

                val trayOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeFile(trayFile.absolutePath, trayOpts)
                val trayW = trayOpts.outWidth
                val trayH = trayOpts.outHeight
                val trayMime = trayOpts.outMimeType ?: "unknown"
                Log.d(TAG, "  tray dimensions: ${trayW}x${trayH}, mime: $trayMime")

                if (trayW != TRAY_DIMENSION || trayH != TRAY_DIMENSION) {
                    errors.add("tray must be ${TRAY_DIMENSION}x${TRAY_DIMENSION} but is ${trayW}x${trayH}")
                }
                if (!trayMime.contains("png")) {
                    errors.add("tray must be PNG but mime is $trayMime")
                }
                if (WebPUtils.isAnimatedWebP(trayFile)) {
                    errors.add("tray file is animated WebP — must be static PNG")
                }
            }
        }

        // Validate stickers
        val stickerCount = stickersArr?.length() ?: 0
        if (stickerCount < MIN_STICKERS) {
            errors.add("too few stickers: $stickerCount (min: $MIN_STICKERS)")
        }
        if (stickerCount > MAX_STICKERS) {
            errors.add("too many stickers: $stickerCount (max: $MAX_STICKERS)")
        }

        var hasAnimated = false
        for (i in 0 until stickerCount) {
            val stickerObj = stickersArr!!.getJSONObject(i)
            val imageFile = stickerObj.optString("image_file", "")
            val emojis = stickerObj.optJSONArray("emojis")

            if (imageFile.isEmpty()) {
                errors.add("sticker[$i]: image_file is empty")
                continue
            }

            val stickerFile = File(packDir, imageFile)
            if (!stickerFile.exists()) {
                errors.add("sticker[$i]: file '$imageFile' does not exist")
                Log.e(TAG, "  FAIL: sticker[$i] missing: ${stickerFile.absolutePath}")
                continue
            }

            val fileSize = stickerFile.length()
            val animated = WebPUtils.isAnimatedWebP(stickerFile)
            if (animated) hasAnimated = true
            val maxSize = if (animated) MAX_STICKER_SIZE_ANIMATED else MAX_STICKER_SIZE_STATIC

            Log.d(TAG, "  sticker[$i]: $imageFile size=${fileSize}B animated=$animated max=$maxSize")

            if (fileSize > maxSize) {
                errors.add("sticker[$i] '$imageFile' too large: $fileSize bytes (max: $maxSize for ${if (animated) "animated" else "static"})")
            }

            if (!imageFile.endsWith(".webp")) {
                errors.add("sticker[$i] '$imageFile' must be .webp format")
            }

            val stickerOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(stickerFile.absolutePath, stickerOpts)
            val sw = stickerOpts.outWidth
            val sh = stickerOpts.outHeight
            if (sw > 0 && sh > 0) {
                if (sw != STICKER_DIMENSION || sh != STICKER_DIMENSION) {
                    if (!animated) {
                        errors.add("sticker[$i] '$imageFile' must be ${STICKER_DIMENSION}x${STICKER_DIMENSION} but is ${sw}x${sh}")
                    } else {
                        if (sw > STICKER_DIMENSION || sh > STICKER_DIMENSION) {
                            errors.add("sticker[$i] '$imageFile' animated too large: ${sw}x${sh} (max ${STICKER_DIMENSION}x${STICKER_DIMENSION})")
                        } else {
                            warnings.add("sticker[$i] '$imageFile' animated ${sw}x${sh} (not exactly 512x512 but within limit)")
                        }
                    }
                }
            }

            if (emojis == null || emojis.length() == 0) {
                warnings.add("sticker[$i] '$imageFile' has no emojis (WhatsApp may reject)")
            }
        }

        if (hasAnimated && !animatedFlag) {
            errors.add("pack contains animated stickers but animated_sticker_pack is false — must be true")
        }
        if (!hasAnimated && animatedFlag) {
            warnings.add("animated_sticker_pack is true but no animated stickers found")
        }

        Log.d(TAG, "=== VALIDATION RESULT ===")
        Log.d(TAG, "  errors: ${errors.size}")
        for (e in errors) Log.e(TAG, "  ERROR: $e")
        Log.d(TAG, "  warnings: ${warnings.size}")
        for (w in warnings) Log.w(TAG, "  WARN: $w")
        Log.d(TAG, "  PASS: ${errors.isEmpty()}")

        returnValidation(errors, warnings, promise)
    }

    private fun returnValidation(errors: List<String>, warnings: List<String>, promise: Promise) {
        val result = Arguments.createMap().apply {
            putBoolean("valid", errors.isEmpty())
            putArray("errors", Arguments.createArray().apply { errors.forEach { pushString(it) } })
            putArray("warnings", Arguments.createArray().apply { warnings.forEach { pushString(it) } })
        }
        promise.resolve(result)
    }

    private fun logStickerPackDetails(identifier: String) {
        Log.d(TAG, "=== STICKER PACK DETAILS LOGGING START ===")
        Log.d(TAG, "  Pack Identifier: $identifier")
        val packDir = File(getStickersDir(), identifier)
        if (!packDir.exists()) {
            Log.e(TAG, "  FAIL: Pack directory does not exist: ${packDir.absolutePath}")
            Log.d(TAG, "=== STICKER PACK DETAILS LOGGING END ===")
            return
        }
        Log.d(TAG, "  Pack directory exists: ${packDir.absolutePath}")
        val files = packDir.listFiles()
        if (files == null) {
            Log.e(TAG, "  FAIL: listFiles() returned null")
            Log.d(TAG, "=== STICKER PACK DETAILS LOGGING END ===")
            return
        }
        Log.d(TAG, "  Files in directory: ${files.size}")
        for (f in files) {
            Log.d(TAG, "    - ${f.name} (${f.length()} bytes)")
        }

        val contentsFile = File(packDir, "contents.json")
        if (!contentsFile.exists()) {
            Log.e(TAG, "  FAIL: contents.json not found")
            Log.d(TAG, "=== STICKER PACK DETAILS LOGGING END ===")
            return
        }

        val contentsText = contentsFile.readText()
        Log.d(TAG, "  contents.json text: $contentsText")

        try {
            val json = JSONObject(contentsText)
            val packsArr = json.optJSONArray("sticker_packs")
            if (packsArr == null || packsArr.length() == 0) {
                Log.e(TAG, "  FAIL: sticker_packs array is missing or empty")
                Log.d(TAG, "=== STICKER PACK DETAILS LOGGING END ===")
                return
            }

            val packObj = packsArr.getJSONObject(0)
            val trayImage = packObj.optString("tray_image_file", "")
            val animatedFlag = packObj.optBoolean("animated_sticker_pack", false)
            val stickersArr = packObj.optJSONArray("stickers")

            Log.d(TAG, "  Metadata:")
            Log.d(TAG, "    - name: ${packObj.optString("name")}")
            Log.d(TAG, "    - publisher: ${packObj.optString("publisher")}")
            Log.d(TAG, "    - tray_image_file: $trayImage")
            Log.d(TAG, "    - animated_sticker_pack: $animatedFlag")
            Log.d(TAG, "    - stickers count: ${stickersArr?.length() ?: 0}")

            if (trayImage.isNotEmpty()) {
                val trayFile = File(packDir, trayImage)
                if (!trayFile.exists()) {
                    Log.e(TAG, "    - Tray file DOES NOT exist: ${trayFile.absolutePath}")
                } else {
                    val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeFile(trayFile.absolutePath, opts)
                    val isAnimatedWebP = WebPUtils.isAnimatedWebP(trayFile)
                    Log.d(TAG, "    - Tray file details: size=${trayFile.length()}B dimensions=${opts.outWidth}x${opts.outHeight} mime=${opts.outMimeType} isAnimated=$isAnimatedWebP")
                }
            }

            if (stickersArr != null) {
                for (i in 0 until stickersArr.length()) {
                    val stickerObj = stickersArr.getJSONObject(i)
                    val imageFile = stickerObj.optString("image_file")
                    val emojis = stickerObj.optJSONArray("emojis")
                    val emojisList = mutableListOf<String>()
                    if (emojis != null) {
                        for (k in 0 until emojis.length()) emojisList.add(emojis.getString(k))
                    }

                    Log.d(TAG, "    - Sticker [$i]: image_file=$imageFile emojis=$emojisList")
                    if (imageFile.isNotEmpty()) {
                        val sFile = File(packDir, imageFile)
                        if (!sFile.exists()) {
                            Log.e(TAG, "      FAIL: File DOES NOT exist: ${sFile.absolutePath}")
                        } else {
                            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                            BitmapFactory.decodeFile(sFile.absolutePath, opts)
                            val isAnimatedWebP = WebPUtils.isAnimatedWebP(sFile)
                            Log.d(TAG, "      File details: size=${sFile.length()}B dimensions=${opts.outWidth}x${opts.outHeight} mime=${opts.outMimeType} isAnimated=$isAnimatedWebP")
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "  FAIL: Error parsing contents.json", e)
        }
        Log.d(TAG, "=== STICKER PACK DETAILS LOGGING END ===")
    }

    @ReactMethod
    fun addStickerPackToWhatsApp(identifier: String, packName: String, promise: Promise) {
        Log.d(TAG, "=== addStickerPackToWhatsApp START ===")
        Log.d(TAG, "  identifier: $identifier")
        Log.d(TAG, "  packName: $packName")
        try {
            logStickerPackDetails(identifier)

            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                Log.e(TAG, "  getCurrentActivity() returned null")
                promise.reject("NO_ACTIVITY", "No current activity available")
                return
            }

            val authority = "${reactApplicationContext.packageName}.stickercontentprovider"
            Log.d(TAG, "  authority: $authority")

            val intent = Intent().apply {
                action = "com.whatsapp.intent.action.ENABLE_STICKER_PACK"
                putExtra("sticker_pack_id", identifier)
                putExtra("sticker_pack_authority", authority)
                putExtra("sticker_pack_name", packName)
                setPackage(CONSUMER_WHATSAPP_PACKAGE)
            }

            Log.d(TAG, "  Intent extras: ${intent.extras}")
            Log.d(TAG, "  Calling startActivityForResult...")
            activity!!.startActivityForResult(intent, 200)
            Log.d(TAG, "  startActivityForResult returned successfully")
            promise.resolve(true)
        } catch (e: ActivityNotFoundException) {
            Log.e(TAG, "  WhatsApp not found", e)
            promise.reject("WHATSAPP_NOT_FOUND", "WhatsApp is not installed", e)
        } catch (e: Exception) {
            Log.e(TAG, "  Exception", e)
            promise.reject("ERROR", "Failed to add sticker pack: ${e.message}", e)
        }
        Log.d(TAG, "=== addStickerPackToWhatsApp END ===")
    }

    @ReactMethod
    fun isStickerPackWhitelisted(identifier: String, promise: Promise) {
        val ourAuthority = "${reactApplicationContext.packageName}.stickercontentprovider"
        Log.d(TAG, "isStickerPackWhitelisted() identifier=$identifier ourAuthority=$ourAuthority")

        val whatsappAuthorities = listOf(
            "com.whatsapp.provider.sticker_whitelist_check",
            "com.whatsapp.w4b.provider.sticker_whitelist_check"
        )

        for (waAuthority in whatsappAuthorities) {
            try {
                val queryUri = Uri.Builder()
                    .scheme("content")
                    .authority(waAuthority)
                    .appendPath("is_whitelisted")
                    .appendQueryParameter("authority", ourAuthority)
                    .appendQueryParameter("identifier", identifier)
                    .build()
                Log.d(TAG, "  querying: $queryUri")

                val cursor = reactApplicationContext.contentResolver.query(queryUri, null, null, null, null)
                if (cursor == null) {
                    Log.d(TAG, "  cursor is null for $waAuthority")
                    continue
                }

                cursor.use {
                    Log.d(TAG, "  cursor count=${it.count} columns=${it.columnNames.joinToString()}")
                    if (it.moveToFirst()) {
                        val colIndex = it.getColumnIndex("result")
                        Log.d(TAG, "  result colIndex=$colIndex")
                        if (colIndex >= 0) {
                            val result = it.getInt(colIndex)
                            Log.d(TAG, "  result value=$result")
                            if (result == 1) {
                                promise.resolve(true)
                                return
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.d(TAG, "  query failed for $waAuthority: ${e.message}")
            }
        }

        Log.d(TAG, "  not whitelisted")
        promise.resolve(false)
    }

    @ReactMethod
    fun refreshContentProvider(promise: Promise) {
        try {
            val authority = "${reactApplicationContext.packageName}.stickercontentprovider"
            val uri = Uri.parse("content://$authority")
            reactApplicationContext.contentResolver.notifyChange(uri, null)
            Log.d(TAG, "ContentProvider refreshed")
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("REFRESH_ERROR", e.message)
        }
    }
}
