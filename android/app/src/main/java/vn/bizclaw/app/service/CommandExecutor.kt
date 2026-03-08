package vn.bizclaw.app.service

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.*
import vn.bizclaw.app.engine.*

/**
 * CommandExecutor — executes commands on the device.
 *
 * Routes commands to the appropriate service:
 * - ui_action → AccessibilityService (click, type, scroll, etc.)
 * - chat → ProviderChat / LocalLLM
 * - app → Launch intent
 * - social_reply → Notification inline reply (Zalo, Messenger, etc.)
 * - device → Status info
 *
 * This is the "bridge" that connects external commands to device capabilities.
 */
object CommandExecutor {
    private const val TAG = "CommandExec"

    suspend fun execute(context: Context, cmd: DeviceCommand): CommandResult {
        val startTime = System.currentTimeMillis()
        return try {
            val result = when (cmd.type) {
                CommandType.ui_action -> executeUiAction(cmd)
                CommandType.chat -> executeChat(context, cmd)
                CommandType.app -> executeApp(context, cmd)
                CommandType.social_reply -> executeSocialReply(context, cmd)
                CommandType.automation -> executeAutomation(context, cmd)
                CommandType.device -> executeDeviceInfo(context, cmd)
                CommandType.flow -> executeFlow(context, cmd)
            }
            result.copy(durationMs = System.currentTimeMillis() - startTime)
        } catch (e: Exception) {
            Log.e(TAG, "Command failed: ${cmd.id} — ${e.message}")
            CommandResult(
                id = cmd.id,
                status = CommandStatus.failed,
                error = e.message?.take(200),
                durationMs = System.currentTimeMillis() - startTime,
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    // UI Actions — via AccessibilityService
    // ═══════════════════════════════════════════════════════

    private fun executeUiAction(cmd: DeviceCommand): CommandResult {
        if (!BizClawAccessibilityService.isRunning()) {
            return CommandResult(
                id = cmd.id,
                status = CommandStatus.failed,
                error = "AccessibilityService chưa bật. Vào Settings → Accessibility → BizClaw",
            )
        }

        val success = when (cmd.action) {
            "click_text" -> {
                val text = cmd.params["text"] ?: return errorResult(cmd, "Missing 'text' param")
                BizClawAccessibilityService.clickByText(text)
            }
            "type_text" -> {
                val text = cmd.params["text"] ?: return errorResult(cmd, "Missing 'text' param")
                val fieldHint = cmd.params["field_hint"]
                if (fieldHint != null) {
                    BizClawAccessibilityService.typeIntoField(fieldHint, text)
                } else {
                    BizClawAccessibilityService.typeText(text)
                }
            }
            "tap" -> {
                val x = cmd.params["x"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing 'x'")
                val y = cmd.params["y"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing 'y'")
                BizClawAccessibilityService.tapAt(x, y)
                true
            }
            "swipe" -> {
                val sx = cmd.params["start_x"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing coords")
                val sy = cmd.params["start_y"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing coords")
                val ex = cmd.params["end_x"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing coords")
                val ey = cmd.params["end_y"]?.toFloatOrNull() ?: return errorResult(cmd, "Missing coords")
                val dur = cmd.params["duration_ms"]?.toLongOrNull() ?: 300L
                BizClawAccessibilityService.swipe(sx, sy, ex, ey, dur)
                true
            }
            "scroll_down" -> BizClawAccessibilityService.scrollDown()
            "scroll_up" -> BizClawAccessibilityService.scrollUp()
            "read_screen" -> {
                val content = BizClawAccessibilityService.readScreen()
                val text = if (content != null) {
                    content.elements.joinToString("\n") { el ->
                        "[${el.className.substringAfterLast('.')}] ${el.text} ${el.contentDescription}".trim()
                    }
                } else {
                    "Không đọc được màn hình"
                }
                return CommandResult(
                    id = cmd.id,
                    status = CommandStatus.success,
                    result = mapOf("screen_content" to text),
                )
            }
            "press_enter" -> BizClawAccessibilityService.pressEnter()
            else -> return CommandResult(
                id = cmd.id,
                status = CommandStatus.unsupported,
                error = "Unknown ui_action: ${cmd.action}",
            )
        }

        return CommandResult(
            id = cmd.id,
            status = if (success) CommandStatus.success else CommandStatus.failed,
            result = mapOf("action" to cmd.action, "success" to success.toString()),
        )
    }

    // ═══════════════════════════════════════════════════════
    // Chat — via ProviderChat / LocalLLM
    // ═══════════════════════════════════════════════════════

    private suspend fun executeChat(context: Context, cmd: DeviceCommand): CommandResult {
        val message = cmd.params["message"] ?: return errorResult(cmd, "Missing 'message'")
        val agentId = cmd.params["agent_id"]
        val providerId = cmd.params["provider_id"]

        val providerManager = ProviderManager(context)
        val agentManager = LocalAgentManager(context)

        // Build the prompt based on agent
        val prompt = if (agentId != null) {
            val agents = agentManager.loadAgents()
            val agent = agents.find { it.id == agentId }
                ?: return errorResult(cmd, "Agent '$agentId' not found")
            agentManager.buildPromptForAgent(agent, message)
        } else {
            message
        }

        // Determine provider
        val providers = providerManager.loadProviders()
        val provider = when {
            providerId != null -> providers.find { it.id == providerId }
                ?: return errorResult(cmd, "Provider '$providerId' not found")
            agentId != null -> {
                val agent = agentManager.loadAgents().find { it.id == agentId }
                providers.find { it.id == agent?.providerId }
                    ?: providers.firstOrNull { it.type == ProviderType.LOCAL_GGUF }
                    ?: return errorResult(cmd, "No provider available")
            }
            else -> providers.firstOrNull { it.enabled }
                ?: return errorResult(cmd, "No provider available")
        }

        val response = withContext(Dispatchers.IO) {
            ProviderChat.chat(provider, prompt, message)
        }

        return CommandResult(
            id = cmd.id,
            status = CommandStatus.success,
            result = mapOf(
                "response" to response,
                "provider" to provider.name,
                "agent" to (agentId ?: "default"),
            ),
        )
    }

    // ═══════════════════════════════════════════════════════
    // Social Reply — via Notification inline reply
    // ═══════════════════════════════════════════════════════

    /**
     * Reply to a social app (Zalo, Messenger, etc.) using Notification inline reply.
     *
     * This is MORE RELIABLE than AccessibilityService because:
     * 1. Works even if the app is not open
     * 2. No need to navigate to the conversation
     * 3. Uses Android's built-in RemoteInput mechanism
     *
     * Flow:
     * 1. Find the notification's reply action (Notification.Action with RemoteInput)
     * 2. Fill the RemoteInput with our text
     * 3. Fire the PendingIntent
     */
    fun replySocialNotification(
        context: Context,
        sbn: StatusBarNotification,
        replyText: String,
    ): Boolean {
        val notification = sbn.notification ?: return false
        val actions = notification.actions ?: return false

        for (action in actions) {
            val remoteInputs = action.remoteInputs ?: continue

            // Found a reply action with RemoteInput!
            for (remoteInput in remoteInputs) {
                try {
                    val intent = Intent()
                    val bundle = Bundle()
                    bundle.putCharSequence(remoteInput.resultKey, replyText)
                    android.app.RemoteInput.addResultsToIntent(arrayOf(remoteInput), intent, bundle)

                    action.actionIntent.send(context, 0, intent)
                    Log.i(TAG, "✅ Replied via notification inline: ${replyText.take(50)}")
                    return true
                } catch (e: PendingIntent.CanceledException) {
                    Log.e(TAG, "Reply PendingIntent cancelled: ${e.message}")
                }
            }
        }

        Log.w(TAG, "No inline reply action found in notification — trying Accessibility fallback")
        return false
    }

    /**
     * Fallback: Reply via AccessibilityService (open app → find input → type → send)
     */
    fun replyViaAccessibility(packageName: String, replyText: String): Boolean {
        if (!BizClawAccessibilityService.isRunning()) return false

        // Type text into the focused input
        val typed = BizClawAccessibilityService.typeText(replyText)
        if (!typed) return false

        // Press send
        return BizClawAccessibilityService.pressEnter()
    }

    private suspend fun executeSocialReply(context: Context, cmd: DeviceCommand): CommandResult {
        val replyText = cmd.params["text"] ?: return errorResult(cmd, "Missing 'text'")
        val packageName = cmd.params["package"] ?: "com.zing.zalo"

        // Try notification inline reply first
        val listener = BizClawNotificationListener.instance
        if (listener != null) {
            val activeNotifs = listener.getActiveNotifications()
            val targetNotif = activeNotifs?.find { it.packageName == packageName }
            if (targetNotif != null) {
                val replied = replySocialNotification(context, targetNotif, replyText)
                if (replied) {
                    return CommandResult(
                        id = cmd.id,
                        status = CommandStatus.success,
                        result = mapOf("method" to "notification_inline", "text" to replyText),
                    )
                }
            }
        }

        // Fallback: try AccessibilityService
        val fallback = withContext(Dispatchers.Main) {
            replyViaAccessibility(packageName, replyText)
        }

        return CommandResult(
            id = cmd.id,
            status = if (fallback) CommandStatus.success else CommandStatus.failed,
            result = mapOf("method" to if (fallback) "accessibility" else "none", "text" to replyText),
            error = if (!fallback) "Không thể reply — cần bật Notification Listener hoặc Accessibility" else null,
        )
    }

    // ═══════════════════════════════════════════════════════
    // App Control
    // ═══════════════════════════════════════════════════════

    private fun executeApp(context: Context, cmd: DeviceCommand): CommandResult {
        return when (cmd.action) {
            "open" -> {
                val pkg = cmd.params["package"] ?: return errorResult(cmd, "Missing 'package'")
                val intent = context.packageManager.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    CommandResult(
                        id = cmd.id,
                        status = CommandStatus.success,
                        result = mapOf("opened" to pkg),
                    )
                } else {
                    errorResult(cmd, "App not found: $pkg")
                }
            }
            "press_back" -> {
                if (BizClawAccessibilityService.isRunning()) {
                    BizClawAccessibilityService.pressBack()
                    CommandResult(id = cmd.id, status = CommandStatus.success)
                } else errorResult(cmd, "Accessibility not enabled")
            }
            "press_home" -> {
                if (BizClawAccessibilityService.isRunning()) {
                    BizClawAccessibilityService.pressHome()
                    CommandResult(id = cmd.id, status = CommandStatus.success)
                } else errorResult(cmd, "Accessibility not enabled")
            }
            else -> CommandResult(
                id = cmd.id,
                status = CommandStatus.unsupported,
                error = "Unknown app action: ${cmd.action}",
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    // Device Info
    // ═══════════════════════════════════════════════════════

    private fun executeDeviceInfo(context: Context, cmd: DeviceCommand): CommandResult {
        return when (cmd.action) {
            "status" -> {
                val battery = getBatteryPercent(context)
                CommandResult(
                    id = cmd.id,
                    status = CommandStatus.success,
                    result = mapOf(
                        "battery" to "$battery%",
                        "model_loaded" to (GlobalLLM.loadedModelName ?: "none"),
                        "accessibility" to BizClawAccessibilityService.isRunning().toString(),
                        "notification_listener" to (BizClawNotificationListener.instance != null).toString(),
                        "daemon" to BizClawDaemonService.isRunning().toString(),
                        "android_version" to Build.VERSION.SDK_INT.toString(),
                    ),
                )
            }
            "battery" -> {
                CommandResult(
                    id = cmd.id,
                    status = CommandStatus.success,
                    result = mapOf("percent" to "${getBatteryPercent(context)}"),
                )
            }
            else -> CommandResult(
                id = cmd.id,
                status = CommandStatus.unsupported,
                error = "Unknown device action: ${cmd.action}",
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    // Flow — multi-step automation
    // ═══════════════════════════════════════════════════════

    private suspend fun executeFlow(context: Context, cmd: DeviceCommand): CommandResult {
        val stepsJson = cmd.params["steps"] ?: return errorResult(cmd, "Missing 'steps'")
        val steps = try {
            commandJson.decodeFromString<List<DeviceCommand>>(stepsJson)
        } catch (e: Exception) {
            return errorResult(cmd, "Invalid steps JSON: ${e.message?.take(100)}")
        }

        val results = mutableListOf<String>()
        for ((idx, step) in steps.withIndex()) {
            val delayMs = step.params["delay_ms"]?.toLongOrNull() ?: 500L
            delay(delayMs)

            val result = execute(context, step)
            results.add("Step ${idx + 1}: ${result.status}")

            if (result.status == CommandStatus.failed) {
                return CommandResult(
                    id = cmd.id,
                    status = CommandStatus.failed,
                    result = mapOf("results" to results.joinToString("\n")),
                    error = "Flow failed at step ${idx + 1}: ${result.error}",
                )
            }
        }

        return CommandResult(
            id = cmd.id,
            status = CommandStatus.success,
            result = mapOf(
                "steps_completed" to steps.size.toString(),
                "results" to results.joinToString("\n"),
            ),
        )
    }
    // ═══════════════════════════════════════════════════════
    // Automation — high-level app workflows via AppController
    // ═══════════════════════════════════════════════════════

    private suspend fun executeAutomation(context: Context, cmd: DeviceCommand): CommandResult {
        val controller = AppController(context)

        val automationResult = when (cmd.action) {
            // Gmail
            "gmail_read" -> controller.gmailReadInbox()
            "gmail_compose" -> {
                val to = cmd.params["to"] ?: return errorResult(cmd, "Missing 'to'")
                val subject = cmd.params["subject"] ?: return errorResult(cmd, "Missing 'subject'")
                val body = cmd.params["body"] ?: ""
                controller.gmailCompose(to, subject, body)
            }
            "gmail_search" -> {
                val query = cmd.params["query"] ?: return errorResult(cmd, "Missing 'query'")
                controller.gmailSearch(query)
            }
            "gmail_archive" -> controller.gmailArchive()
            "gmail_label" -> {
                val label = cmd.params["label"] ?: return errorResult(cmd, "Missing 'label'")
                controller.gmailLabel(label)
            }
            "gmail_mark_read" -> controller.gmailMarkRead(true)
            "gmail_mark_unread" -> controller.gmailMarkRead(false)

            // Facebook
            "facebook_post" -> {
                val content = cmd.params["content"] ?: return errorResult(cmd, "Missing 'content'")
                controller.facebookPost(content)
            }
            "facebook_comment" -> {
                val comment = cmd.params["comment"] ?: return errorResult(cmd, "Missing 'comment'")
                controller.facebookComment(comment)
            }

            // Messenger
            "messenger_reply" -> {
                val contact = cmd.params["contact"] ?: return errorResult(cmd, "Missing 'contact'")
                val message = cmd.params["message"] ?: return errorResult(cmd, "Missing 'message'")
                controller.messengerReply(contact, message)
            }
            "messenger_read" -> controller.messengerReadMessages()

            // Zalo
            "zalo_send" -> {
                val contact = cmd.params["contact"] ?: return errorResult(cmd, "Missing 'contact'")
                val message = cmd.params["message"] ?: return errorResult(cmd, "Missing 'message'")
                controller.zaloSendMessage(contact, message)
            }

            // Instagram
            "instagram_post" -> {
                val caption = cmd.params["caption"] ?: return errorResult(cmd, "Missing 'caption'")
                controller.instagramCaption(caption)
            }

            // Screen reading
            "read_screen" -> controller.readCurrentScreen()
            "click" -> {
                val text = cmd.params["text"] ?: return errorResult(cmd, "Missing 'text'")
                controller.clickElement(text)
            }

            else -> return CommandResult(
                id = cmd.id,
                status = CommandStatus.unsupported,
                error = "Unknown automation: ${cmd.action}. Available: gmail_read, gmail_compose, gmail_search, gmail_archive, gmail_label, facebook_post, facebook_comment, messenger_reply, zalo_send, instagram_post",
            )
        }

        return CommandResult(
            id = cmd.id,
            status = if (automationResult.success) CommandStatus.success else CommandStatus.failed,
            result = mapOf("message" to automationResult.message),
            error = if (!automationResult.success) automationResult.message else null,
        )
    }

    // ─── Helpers ─────────────────────────────────

    private fun errorResult(cmd: DeviceCommand, error: String) = CommandResult(
        id = cmd.id,
        status = CommandStatus.failed,
        error = error,
    )

    private fun getBatteryPercent(context: Context): Int {
        return try {
            val batteryIntent = context.registerReceiver(
                null,
                android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED),
            )
            val level = batteryIntent?.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryIntent?.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, 100) ?: 100
            if (level >= 0 && scale > 0) (level * 100) / scale else -1
        } catch (_: Exception) { -1 }
    }
}
