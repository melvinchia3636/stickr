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
import java.util.zip.CRC32

object ApngToWebPConverter {
    private const val TAG = "ApngToWebP"

    private data class FrameInfo(
        val width: Int,
        val height: Int,
        val xOffset: Int,
        val yOffset: Int,
        val delayMs: Int,
        val disposeOp: Int,
        val blendOp: Int,
        val imageData: ByteArray
    )

    private data class IhdrData(
        val canvasWidth: Int,
        val canvasHeight: Int,
        val bitDepth: Byte,
        val colorType: Byte,
        val compressionMethod: Byte,
        val filterMethod: Byte,
        val interlaceMethod: Byte
    )

    private data class ParsedApng(
        val ihdr: IhdrData,
        val frames: List<FrameInfo>,
        val plteData: ByteArray?,
        val trnsData: ByteArray?
    )

    fun convert(apngBytes: ByteArray, outputPath: String, canvasSize: Int): Boolean {
        val parsed = parseApng(apngBytes) ?: return false
        val ihdrData = parsed.ihdr
        val frames = parsed.frames
        val plteData = parsed.plteData
        val trnsData = parsed.trnsData
        Log.d(TAG, "Parsed ${frames.size} frames")
        if (frames.isEmpty()) return false
        val scale = canvasSize.toFloat() / maxOf(ihdrData.canvasWidth, ihdrData.canvasHeight)
        Log.d(TAG, "Canvas ${ihdrData.canvasWidth}x${ihdrData.canvasHeight} -> ${canvasSize}x${canvasSize}")
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
        val losslessFrames = encodeFrames(ihdrData, frames, canvasSize, scale, true, 100, plteData, trnsData)
        if (!losslessFrames.isNullOrEmpty()) {
            if (evaluate(losslessFrames, 1)) {
                Log.d(TAG, "Selected Lossless factor 1: ${finalBytes!!.size} bytes")
            }
        }
        if (finalBytes == null) {
            val lossy80 = encodeFrames(ihdrData, frames, canvasSize, scale, false, 80, plteData, trnsData)
            if (!lossy80.isNullOrEmpty()) {
                if (evaluate(lossy80, 1)) {
                    Log.d(TAG, "Selected Lossy 80 factor 1: ${finalBytes!!.size} bytes")
                }
            }
        }
        if (finalBytes == null) {
            val lossy60 = encodeFrames(ihdrData, frames, canvasSize, scale, false, 60, plteData, trnsData)
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
            val lossy35 = encodeFrames(ihdrData, frames, canvasSize, scale, false, 35, plteData, trnsData)
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
            val lossy15 = encodeFrames(ihdrData, frames, canvasSize, scale, false, 15, plteData, trnsData)
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
        ihdrData: IhdrData,
        frames: List<FrameInfo>,
        canvasSize: Int,
        scale: Float,
        useLossless: Boolean,
        quality: Int,
        plteData: ByteArray?,
        trnsData: ByteArray?
    ): List<Pair<ByteArray, Int>>? {
        val prevCanvas = Bitmap.createBitmap(
            ihdrData.canvasWidth, ihdrData.canvasHeight, Bitmap.Config.ARGB_8888
        )
        val prevCanvasCanvas = Canvas(prevCanvas)
        val encodedFrames = mutableListOf<Pair<ByteArray, Int>>()

        for (i in frames.indices) {
            val frame = frames[i]
            val framePng = buildFramePng(ihdrData, frame, plteData, trnsData)
            val frameBitmap = BitmapFactory.decodeByteArray(framePng, 0, framePng.size)
            if (frameBitmap == null) {
                Log.w(TAG, "Failed to decode frame $i")
                prevCanvas.recycle()
                return null
            }

            val saveCanvas = if (frame.disposeOp == 2) {
                prevCanvas.copy(prevCanvas.config ?: Bitmap.Config.ARGB_8888, true)
            } else null

            if (frame.blendOp == 0) {
                val clearPaint = Paint().apply {
                    xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC)
                }
                prevCanvasCanvas.drawBitmap(frameBitmap, frame.xOffset.toFloat(), frame.yOffset.toFloat(), clearPaint)
            } else {
                prevCanvasCanvas.drawBitmap(frameBitmap, frame.xOffset.toFloat(), frame.yOffset.toFloat(), null)
            }
            frameBitmap.recycle()

            val outputBitmap = Bitmap.createBitmap(canvasSize, canvasSize, Bitmap.Config.ARGB_8888)
            val outputCanvas = Canvas(outputBitmap)
            outputCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
            val padLeft = (canvasSize - ihdrData.canvasWidth * scale) / 2f
            val padTop = (canvasSize - ihdrData.canvasHeight * scale) / 2f
            outputCanvas.save()
            outputCanvas.translate(padLeft, padTop)
            outputCanvas.scale(scale, scale)
            outputCanvas.drawBitmap(prevCanvas, 0f, 0f, null)
            outputCanvas.restore()

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

            when (frame.disposeOp) {
                1 -> { // APNG_DISPOSE_OP_BACKGROUND: clear frame region
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
                2 -> { // APNG_DISPOSE_OP_PREVIOUS: restore to previous canvas state
                    if (saveCanvas != null) {
                        prevCanvasCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
                        prevCanvasCanvas.drawBitmap(saveCanvas, 0f, 0f, null)
                        saveCanvas.recycle()
                    }
                }
            }
        }
        prevCanvas.recycle()
        return encodedFrames
    }

    private fun parseApng(data: ByteArray): ParsedApng? {
        if (data.size < 8) return null

        var offset = 8
        var ihdr: IhdrData? = null
        val frames = mutableListOf<FrameInfo>()
        var currentFctl: FrameInfo? = null
        val currentFrameData = ByteArrayOutputStream()
        var firstFrame = true
        var firstFrameIsDefault = false
        var plteData: ByteArray? = null
        var trnsData: ByteArray? = null

        while (offset + 8 <= data.size) {
            val chunkLen = readInt32BE(data, offset)
            val chunkType = String(data, offset + 4, 4, Charsets.US_ASCII)
            val chunkDataStart = offset + 8
            val chunkEnd = offset + 12 + chunkLen

            when (chunkType) {
                "IHDR" -> {
                    if (chunkLen >= 13) {
                        ihdr = IhdrData(
                            canvasWidth = readInt32BE(data, chunkDataStart),
                            canvasHeight = readInt32BE(data, chunkDataStart + 4),
                            bitDepth = data[chunkDataStart + 8],
                            colorType = data[chunkDataStart + 9],
                            compressionMethod = data[chunkDataStart + 10],
                            filterMethod = data[chunkDataStart + 11],
                            interlaceMethod = data[chunkDataStart + 12]
                        )
                    }
                }
                "PLTE" -> {
                    plteData = data.copyOfRange(chunkDataStart, chunkDataStart + chunkLen)
                }
                "tRNS" -> {
                    trnsData = data.copyOfRange(chunkDataStart, chunkDataStart + chunkLen)
                }
                "fcTL" -> {
                    if (currentFctl != null && currentFrameData.size() > 0) {
                        frames.add(currentFctl.copy(imageData = currentFrameData.toByteArray()))
                        currentFrameData.reset()
                    }
                    if (chunkLen >= 26) {
                        val delayNum = readInt16BE(data, chunkDataStart + 20)
                        val delayDen = readInt16BE(data, chunkDataStart + 22)
                        val delayMs = if (delayDen == 0) {
                            delayNum * 10
                        } else {
                            (delayNum * 1000) / delayDen
                        }.coerceAtLeast(20)

                        currentFctl = FrameInfo(
                            width = readInt32BE(data, chunkDataStart + 4),
                            height = readInt32BE(data, chunkDataStart + 8),
                            xOffset = readInt32BE(data, chunkDataStart + 12),
                            yOffset = readInt32BE(data, chunkDataStart + 16),
                            delayMs = delayMs,
                            disposeOp = data[chunkDataStart + 24].toInt() and 0xFF,
                            blendOp = data[chunkDataStart + 25].toInt() and 0xFF,
                            imageData = ByteArray(0)
                        )

                        if (firstFrame) {
                            firstFrameIsDefault = true
                            firstFrame = false
                        }
                    }
                }
                "IDAT" -> {
                    if (firstFrameIsDefault && currentFctl != null) {
                        currentFrameData.write(data, chunkDataStart, chunkLen)
                    }
                    firstFrame = false
                }
                "fdAT" -> {
                    if (chunkLen > 4) {
                        currentFrameData.write(data, chunkDataStart + 4, chunkLen - 4)
                    }
                }
                "IEND" -> {
                    if (currentFctl != null && currentFrameData.size() > 0) {
                        frames.add(currentFctl.copy(imageData = currentFrameData.toByteArray()))
                    }
                    break
                }
            }

            offset = chunkEnd
            if (offset > data.size) break
        }

        if (ihdr == null || frames.isEmpty()) return null
        return ParsedApng(ihdr, frames, plteData, trnsData)
    }

    private fun buildFramePng(ihdr: IhdrData, frame: FrameInfo, plte: ByteArray?, trns: ByteArray?): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A))

        val ihdrBytes = ByteArrayOutputStream().apply {
            writeInt32BE(frame.width)
            writeInt32BE(frame.height)
            write(ihdr.bitDepth.toInt())
            write(ihdr.colorType.toInt())
            write(ihdr.compressionMethod.toInt())
            write(ihdr.filterMethod.toInt())
            write(ihdr.interlaceMethod.toInt())
        }.toByteArray()
        writePngChunk(out, "IHDR", ihdrBytes)
        if (plte != null) {
            writePngChunk(out, "PLTE", plte)
        }
        if (trns != null) {
            writePngChunk(out, "tRNS", trns)
        }
        writePngChunk(out, "IDAT", frame.imageData)
        writePngChunk(out, "IEND", ByteArray(0))
        return out.toByteArray()
    }

    private fun writePngChunk(out: ByteArrayOutputStream, type: String, data: ByteArray) {
        val typeBytes = type.toByteArray(Charsets.US_ASCII)
        val buf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN)
        buf.putInt(data.size)
        out.write(buf.array())
        out.write(typeBytes)
        out.write(data)
        val crc = CRC32()
        crc.update(typeBytes)
        crc.update(data)
        val crcBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN)
        crcBuf.putInt(crc.value.toInt())
        out.write(crcBuf.array())
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
        payload.write(byteArrayOf(0x12, 0, 0, 0))
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
            payload.write(0x01)
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

    private fun readInt32BE(data: ByteArray, offset: Int): Int =
        ((data[offset].toInt() and 0xFF) shl 24) or
        ((data[offset + 1].toInt() and 0xFF) shl 16) or
        ((data[offset + 2].toInt() and 0xFF) shl 8) or
        (data[offset + 3].toInt() and 0xFF)

    private fun readInt16BE(data: ByteArray, offset: Int): Int =
        ((data[offset].toInt() and 0xFF) shl 8) or
        (data[offset + 1].toInt() and 0xFF)

    private fun ByteArrayOutputStream.writeInt32BE(value: Int) {
        write((value shr 24) and 0xFF)
        write((value shr 16) and 0xFF)
        write((value shr 8) and 0xFF)
        write(value and 0xFF)
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
