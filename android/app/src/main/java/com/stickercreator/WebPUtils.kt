package com.stickercreator

import android.util.Log
import java.io.File

object WebPUtils {
    private const val TAG = "WebPUtils"

    fun isAnimatedWebP(bytes: ByteArray, logFileName: String = ""): Boolean {
        if (bytes.size < 21) {
            Log.d(TAG, "  [$logFileName] too small: ${bytes.size} bytes")
            return false
        }

        val header = bytes.take(40).joinToString(" ") { String.format("%02X", it) }
        Log.d(TAG, "  [$logFileName] header: $header")

        val riff = String(bytes, 0, 4, Charsets.US_ASCII)
        val webp = String(bytes, 8, 4, Charsets.US_ASCII)
        Log.d(TAG, "  [$logFileName] riff='$riff' webp='$webp'")

        if (riff != "RIFF" || webp != "WEBP") {
            Log.d(TAG, "  [$logFileName] not a WebP file")
            return false
        }

        var offset = 12
        var chunkCount = 0
        while (offset + 8 < bytes.size && chunkCount < 20) {
            val chunkId = String(bytes, offset, 4, Charsets.US_ASCII)
            val chunkSize = (bytes[offset + 4].toInt() and 0xFF) or
                    ((bytes[offset + 5].toInt() and 0xFF) shl 8) or
                    ((bytes[offset + 6].toInt() and 0xFF) shl 16) or
                    ((bytes[offset + 7].toInt() and 0xFF) shl 24)

            Log.d(TAG, "  [$logFileName] chunk[$chunkCount]: id='$chunkId' size=$chunkSize offset=$offset")

            if (chunkId == "ANIM" || chunkId == "ANMF") {
                Log.d(TAG, "  [$logFileName] ANIMATED (found $chunkId)")
                return true
            }
            if (chunkId == "VP8X" && chunkSize >= 4 && offset + 8 < bytes.size) {
                val flags = bytes[offset + 8].toInt() and 0xFF
                Log.d(TAG, "  [$logFileName] VP8X flags=0x${String.format("%02X", flags)} anim_bit=${flags and 0x02 != 0}")
                if (flags and 0x02 != 0) {
                    Log.d(TAG, "  [$logFileName] ANIMATED (VP8X flag)")
                    return true
                }
            }
            offset += 8 + chunkSize + (chunkSize % 2)
            chunkCount++
        }
        Log.d(TAG, "  [$logFileName] NOT animated (scanned $chunkCount chunks)")
        return false
    }

    fun isAnimatedWebP(file: File): Boolean {
        if (!file.exists() || file.length() < 21) return false
        return isAnimatedWebP(file.readBytes(), file.name)
    }

    fun isAnimatedGif(bytes: ByteArray): Boolean {
        if (bytes.size < 6) return false
        val header = String(bytes, 0, 6, Charsets.US_ASCII)
        return header == "GIF89a" || header == "GIF87a"
    }

    fun isAnimatedPng(bytes: ByteArray): Boolean {
        if (bytes.size < 8) return false
        if (bytes[0] != 0x89.toByte() || bytes[1] != 0x50.toByte() ||
            bytes[2] != 0x4E.toByte() || bytes[3] != 0x47.toByte()) return false
        var offset = 8
        while (offset + 8 < bytes.size) {
            val chunkLen = ((bytes[offset].toInt() and 0xFF) shl 24) or
                    ((bytes[offset + 1].toInt() and 0xFF) shl 16) or
                    ((bytes[offset + 2].toInt() and 0xFF) shl 8) or
                    (bytes[offset + 3].toInt() and 0xFF)
            val chunkType = String(bytes, offset + 4, 4, Charsets.US_ASCII)
            if (chunkType == "acTL") return true
            if (chunkType == "IDAT") return false
            offset += 12 + chunkLen
        }
        return false
    }
}
