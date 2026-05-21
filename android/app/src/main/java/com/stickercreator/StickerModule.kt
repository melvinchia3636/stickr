package com.stickercreator

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import java.io.File

class StickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "StickerModule"
        private const val CONSUMER_WHATSAPP_PACKAGE = "com.whatsapp"
    }

    override fun getName(): String = "StickerModule"

    @ReactMethod
    fun addStickerPackToWhatsApp(identifier: String, packName: String, promise: Promise) {
        Log.d(TAG, "=== addStickerPackToWhatsApp START ===")
        Log.d(TAG, "  identifier: $identifier")
        Log.d(TAG, "  packName: $packName")
        try {
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
