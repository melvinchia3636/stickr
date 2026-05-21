package com.stickercreator

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.os.Build
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

object WebPToWebPConverter {
    private const val TAG = "WebPToWebP"

    private data class FrameInfo(
        val xOffset: Int,
        val yOffset: Int,
        val width: Int,
        val height: Int,
        val delayMs: Int,
        val blendOp: Int, // 0 = alpha blend, 1 = do not blend
        val disposeOp: Int, // 0 = do not dispose, 1 = dispose to bg
        val payload: ByteArray
    )

    private data class ParsedWebP(
        val canvasWidth: Int,
        val canvasHeight: Int,
        val frames: List<FrameInfo>
    )

    fun convert(webpBytes: ByteArray, outputPath: String, canvasSize: Int): Boolean {
        val parsed = parseWebP(webpBytes)
        if (parsed == null) {
            Log.e(TAG, "Failed to parse source animated WebP")
            return false
        }
        val frames = parsed.frames
        Log.d(TAG, "Parsed ${frames.size} frames from WebP, canvas: ${parsed.canvasWidth}x${parsed.canvasHeight}")
        if (frames.isEmpty()) return false

        val scale = canvasSize.toFloat() / maxOf(parsed.canvasWidth, parsed.canvasHeight)
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

        // Try lossless first
        val losslessFrames = encodeFrames(parsed, canvasSize, scale, true, 100)
        if (!losslessFrames.isNullOrEmpty()) {
            if (evaluate(losslessFrames, 1)) {
                Log.d(TAG, "Selected Lossless factor 1: ${finalBytes!!.size} bytes")
            }
        }

        // Try different lossy qualities and frame dropping factors
        if (finalBytes == null) {
            val lossy80 = encodeFrames(parsed, canvasSize, scale, false, 80)
            if (!lossy80.isNullOrEmpty()) {
                if (evaluate(lossy80, 1)) {
                    Log.d(TAG, "Selected Lossy 80 factor 1: ${finalBytes!!.size} bytes")
                }
            }
        }

        if (finalBytes == null) {
            val lossy60 = encodeFrames(parsed, canvasSize, scale, false, 60)
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
            val lossy35 = encodeFrames(parsed, canvasSize, scale, false, 35)
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
            val lossy15 = encodeFrames(parsed, canvasSize, scale, false, 15)
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

    private fun parseWebP(bytes: ByteArray): ParsedWebP? {
        if (bytes.size < 12) return null
        val riff = String(bytes, 0, 4, Charsets.US_ASCII)
        val webp = String(bytes, 8, 4, Charsets.US_ASCII)
        if (riff != "RIFF" || webp != "WEBP") return null

        var canvasWidth = 0
        var canvasHeight = 0
        val frames = mutableListOf<FrameInfo>()

        var offset = 12
        while (offset + 8 <= bytes.size) {
            val chunkId = String(bytes, offset, 4, Charsets.US_ASCII)
            val chunkSize = (bytes[offset + 4].toInt() and 0xFF) or
                    ((bytes[offset + 5].toInt() and 0xFF) shl 8) or
                    ((bytes[offset + 6].toInt() and 0xFF) shl 16) or
                    ((bytes[offset + 7].toInt() and 0xFF) shl 24)

            val chunkDataStart = offset + 8
            val totalChunkSize = 8 + chunkSize + (chunkSize % 2)

            if (chunkDataStart + chunkSize > bytes.size) break

            when (chunkId) {
                "VP8X" -> {
                    if (chunkSize >= 10) {
                        canvasWidth = ((bytes[chunkDataStart + 4].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 5].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 6].toInt() and 0xFF) shl 16)) + 1
                        canvasHeight = ((bytes[chunkDataStart + 7].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 8].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 9].toInt() and 0xFF) shl 16)) + 1
                    }
                }
                "ANMF" -> {
                    if (chunkSize >= 16) {
                        val x = (bytes[chunkDataStart + 0].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 1].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 2].toInt() and 0xFF) shl 16)
                        val y = (bytes[chunkDataStart + 3].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 4].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 5].toInt() and 0xFF) shl 16)
                        val w = ((bytes[chunkDataStart + 6].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 7].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 8].toInt() and 0xFF) shl 16)) + 1
                        val h = ((bytes[chunkDataStart + 9].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 10].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 11].toInt() and 0xFF) shl 16)) + 1
                        val duration = (bytes[chunkDataStart + 12].toInt() and 0xFF) or
                                ((bytes[chunkDataStart + 13].toInt() and 0xFF) shl 8) or
                                ((bytes[chunkDataStart + 14].toInt() and 0xFF) shl 16)
                        val flags = bytes[chunkDataStart + 15].toInt() and 0xFF
                        val disposeOp = flags and 0x01
                        val blendOp = (flags shr 1) and 0x01

                        val payloadSize = chunkSize - 16
                        val payload = ByteArray(payloadSize)
                        System.arraycopy(bytes, chunkDataStart + 16, payload, 0, payloadSize)

                        frames.add(FrameInfo(x, y, w, h, duration, blendOp, disposeOp, payload))
                    }
                }
            }
            offset += totalChunkSize
        }

        if (canvasWidth == 0 || canvasHeight == 0 || frames.isEmpty()) return null
        return ParsedWebP(canvasWidth, canvasHeight, frames)
    }

    private fun buildFrameWebp(frame: FrameInfo): ByteArray {
        val out = ByteArrayOutputStream()
        out.write("RIFF".toByteArray(Charsets.US_ASCII))
        val size = 4 + frame.payload.size
        out.write(intToLE(size))
        out.write("WEBP".toByteArray(Charsets.US_ASCII))
        out.write(frame.payload)
        return out.toByteArray()
    }

    private fun encodeFrames(
        parsed: ParsedWebP,
        canvasSize: Int,
        scale: Float,
        useLossless: Boolean,
        quality: Int
    ): List<Pair<ByteArray, Int>>? {
        val prevCanvas = Bitmap.createBitmap(
            parsed.canvasWidth, parsed.canvasHeight, Bitmap.Config.ARGB_8888
        )
        val prevCanvasCanvas = Canvas(prevCanvas)
        val encodedFrames = mutableListOf<Pair<ByteArray, Int>>()

        for (i in parsed.frames.indices) {
            val frame = parsed.frames[i]
            val frameWebp = buildFrameWebp(frame)
            val frameBitmap = BitmapFactory.decodeByteArray(frameWebp, 0, frameWebp.size)
            if (frameBitmap == null) {
                Log.w(TAG, "Failed to decode frame $i")
                prevCanvas.recycle()
                return null
            }

            // Draw this frame on prevCanvas
            if (frame.blendOp == 1) { // 1 = Do Not Blend (overwrite)
                val paint = Paint().apply {
                    xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC)
                }
                prevCanvasCanvas.drawBitmap(frameBitmap, frame.xOffset.toFloat(), frame.yOffset.toFloat(), paint)
            } else { // 0 = Alpha Blend
                prevCanvasCanvas.drawBitmap(frameBitmap, frame.xOffset.toFloat(), frame.yOffset.toFloat(), null)
            }
            frameBitmap.recycle()

            // Scale and draw prevCanvas onto outputBitmap
            val outputBitmap = Bitmap.createBitmap(canvasSize, canvasSize, Bitmap.Config.ARGB_8888)
            val outputCanvas = Canvas(outputBitmap)
            outputCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)

            val padLeft = (canvasSize - parsed.canvasWidth * scale) / 2f
            val padTop = (canvasSize - parsed.canvasHeight * scale) / 2f
            outputCanvas.save()
            outputCanvas.translate(padLeft, padTop)
            outputCanvas.scale(scale, scale)
            outputCanvas.drawBitmap(prevCanvas, 0f, 0f, null)
            outputCanvas.restore()

            // Compress to static WebP
            val baos = ByteArrayOutputStream()
            if (useLossless && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                outputBitmap.compress(Bitmap.CompressFormat.WEBP_LOSSLESS, 100, baos)
            } else {
                val format = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    Bitmap.CompressFormat.WEBP_LOSSY
                } else {
                    @Suppress("DEPRECATION")
                    Bitmap.CompressFormat.WEBP
                }
                outputBitmap.compress(format, quality, baos)
            }
            outputBitmap.recycle()

            val frameData = extractFrameData(baos.toByteArray())
            if (frameData != null) {
                encodedFrames.add(frameData to frame.delayMs)
            }

            // Apply disposal method
            if (frame.disposeOp == 1) { // Dispose to Background
                val clearPaint = Paint().apply {
                    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
                }
                prevCanvasCanvas.drawRect(
                    frame.xOffset.toFloat(), frame.yOffset.toFloat(),
                    (frame.xOffset + frame.width).toFloat(),
                    (frame.yOffset + frame.height).toFloat(),
                    clearPaint
                )
            }
        }
        prevCanvas.recycle()
        return encodedFrames
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

        payload.write("VP8X".toByteArray())
        payload.write(intToLE(10))
        payload.write(byteArrayOf(0x12, 0, 0, 0)) // flags: Anim=1, Alpha=1
        payload.write(int24LE(wm1))
        payload.write(int24LE(hm1))

        payload.write("ANIM".toByteArray())
        payload.write(intToLE(6))
        payload.write(intToLE(0))
        payload.write(shortToLE(0))

        for ((frameData, delayMs) in frames) {
            val anmfPayloadSize = 16 + frameData.size
            payload.write("ANMF".toByteArray())
            payload.write(intToLE(anmfPayloadSize))
            payload.write(int24LE(0))
            payload.write(int24LE(0))
            payload.write(int24LE(wm1))
            payload.write(int24LE(hm1))
            payload.write(int24LE(delayMs))
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
