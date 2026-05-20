package com.stickercreator

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import java.io.File

class AddStickerPackActivity : ReactActivity() {
    override fun getMainComponentName(): String = "main"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val identifier = intent.getStringExtra("identifier") ?: return
        val stickerPackDir = File(filesDir, "stickers/$identifier")
        if (stickerPackDir.exists()) {
            sendBroadcast(Intent("com.whatsapp.sticker.ADD").apply {
                putExtra("sticker_pack_identifier", identifier)
                putExtra("sticker_pack_name", identifier)
                `package` = "com.whatsapp"
            })
        }
    }
}
