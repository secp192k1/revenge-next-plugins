@file:JvmName("PreviewAttachments")

package dev.alphexo.previewattachments

import android.content.Context
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import de.robv.android.xposed.XC_MethodHook
import de.robv.android.xposed.XposedBridge
import de.robv.android.xposed.XposedHelpers.findClass
import de.robv.android.xposed.XposedHelpers.findField
import de.robv.android.xposed.XposedHelpers.findMethodExact
import de.robv.android.xposed.XposedHelpers.findMethodExactIfExists
import de.robv.android.xposed.XposedHelpers.getStaticObjectField
import io.github.revenge.plugins.plugin
import io.github.revenge.xposed.api.callJSMethod
import io.github.revenge.xposed.api.registerNativeMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Discord's own list, sent by the JS side once its PlaintextFilePreviewHelpers module loads
@Volatile
private var previewableExtensions: Set<String> = emptySet()

val previewAttachments = plugin {
    var setContentUnhook: XC_MethodHook.Unhook? = null

    start {
        registerNativeMethod("${manifest.id}.setPreviewableExtensions") { extensions ->
            previewableExtensions = extensions.mapTo(HashSet()) { it as String }
        }

        val fileAttachmentView = findClass("com.discord.chat.presentation.message.view.FileAttachmentView", classLoader)

        val setContent = findMethodExactIfExists(
            fileAttachmentView, "setContent",
            String::class.java, String::class.java, String::class.java,
            Boolean::class.javaPrimitiveType,
            "kotlin.jvm.functions.Function2",
            Boolean::class.javaPrimitiveType,
            "com.discord.chat.bridge.spoiler.SpoilerConfig",
            "com.discord.chat.presentation.message.view.UploadItemProps",
            Int::class.javaObjectType,
        )
        if (setContent == null) {
            findMethodExact(
                fileAttachmentView, "setContent",
                String::class.java, String::class.java, String::class.java,
                Boolean::class.javaPrimitiveType,
                "kotlin.jvm.functions.Function2",
                Boolean::class.javaPrimitiveType,
                "com.discord.chat.bridge.spoiler.SpoilerConfig",
                "com.discord.chat.presentation.message.view.UploadItemProps",
                Int::class.javaObjectType,
                String::class.java, String::class.java,
                "kotlin.jvm.functions.Function0",
            )
            log.i("Discord shows its own text preview button, FileAttachmentView.setContent not patched")
            return@start
        }

        val bindingField = findField(fileAttachmentView, "binding")
        val downloadButtonField = findField(bindingField.type, "fileAttachmentDownload")
        val simpleDraweeView = findClass("com.facebook.drawee.view.SimpleDraweeView", classLoader)
        val simpleDraweeViewConstructor = simpleDraweeView.getConstructor(Context::class.java)
        val reactAsset = findClass("com.discord.react_asset_fetcher.ReactAsset", classLoader)
        val eyeIcon = getStaticObjectField(reactAsset, "EyeIcon")
        val setReactAsset = findMethodExact("com.discord.react_asset_fetcher.ReactAssetUtilsKt", classLoader, "setReactAsset", simpleDraweeView, reactAsset)
        val bridgeScope = CoroutineScope(Dispatchers.Default)
        val previewMethod = "${manifest.id}.preview"

        // Discord's text preview is React, so the JS side opens it
        val previewClickListener = View.OnClickListener { button ->
            bridgeScope.launch {
                runCatching {
                    callJSMethod(previewMethod, button.tag as List<*>)
                }.onFailure {
                    log.e("Opening the preview failed", it)
                }
            }
        }

        // Discord tints the download icon with a plain color filter, so copying it matches the theme without reflection
        fun createEyeIcon(downloadButton: ImageView) = (simpleDraweeViewConstructor.newInstance(downloadButton.context) as ImageView).apply {
            setReactAsset.invoke(null, this, eyeIcon)
            colorFilter = downloadButton.colorFilter
        }

        setContentUnhook = XposedBridge.hookMethod(
            setContent,
            object : XC_MethodHook() {
                override fun afterHookedMethod(hookedCall: MethodHookParam) {
                    val attachmentView = hookedCall.thisObject as ViewGroup
                    val downloadButton = downloadButtonField.get(bindingField.get(attachmentView)) as ImageView
                    val actionGroup = downloadButton.parent as ViewGroup
                    val previewButton = (actionGroup.parent as? LinearLayout)?.getChildAt(0)
                        ?: addPreviewButton(attachmentView, actionGroup, createEyeIcon(downloadButton), previewClickListener)
                    val fileName = hookedCall.args[0] as String
                    previewButton.tag = listOf(fileName, hookedCall.args[2])
                    // Same check as Discord's isPlaintextPreviewableFile
                    val previewable = fileName.substringAfterLast('.') in previewableExtensions
                    previewButton.visibility = if (previewable && downloadButton.visibility == View.VISIBLE) View.VISIBLE else View.GONE
                }
            },
        )
        log.i("Patched FileAttachmentView.setContent")
    }

    stop {
        setContentUnhook?.unhook()
        requireReload()
    }
}

// ConstraintLayout.LayoutParams fields are obfuscated in Discord, so a wrapper reuses the action group params instead of new constraints
private fun addPreviewButton(attachmentView: ViewGroup, actionGroup: ViewGroup, previewButton: View, clickListener: View.OnClickListener): View {
    val context = attachmentView.context
    previewButton.apply {
        layoutParams = LinearLayout.LayoutParams(context.dp(24), context.dp(24)).apply { marginEnd = context.dp(8) }
        contentDescription = "Preview"
        setOnClickListener(clickListener)
    }

    val constraintLayoutParams = actionGroup.layoutParams
    val index = attachmentView.indexOfChild(actionGroup)
    attachmentView.removeViewAt(index)

    // The attachment name is constrained to the action group id, so the wrapper takes it over
    val wrapper = LinearLayout(context).apply { gravity = Gravity.CENTER_VERTICAL; id = actionGroup.id }
    actionGroup.id = View.generateViewId()
    wrapper.addView(previewButton)
    wrapper.addView(actionGroup, LinearLayout.LayoutParams(constraintLayoutParams.width, constraintLayoutParams.height))
    constraintLayoutParams.width = ViewGroup.LayoutParams.WRAP_CONTENT
    attachmentView.addView(wrapper, index, constraintLayoutParams)
    return previewButton
}

private fun Context.dp(value: Int) = (value * resources.displayMetrics.density).toInt()
