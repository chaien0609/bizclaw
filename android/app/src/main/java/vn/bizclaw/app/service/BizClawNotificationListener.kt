package vn.bizclaw.app.service

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.*
import vn.bizclaw.app.engine.GlobalLLM
import vn.bizclaw.app.engine.LocalAgentManager

/**
 * BizClaw Notification Listener — catches messages from Zalo, FB, Messenger.
 *
 * When a notification arrives from a monitored app AND an agent has
 * autoReply=true for that app → triggers AI reply via Accessibility Service.
 *
 * Requires user to enable in Settings → Notifications → Notification access
 */
class BizClawNotificationListener : NotificationListenerService() {

    companion object {
        const val TAG = "BizClawNotify"

        // App packages to monitor
        val MONITORED_APPS = mapOf(
            "com.zing.zalo" to "Zalo",
            "com.facebook.orca" to "Messenger",
            "com.facebook.katana" to "Facebook",
            "com.instagram.android" to "Instagram",
        )

        var instance: BizClawNotificationListener? = null
            private set

        // Callback for UI to show received notifications
        var onNotificationReceived: ((SocialNotification) -> Unit)? = null

        // Recent notifications for display
        val recentNotifications = mutableListOf<SocialNotification>()
    }

    data class SocialNotification(
        val app: String,         // "Zalo", "Messenger", etc.
        val packageName: String,
        val sender: String,
        val message: String,
        val timestamp: Long = System.currentTimeMillis(),
        val replied: Boolean = false,
        val replyContent: String = "",
    )

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.i(TAG, "🔔 NotificationListener connected — monitoring social apps")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return

        val pkg = sbn.packageName
        val appName = MONITORED_APPS[pkg] ?: return // Ignore non-monitored apps

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        if (text.isBlank()) return

        Log.i(TAG, "📩 $appName — $title: $text")

        val socialNotif = SocialNotification(
            app = appName,
            packageName = pkg,
            sender = title,
            message = text,
        )

        // Store in recent list (cap at 50)
        synchronized(recentNotifications) {
            recentNotifications.add(0, socialNotif)
            if (recentNotifications.size > 50) {
                recentNotifications.removeAt(recentNotifications.lastIndex)
            }
        }

        // Notify UI
        onNotificationReceived?.invoke(socialNotif)

        // Check if any agent should auto-reply
        checkAutoReply(socialNotif)
    }

    private fun checkAutoReply(notif: SocialNotification) {
        if (!GlobalLLM.instance.isLoaded) return // No model loaded

        val manager = LocalAgentManager(applicationContext)
        val agents = manager.loadAgents()

        // Find an agent with autoReply=true that handles this app
        val agent = agents.find { it.autoReply && notif.packageName in it.triggerApps }
            ?: return

        Log.i(TAG, "🤖 Auto-reply triggered: ${agent.name} → ${notif.app}")

        scope.launch {
            try {
                // Build prompt with RAG context
                val fullPrompt = manager.buildPromptForAgent(agent, notif.message)

                // Set agent prompt and get AI response
                val llm = GlobalLLM.instance
                llm.addSystemPrompt(fullPrompt)

                val response = StringBuilder()
                llm.getResponseAsFlow("Tin nhắn từ ${notif.sender} trên ${notif.app}: ${notif.message}")
                    .collect { token -> response.append(token) }

                val replyText = response.toString().trim()
                Log.i(TAG, "✅ Reply: $replyText")

                // Update notification with reply
                synchronized(recentNotifications) {
                    val idx = recentNotifications.indexOfFirst {
                        it.timestamp == notif.timestamp && it.message == notif.message
                    }
                    if (idx >= 0) {
                        recentNotifications[idx] = notif.copy(
                            replied = true,
                            replyContent = replyText,
                        )
                    }
                }

                // TODO: Use AccessibilityService to actually type the reply
                // For now, just log it — user can copy and paste

            } catch (e: Exception) {
                Log.e(TAG, "❌ Auto-reply failed: ${e.message}")
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Not needed
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
        Log.i(TAG, "🔔 NotificationListener disconnected")
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        instance = null
    }
}
