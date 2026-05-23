package io.github.melvinchia3636.stickr

import android.content.Context
import android.net.Uri

object WhitelistCheck {
    fun isWhitelisted(context: Context, identifier: String): Boolean {
        return try {
            context.contentResolver.query(
                Uri.parse("content://${context.packageName}.stickercontentprovider/metadata/$identifier"),
                null, null, null, null
            )?.use { it.moveToFirst() } ?: false
        } catch (e: Exception) {
            false
        }
    }
}
