package com.stickercreator

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
import android.graphics.drawable.AnimatedImageDrawable
import android.net.Uri
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

class ImageConverterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ImageConverter"
    }

    override fun getName(): String = "ImageConverterModule"

    private fun isAnimatedWebP(bytes: ByteArray): Boolean {
        if (bytes.size < 12) return false
        val riff = String(bytes, 0, 4, Charsets.US_ASCII)
        val webp = String(bytes, 8, 4, Charsets.US_ASCII)
        if (riff != "RIFF" || webp != "WEBP") return false

        var offset = 12
        while (offset + 8 < bytes.size) {
            val chunkId = String(bytes, offset, 4, Charsets.US_ASCII)
            if (chunkId == "ANIM") return true
            if (chunkId == "ANMF") return true
            val chunkSize = (bytes[offset + 4].toInt() and 0xFF) or
                    ((bytes[offset + 5].toInt() and 0xFF) shl 8) or
                    ((bytes[offset + 6].toInt() and 0xFF) shl 16) or
                    ((bytes[offset + 7].toInt() and 0xFF) shl 24)
            offset += 8 + chunkSize + (chunkSize % 2)
        }
        return false
    }

    private fun isAnimatedGif(bytes: ByteArray): Boolean {
        if (bytes.size < 6) return false
        val header = String(bytes, 0, 6, Charsets.US_ASCII)
        return header == "GIF89a" || header == "GIF87a"
    }

    @ReactMethod
    fun convertToWebP(sourceUri: String, outputPath: String, maxDimension: Int, promise: Promise) {
        try {
            val inputStream = reactApplicationContext.contentResolver.openInputStream(Uri.parse(sourceUri))
            val rawBytes = inputStream?.readBytes()
            inputStream?.close()

            if (rawBytes == null || rawBytes.isEmpty()) {
                promise.reject("CONVERT_ERROR", "Failed to read source file")
                return
            }

            val animated = isAnimatedWebP(rawBytes) || isAnimatedGif(rawBytes)
            Log.d(TAG, "convertToWebP animated=$animated size=${rawBytes.size} uri=$sourceUri")

            if (animated) {
                convertAnimated(rawBytes, sourceUri, outputPath, maxDimension, promise)
            } else {
                convertStatic(rawBytes, outputPath, maxDimension, promise)
            }
        } catch (e: Exception) {
            promise.reject("CONVERT_ERROR", e.message)
        }
    }

    private fun convertAnimated(rawBytes: ByteArray, sourceUri: String, outputPath: String, maxDimension: Int, promise: Promise) {
        val outputFile = File(outputPath)
        outputFile.parentFile?.mkdirs()

        val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, opts)
        val srcW = opts.outWidth
        val srcH = opts.outHeight
        Log.d(TAG, "  animated source dimensions: ${srcW}x${srcH}")

        val maxAnimatedSize = 500 * 1024

        if (srcW <= maxDimension && srcH <= maxDimension && rawBytes.size <= maxAnimatedSize) {
            Log.d(TAG, "  animated sticker already meets requirements, copying as-is")
            FileOutputStream(outputFile).use { it.write(rawBytes) }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Log.d(TAG, "  animated sticker needs processing, attempting ImageDecoder approach")
            try {
                val tempFile = File(outputFile.parent, "temp_anim_${System.currentTimeMillis()}")
                FileOutputStream(tempFile).use { it.write(rawBytes) }

                val source = ImageDecoder.createSource(tempFile)
                val drawable = ImageDecoder.decodeDrawable(source) { decoder, info, _ ->
                    val size = info.size
                    if (size.width > maxDimension || size.height > maxDimension) {
                        val ratio = maxDimension.toFloat() / maxOf(size.width, size.height)
                        decoder.setTargetSize(
                            (size.width * ratio).toInt(),
                            (size.height * ratio).toInt()
                        )
                    }
                }

                if (drawable is AnimatedImageDrawable) {
                    Log.d(TAG, "  decoded as AnimatedImageDrawable, copying original (resize not supported for animated re-encode)")
                    FileOutputStream(outputFile).use { it.write(rawBytes) }
                } else {
                    Log.d(TAG, "  decoded as static drawable, converting normally")
                    tempFile.delete()
                    convertStatic(rawBytes, outputPath, maxDimension, promise)
                    return
                }
                tempFile.delete()
            } catch (e: Exception) {
                Log.w(TAG, "  ImageDecoder failed, copying raw bytes: ${e.message}")
                FileOutputStream(outputFile).use { it.write(rawBytes) }
            }
        } else {
            Log.d(TAG, "  pre-API28, copying animated file as-is")
            FileOutputStream(outputFile).use { it.write(rawBytes) }
        }

        val result = Arguments.createMap().apply {
            putBoolean("success", true)
            putBoolean("animated", true)
            putInt("width", srcW)
            putInt("height", srcH)
            putDouble("size", outputFile.length().toDouble())
        }
        promise.resolve(result)
    }

    private fun convertStatic(rawBytes: ByteArray, outputPath: String, maxDimension: Int, promise: Promise) {
        val bitmap = BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size)
        if (bitmap == null) {
            promise.reject("CONVERT_ERROR", "Failed to decode image")
            return
        }

        val target = maxDimension
        val scaled = Bitmap.createBitmap(target, target, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(scaled)
        canvas.drawColor(Color.TRANSPARENT)

        val srcW = bitmap.width
        val srcH = bitmap.height
        val ratio = target.toFloat() / maxOf(srcW, srcH)
        val newW = (srcW * ratio).toInt()
        val newH = (srcH * ratio).toInt()
        val left = (target - newW) / 2f
        val top = (target - newH) / 2f
        val fitBitmap = Bitmap.createScaledBitmap(bitmap, newW, newH, true)
        canvas.drawBitmap(fitBitmap, left, top, null)
        if (fitBitmap != bitmap) fitBitmap.recycle()
        bitmap.recycle()

        val outputFile = File(outputPath)
        outputFile.parentFile?.mkdirs()

        var quality = 100
        val maxSize = 100 * 1024
        while (quality >= 10) {
            val baos = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.WEBP, quality, baos)
            if (baos.size() <= maxSize) {
                FileOutputStream(outputFile).use { it.write(baos.toByteArray()) }
                break
            }
            quality -= 10
        }
        if (!outputFile.exists() || outputFile.length() == 0L) {
            FileOutputStream(outputFile).use { fos ->
                scaled.compress(Bitmap.CompressFormat.WEBP, 10, fos)
            }
        }
        scaled.recycle()

        val result = Arguments.createMap().apply {
            putBoolean("success", true)
            putBoolean("animated", false)
            putInt("width", target)
            putInt("height", target)
            putDouble("size", outputFile.length().toDouble())
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun generateTrayIcon(sourceUri: String, outputPath: String, promise: Promise) {
        try {
            val inputStream = reactApplicationContext.contentResolver.openInputStream(Uri.parse(sourceUri))
            val rawBytes = inputStream?.readBytes()
            inputStream?.close()

            if (rawBytes == null || rawBytes.isEmpty()) {
                promise.reject("CONVERT_ERROR", "Failed to read source file")
                return
            }

            val bitmap = BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size)
            if (bitmap == null) {
                promise.reject("CONVERT_ERROR", "Failed to decode image")
                return
            }

            val traySize = 96
            val tray = Bitmap.createBitmap(traySize, traySize, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(tray)
            canvas.drawColor(Color.TRANSPARENT)

            val srcW = bitmap.width
            val srcH = bitmap.height
            val ratio = traySize.toFloat() / maxOf(srcW, srcH)
            val newW = (srcW * ratio).toInt()
            val newH = (srcH * ratio).toInt()
            val left = (traySize - newW) / 2f
            val top = (traySize - newH) / 2f
            val fitBitmap = Bitmap.createScaledBitmap(bitmap, newW, newH, true)
            canvas.drawBitmap(fitBitmap, left, top, null)
            if (fitBitmap != bitmap) fitBitmap.recycle()
            bitmap.recycle()

            val outputFile = File(outputPath)
            outputFile.parentFile?.mkdirs()

            var quality = 100
            val maxSize = 50 * 1024
            while (quality >= 10) {
                val baos = ByteArrayOutputStream()
                tray.compress(Bitmap.CompressFormat.PNG, quality, baos)
                if (baos.size() <= maxSize) {
                    FileOutputStream(outputFile).use { it.write(baos.toByteArray()) }
                    break
                }
                quality -= 10
            }
            if (!outputFile.exists() || outputFile.length() == 0L) {
                FileOutputStream(outputFile).use { fos ->
                    tray.compress(Bitmap.CompressFormat.PNG, 10, fos)
                }
            }
            tray.recycle()

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putInt("width", traySize)
                putInt("height", traySize)
                putDouble("size", outputFile.length().toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CONVERT_ERROR", e.message)
        }
    }
}
