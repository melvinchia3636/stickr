package com.stickercreator

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

class ImageConverterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ImageConverterModule"

    @ReactMethod
    fun convertToWebP(sourceUri: String, outputPath: String, maxDimension: Int, promise: Promise) {
        try {
            val inputStream = reactApplicationContext.contentResolver.openInputStream(Uri.parse(sourceUri))
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

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
                    val fos = FileOutputStream(outputFile)
                    fos.write(baos.toByteArray())
                    fos.close()
                    break
                }
                quality -= 10
            }
            if (!outputFile.exists() || outputFile.length() == 0L) {
                val fos = FileOutputStream(outputFile)
                scaled.compress(Bitmap.CompressFormat.WEBP, 10, fos)
                fos.close()
            }
            scaled.recycle()

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putInt("width", target)
                putInt("height", target)
                putDouble("size", outputFile.length().toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CONVERT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun generateTrayIcon(sourceUri: String, outputPath: String, promise: Promise) {
        try {
            val inputStream = reactApplicationContext.contentResolver.openInputStream(Uri.parse(sourceUri))
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

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
                    val fos = FileOutputStream(outputFile)
                    fos.write(baos.toByteArray())
                    fos.close()
                    break
                }
                quality -= 10
            }
            if (!outputFile.exists() || outputFile.length() == 0L) {
                val fos = FileOutputStream(outputFile)
                tray.compress(Bitmap.CompressFormat.PNG, 10, fos)
                fos.close()
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
