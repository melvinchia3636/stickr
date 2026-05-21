package com.stickercreator

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.util.Log
import org.json.JSONObject
import java.io.File

class StickerContentProvider : ContentProvider() {
    companion object {
        private const val TAG = "StickerProvider"
        private const val METADATA = 1
        private const val METADATA_SINGLE = 2
        private const val STICKERS = 3
        private const val STICKERS_ASSET = 4
    }

    private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH)
    private var authority = ""

    override fun onCreate(): Boolean {
        authority = "${context?.packageName}.stickercontentprovider"
        Log.d(TAG, "onCreate() authority=$authority")
        uriMatcher.addURI(authority, "metadata", METADATA)
        uriMatcher.addURI(authority, "metadata/*", METADATA_SINGLE)
        uriMatcher.addURI(authority, "stickers/*", STICKERS)
        uriMatcher.addURI(authority, "stickers_asset/*/*", STICKERS_ASSET)
        return true
    }

    private fun getStickersDir(): File = File(context!!.filesDir, "stickers")

    private fun readAllPacks(): List<StickerPack> {
        val stickersDir = getStickersDir()
        if (!stickersDir.exists()) return emptyList()

        val packs = mutableListOf<StickerPack>()
        val dirs = stickersDir.listFiles { f -> f.isDirectory } ?: return emptyList()

        for (dir in dirs) {
            val contentsFile = File(dir, "contents.json")
            if (!contentsFile.exists()) continue
            try {
                val json = JSONObject(contentsFile.readText())
                val arr = json.getJSONArray("sticker_packs")
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val stickersArr = obj.getJSONArray("stickers")
                    val stickerList = mutableListOf<Sticker>()
                    for (j in 0 until stickersArr.length()) {
                        val s = stickersArr.getJSONObject(j)
                        val emojis = mutableListOf<String>()
                        s.optJSONArray("emojis")?.let { ea ->
                            for (k in 0 until ea.length()) emojis.add(ea.getString(k))
                        }
                        stickerList.add(Sticker(s.getString("image_file"), emojis))
                    }
                    packs.add(StickerPack(
                        identifier = obj.getString("identifier"),
                        name = obj.getString("name"),
                        publisher = obj.getString("publisher"),
                        trayImageFile = obj.getString("tray_image_file"),
                        publisherEmail = obj.optString("publisher_email", ""),
                        publisherWebsite = obj.optString("publisher_website", ""),
                        privacyPolicyWebsite = obj.optString("privacy_policy_website", ""),
                        licenseAgreementWebsite = obj.optString("license_agreement_website", ""),
                        imageDataVersion = obj.optString("image_data_version", "1"),
                        avoidCache = obj.optBoolean("avoid_cache", false),
                        animatedStickerPack = obj.optBoolean("animated_sticker_pack", false),
                        stickers = stickerList
                    ))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reading ${dir.name}/contents.json", e)
            }
        }
        return packs
    }

    override fun query(uri: Uri, projection: Array<String>?, selection: String?, selectionArgs: Array<String>?, sortOrder: String?): Cursor? {
        Log.d(TAG, "=== CONTENT PROVIDER QUERY START ===")
        Log.d(TAG, "  URI: $uri")
        Log.d(TAG, "  Projection: ${projection?.joinToString()}")
        val code = uriMatcher.match(uri)
        Log.d(TAG, "  Matcher code: $code")

        val cursor = when (code) {
            METADATA -> {
                val packs = readAllPacks()
                Log.d(TAG, "  METADATA: returning ${packs.size} packs: ${packs.map { it.identifier }}")
                getMetadataCursor(packs)
            }
            METADATA_SINGLE -> {
                val identifier = uri.lastPathSegment
                Log.d(TAG, "  METADATA_SINGLE: identifier=$identifier")
                if (identifier == null) {
                    Log.e(TAG, "    FAIL: identifier is null")
                    null
                } else {
                    val packs = readAllPacks()
                    val pack = packs.find { it.identifier == identifier }
                    if (pack == null) {
                        Log.e(TAG, "    FAIL: pack with identifier '$identifier' not found in: ${packs.map { it.identifier }}")
                        null
                    } else {
                        Log.d(TAG, "    SUCCESS: found pack '$identifier'")
                        getMetadataCursor(listOf(pack))
                    }
                }
            }
            STICKERS -> {
                val identifier = uri.lastPathSegment
                Log.d(TAG, "  STICKERS: identifier=$identifier")
                if (identifier == null) {
                    Log.e(TAG, "    FAIL: identifier is null")
                    null
                } else {
                    val packs = readAllPacks()
                    val pack = packs.find { it.identifier == identifier }
                    if (pack == null) {
                        Log.e(TAG, "    FAIL: pack with identifier '$identifier' not found")
                        null
                    } else {
                        Log.d(TAG, "    SUCCESS: found pack '$identifier' with ${pack.stickers.size} stickers")
                        getStickersCursor(pack)
                    }
                }
            }
            else -> {
                Log.w(TAG, "  Unknown URI code: $code")
                null
            }
        }
        Log.d(TAG, "  Returning cursor: count=${cursor?.count ?: "null"}")
        Log.d(TAG, "=== CONTENT PROVIDER QUERY END ===")
        return cursor
    }

    private fun getMetadataCursor(packs: List<StickerPack>): MatrixCursor {
        val cursor = MatrixCursor(arrayOf(
            "sticker_pack_identifier", "sticker_pack_name", "sticker_pack_publisher",
            "sticker_pack_icon", "android_play_store_link", "ios_app_download_link",
            "sticker_pack_publisher_email", "sticker_pack_publisher_website",
            "sticker_pack_privacy_policy_website", "sticker_pack_license_agreement_website",
            "image_data_version", "whatsapp_will_not_cache_stickers", "animated_sticker_pack"
        ))
        for (pack in packs) {
            cursor.addRow(arrayOf<Any>(
                pack.identifier, pack.name, pack.publisher,
                pack.trayImageFile, "", "",
                pack.publisherEmail, pack.publisherWebsite,
                pack.privacyPolicyWebsite, pack.licenseAgreementWebsite,
                pack.imageDataVersion, if (pack.avoidCache) 1 else 0,
                if (pack.animatedStickerPack) 1 else 0
            ))
        }
        return cursor
    }

    private fun getStickersCursor(pack: StickerPack): MatrixCursor {
        val cursor = MatrixCursor(arrayOf("sticker_file_name", "sticker_emoji"))
        for (sticker in pack.stickers) {
            cursor.addRow(arrayOf(
                sticker.imageFileName,
                sticker.emojis.joinToString(",").ifEmpty { "😀" }
            ))
        }
        return cursor
    }

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
        Log.d(TAG, "=== CONTENT PROVIDER openFile START ===")
        Log.d(TAG, "  URI: $uri, mode: $mode")
        val code = uriMatcher.match(uri)
        Log.d(TAG, "  Matcher code: $code")
        if (code != STICKERS_ASSET) {
            Log.e(TAG, "  FAIL: URI matcher code $code is not STICKERS_ASSET")
            return null
        }

        val segments = uri.pathSegments
        if (segments.size < 3) {
            Log.e(TAG, "  FAIL: URI has fewer than 3 path segments: $segments")
            return null
        }
        val identifier = segments[1]
        val fileName = segments[2]

        val file = File(getStickersDir(), "$identifier/$fileName")
        Log.d(TAG, "  File requested: ${file.absolutePath}")
        Log.d(TAG, "  File exists: ${file.exists()}, size: ${file.length()} bytes")

        if (!file.exists()) {
            Log.e(TAG, "  FAIL: File does not exist")
            return null
        }

        val pfd = try {
            ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
        } catch (e: Exception) {
            Log.e(TAG, "  FAIL: Error opening ParcelFileDescriptor", e)
            null
        }
        Log.d(TAG, "  Returning ParcelFileDescriptor: $pfd")
        Log.d(TAG, "=== CONTENT PROVIDER openFile END ===")
        return pfd
    }

    override fun openAssetFile(uri: Uri, mode: String): AssetFileDescriptor? {
        Log.d(TAG, "openAssetFile() uri=$uri")
        val pfd = openFile(uri, mode) ?: return null
        return AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH)
    }

    override fun getType(uri: Uri): String? {
        val code = uriMatcher.match(uri)
        return when (code) {
            METADATA -> "vnd.android.cursor.dir/vnd.${authority}.metadata"
            METADATA_SINGLE -> "vnd.android.cursor.item/vnd.${authority}.metadata"
            STICKERS -> "vnd.android.cursor.dir/vnd.${authority}.stickers"
            STICKERS_ASSET -> {
                val fileName = uri.lastPathSegment ?: return null
                when {
                    fileName.endsWith(".webp") -> "image/webp"
                    fileName.endsWith(".png") -> "image/png"
                    else -> "application/octet-stream"
                }
            }
            else -> null
        }
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<String>?): Int = 0
}
