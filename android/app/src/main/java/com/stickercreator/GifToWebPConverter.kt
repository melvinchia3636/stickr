package com.stickercreator

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Movie
import android.graphics.PorterDuff
import android.os.Build
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

object GifToWebPConverter {
    private const val TAG = "GifToWebP"

    fun convert(gifBytes: ByteArray, outputPath: String, canvasSize: Int): Boolean {
        val frameDelays = parseGifFrameDelays(gifBytes)
        Log.d(TAG, "Parsed ${frameDelays.size} frames from GIF")
        if (frameDelays.isEmpty()) return false
        val movie = Movie.decodeByteArray(gifBytes, 0, gifBytes.size)
        if (movie == null) {
            Log.e(TAG, "Movie.decodeByteArray returned null")
            return false
        }
        val srcW = movie.width()
        val srcH = movie.height()
        val scale = canvasSize.toFloat() / maxOf(srcW, srcH)
        val dstW = (srcW * scale).toInt()
        val dstH = (srcH * scale).toInt()
        val padLeft = (canvasSize - dstW) / 2f
        val padTop = (canvasSize - dstH) / 2f
        Log.d(TAG, "GIF ${srcW}x${srcH} -> ${canvasSize}x${canvasSize} scale=$scale")
        val maxStickerSize = 480 * 1024
        var finalBytes: ByteArray? = null
        var bestBytes: ByteArray? = null
        fun evaluate(encoded: List<Pair<ByteArray, Int>>, factor: Int): Boolean {
            val dropped = dropFrames(encoded, factor)
            val animated = assembleAnimatedWebP(dropped, canvasSize, canvasSize)
            if (bestBytes == null || animated.size < bestBytes!!.size) {
                bestBytes = animated
            }
            if (animated.size <= maxStickerSize) {
                finalBytes = animated
                return true
            }
            return false
        }
        val losslessFrames = encodeFrames(movie, frameDelays, canvasSize, scale, padLeft, padTop, true, 100)
        if (!losslessFrames.isNullOrEmpty()) {
            if (evaluate(losslessFrames, 1)) {
                Log.d(TAG, "Selected Lossless factor 1: ${finalBytes!!.size} bytes")
            }
        }
        if (finalBytes == null) {
            val lossy80 = encodeFrames(movie, frameDelays, canvasSize, scale, padLeft, padTop, false, 80)
            if (!lossy80.isNullOrEmpty()) {
                if (evaluate(lossy80, 1)) {
                    Log.d(TAG, "Selected Lossy 80 factor 1: ${finalBytes!!.size} bytes")
                }
            }
        }
        if (finalBytes == null) {
            val lossy60 = encodeFrames(movie, frameDelays, canvasSize, scale, padLeft, padTop, false, 60)
            if (!lossy60.isNullOrEmpty()) {
                for (factor in 1..3) {
                    if (evaluate(lossy60, factor)) {
                        Log.d(TAG, "Selected Lossy 60 factor $factor: ${finalBytes!!.size} bytes")
                        break
                    }
                }
            }
        }
        if (finalBytes == null) {
            val lossy35 = encodeFrames(movie, frameDelays, canvasSize, scale, padLeft, padTop, false, 35)
            if (!lossy35.isNullOrEmpty()) {
                for (factor in 1..4) {
                    if (evaluate(lossy35, factor)) {
                        Log.d(TAG, "Selected Lossy 35 factor $factor: ${finalBytes!!.size} bytes")
                        break
                    }
                }
            }
        }
        if (finalBytes == null) {
            val lossy15 = encodeFrames(movie, frameDelays, canvasSize, scale, padLeft, padTop, false, 15)
            if (!lossy15.isNullOrEmpty()) {
                for (factor in 2..5) {
                    if (evaluate(lossy15, factor)) {
                        Log.d(TAG, "Selected Lossy 15 factor $factor: ${finalBytes!!.size} bytes")
                        break
                    }
                }
            }
        }
        val bytesToWrite = finalBytes ?: bestBytes
        if (bytesToWrite == null) return false
        File(outputPath).apply {
            parentFile?.mkdirs()
            writeBytes(bytesToWrite)
        }
        Log.d(TAG, "Output file size: ${bytesToWrite.size} bytes")
        return true
    }

    private fun dropFrames(frames: List<Pair<ByteArray, Int>>, factor: Int): List<Pair<ByteArray, Int>> {
        if (factor <= 1 || frames.size <= 2) return frames
        val result = mutableListOf<Pair<ByteArray, Int>>()
        var i = 0
        while (i < frames.size) {
            val currentFrame = frames[i]
            var accumulatedDelay = currentFrame.second
            var j = 1
            while (j < factor && i + j < frames.size) {
                accumulatedDelay += frames[i + j].second
                j++
            }
            result.add(currentFrame.first to accumulatedDelay)
            i += factor
        }
        return result
    }

    private fun encodeFrames(
        movie: Movie,
        frameDelays: List<Int>,
        canvasSize: Int,
        scale: Float,
        padLeft: Float,
        padTop: Float,
        useLossless: Boolean,
        quality: Int
    ): List<Pair<ByteArray, Int>>? {
        val encodedFrames = mutableListOf<Pair<ByteArray, Int>>()
        var timeMs = 0

        for (i in frameDelays.indices) {
            val bitmap = Bitmap.createBitmap(canvasSize, canvasSize, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
            canvas.save()
            canvas.translate(padLeft, padTop)
            canvas.scale(scale, scale)
            movie.setTime(timeMs)
            movie.draw(canvas, 0f, 0f)
            canvas.restore()

            val baos = ByteArrayOutputStream()
            if (useLossless && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                bitmap.compress(Bitmap.CompressFormat.WEBP_LOSSLESS, 100, baos)
            } else {
                val format = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    Bitmap.CompressFormat.WEBP_LOSSY
                } else {
                    @Suppress("DEPRECATION")
                    Bitmap.CompressFormat.WEBP
                }
                bitmap.compress(format, quality, baos)
            }
            bitmap.recycle()

            val frameData = extractFrameData(baos.toByteArray())
            if (frameData != null) {
                encodedFrames.add(frameData to frameDelays[i])
            } else {
                Log.w(TAG, "Failed to extract frame data for frame $i")
            }

            timeMs += frameDelays[i]
        }
        return encodedFrames
    }

    private fun parseGifFrameDelays(data: ByteArray): List<Int> {
        val delays = mutableListOf<Int>()
        if (data.size < 13) return delays

        val packed = data[10].toInt() and 0xFF
        val hasGct = packed and 0x80 != 0
        val gctSize = if (hasGct) 3 * (1 shl ((packed and 0x07) + 1)) else 0
        var i = 13 + gctSize

        while (i < data.size) {
            when (data[i].toInt() and 0xFF) {
                0x21 -> {
                    i++
                    if (i >= data.size) break
                    val label = data[i].toInt() and 0xFF
                    i++
                    if (label == 0xF9 && i + 4 < data.size) {
                        val blockSize = data[i].toInt() and 0xFF
                        if (blockSize >= 4) {
                            val delayLow = data[i + 2].toInt() and 0xFF
                            val delayHigh = data[i + 3].toInt() and 0xFF
                            var delayMs = (delayLow or (delayHigh shl 8)) * 10
                            if (delayMs == 0) delayMs = 100
                            delays.add(delayMs)
                        }
                        i += blockSize + 1
                    } else {
                        while (i < data.size) {
                            val blockSize = data[i].toInt() and 0xFF
                            i++
                            if (blockSize == 0) break
                            i += blockSize
                        }
                    }
                }
                0x2C -> {
                    i += 9
                    if (i >= data.size) break
                    val imgPacked = data[i].toInt() and 0xFF
                    val hasLct = imgPacked and 0x80 != 0
                    val lctSize = if (hasLct) 3 * (1 shl ((imgPacked and 0x07) + 1)) else 0
                    i += 1 + lctSize
                    if (i >= data.size) break
                    i++
                    while (i < data.size) {
                        val blockSize = data[i].toInt() and 0xFF
                        i++
                        if (blockSize == 0) break
                        i += blockSize
                    }
                }
                0x3B -> break
                else -> i++
            }
        }
        return delays
    }

    private fun extractFrameData(webpBytes: ByteArray): ByteArray? {
        if (webpBytes.size < 12) return null
        val riff = String(webpBytes, 0, 4, Charsets.US_ASCII)
        val webp = String(webpBytes, 8, 4, Charsets.US_ASCII)
        if (riff != "RIFF" || webp != "WEBP") return null

        val chunks = ByteArrayOutputStream()
        var offset = 12
        while (offset + 8 <= webpBytes.size) {
            val chunkId = String(webpBytes, offset, 4, Charsets.US_ASCII)
            val chunkSize = ByteBuffer.wrap(webpBytes, offset + 4, 4)
                .order(ByteOrder.LITTLE_ENDIAN).int
            val totalChunkSize = 8 + chunkSize + (chunkSize % 2)

            when (chunkId) {
                "VP8 ", "VP8L", "ALPH" -> {
                    val end = minOf(offset + totalChunkSize, webpBytes.size)
                    chunks.write(webpBytes, offset, end - offset)
                }
            }
            offset += totalChunkSize
        }

        val result = chunks.toByteArray()
        return if (result.isNotEmpty()) result else null
    }

    private fun assembleAnimatedWebP(
        frames: List<Pair<ByteArray, Int>>,
        canvasWidth: Int,
        canvasHeight: Int
    ): ByteArray {
        val payload = ByteArrayOutputStream()
        val wm1 = canvasWidth - 1
        val hm1 = canvasHeight - 1

        // VP8X chunk: 10 bytes payload
        payload.write("VP8X".toByteArray())
        payload.write(intToLE(10))
        // flags: Alpha(bit4)=1, Animation(bit1)=1 => 0x12
        payload.write(byteArrayOf(0x12, 0, 0, 0))
        payload.write(int24LE(wm1))
        payload.write(int24LE(hm1))

        // ANIM chunk: 6 bytes payload
        payload.write("ANIM".toByteArray())
        payload.write(intToLE(6))
        payload.write(intToLE(0)) // background color
        payload.write(shortToLE(0)) // loop count (0=infinite)

        // ANMF chunks
        for ((frameData, delayMs) in frames) {
            val anmfPayloadSize = 16 + frameData.size
            payload.write("ANMF".toByteArray())
            payload.write(intToLE(anmfPayloadSize))
            payload.write(int24LE(0)) // frame X
            payload.write(int24LE(0)) // frame Y
            payload.write(int24LE(wm1)) // frame width - 1
            payload.write(int24LE(hm1)) // frame height - 1
            payload.write(int24LE(delayMs)) // duration
            payload.write(0x01) // flags: blending=0(alpha blend), disposal=1(dispose to bg)
            payload.write(frameData)
            if (anmfPayloadSize % 2 != 0) payload.write(0)
        }

        val payloadBytes = payload.toByteArray()
        val output = ByteArrayOutputStream()
        output.write("RIFF".toByteArray())
        output.write(intToLE(4 + payloadBytes.size))
        output.write("WEBP".toByteArray())
        output.write(payloadBytes)
        return output.toByteArray()
    }

    private fun intToLE(value: Int): ByteArray = byteArrayOf(
        (value and 0xFF).toByte(),
        ((value shr 8) and 0xFF).toByte(),
        ((value shr 16) and 0xFF).toByte(),
        ((value shr 24) and 0xFF).toByte()
    )

    private fun shortToLE(value: Int): ByteArray = byteArrayOf(
        (value and 0xFF).toByte(),
        ((value shr 8) and 0xFF).toByte()
    )

    private fun int24LE(value: Int): ByteArray = byteArrayOf(
        (value and 0xFF).toByte(),
        ((value shr 8) and 0xFF).toByte(),
        ((value shr 16) and 0xFF).toByte()
    )
}
