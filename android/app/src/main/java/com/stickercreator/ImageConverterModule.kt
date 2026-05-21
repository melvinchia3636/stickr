package com.stickercreator

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
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

            val animated = WebPUtils.isAnimatedWebP(rawBytes) ||
                    WebPUtils.isAnimatedGif(rawBytes) ||
                    WebPUtils.isAnimatedPng(rawBytes)
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

        val isGif = WebPUtils.isAnimatedGif(rawBytes)
        val isApng = WebPUtils.isAnimatedPng(rawBytes)
        val isWebP = WebPUtils.isAnimatedWebP(rawBytes)
        Log.d(TAG, "  convertAnimated: isGif=$isGif isApng=$isApng isWebP=$isWebP size=${rawBytes.size}")

        if (isGif) {
            val success = GifToWebPConverter.convert(rawBytes, outputPath, maxDimension)
            if (!success) {
                promise.reject("CONVERT_ERROR", "Failed to convert GIF to animated WebP")
                return
            }
            resolveAnimatedResult(outputPath, maxDimension, promise)
            return
        }

        if (isApng) {
            val success = ApngToWebPConverter.convert(rawBytes, outputPath, maxDimension)
            if (!success) {
                Log.w(TAG, "  APNG conversion failed, falling back to static")
                convertStatic(rawBytes, outputPath, maxDimension, promise)
                return
            }
            resolveAnimatedResult(outputPath, maxDimension, promise)
            return
        }

        if (isWebP) {
            val success = WebPToWebPConverter.convert(rawBytes, outputPath, maxDimension)
            if (!success) {
                Log.w(TAG, "  WebP conversion failed, falling back to copying as-is")
                FileOutputStream(outputFile).use { it.write(rawBytes) }
            }
            resolveAnimatedResult(outputPath, maxDimension, promise)
            return
        }

        Log.d(TAG, "  unknown animated format, falling back to static conversion")
        convertStatic(rawBytes, outputPath, maxDimension, promise)
    }

    private fun resolveAnimatedResult(outputPath: String, maxDimension: Int, promise: Promise) {
        val result = Arguments.createMap().apply {
            putBoolean("success", true)
            putBoolean("animated", true)
            putInt("width", maxDimension)
            putInt("height", maxDimension)
            putDouble("size", File(outputPath).length().toDouble())
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

            val animated = WebPUtils.isAnimatedWebP(rawBytes) || WebPUtils.isAnimatedGif(rawBytes)
            Log.d(TAG, "generateTrayIcon animated=$animated size=${rawBytes.size} uri=$sourceUri")

            val bitmap: Bitmap? = if (animated && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                try {
                    val tempFile = File.createTempFile("tray_src", ".webp", reactApplicationContext.cacheDir)
                    FileOutputStream(tempFile).use { it.write(rawBytes) }
                    val source = ImageDecoder.createSource(tempFile)
                    val bmp = ImageDecoder.decodeBitmap(source) { decoder, _, _ ->
                        decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE)
                    }
                    tempFile.delete()
                    Log.d(TAG, "  decoded animated first frame via ImageDecoder: ${bmp.width}x${bmp.height}")
                    bmp
                } catch (e: Exception) {
                    Log.w(TAG, "  ImageDecoder failed, falling back to BitmapFactory: ${e.message}")
                    BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size)
                }
            } else {
                BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size)
            }

            if (bitmap == null) {
                promise.reject("CONVERT_ERROR", "Failed to decode image for tray icon")
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

            Log.d(TAG, "  tray icon written: ${outputFile.length()} bytes")

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
