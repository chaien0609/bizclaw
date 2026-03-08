package vn.bizclaw.app.service

import android.content.Context
import android.content.Intent
import android.net.Uri
import kotlinx.coroutines.delay

/**
 * AppController — high-level automation for popular apps.
 *
 * Uses BizClawAccessibilityService to control apps like Facebook, Messenger, Zalo.
 * Each method is a complete "workflow" that agents can call as a single tool.
 *
 * ⚙️ Architecture:
 *   Agent tool call "facebook.post"
 *       → AppController.facebookPost()
 *           → Open Facebook app
 *           → Find "Bạn đang nghĩ gì?" field
 *           → Tap → Type content → Tap "Đăng"
 *
 * ⚠️ IMPORTANT:
 * - Accessibility Service must be enabled by user
 * - UI elements may change with app updates (Facebook, Messenger...)
 * - Use Vietnamese localized text for element matching
 * - Add delays between actions for UI to render
 */
class AppController(private val context: Context) {

    private val a11y get() = BizClawAccessibilityService

    // ─── Facebook ─────────────────────────────────────────────────

    /**
     * Post content to Facebook feed.
     *
     * Flow:
     * 1. Open Facebook app
     * 2. Find "Bạn đang nghĩ gì?" or "What's on your mind?"
     * 3. Tap to open composer
     * 4. Type content
     * 5. Tap "Đăng" / "Post"
     */
    suspend fun facebookPost(content: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            // Step 1: Open Facebook
            openApp("com.facebook.katana")
            delay(2000) // Wait for app to launch

            // Step 2: Find and tap the "What's on your mind?" field
            val tapped = a11y.clickByText("Bạn đang nghĩ gì")
                || a11y.clickByText("Bạn nghĩ gì")
                || a11y.clickByText("What's on your mind")
                || a11y.clickByText("Viết gì đó")
            if (!tapped) return AutomationResult.error("Cannot find post composer field")
            delay(2000)

            // Step 3: Type content
            val typed = a11y.typeIntoField("Bạn đang nghĩ gì", content)
                || a11y.typeText(content)
            if (!typed) return AutomationResult.error("Cannot type into post field")
            delay(1000)

            // Step 4: Tap Post button
            val posted = a11y.clickByText("Đăng")
                || a11y.clickByText("Post")
            if (!posted) return AutomationResult.error("Cannot find Post button")

            AutomationResult.success("Posted to Facebook: ${content.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Facebook post failed: ${e.message}")
        }
    }

    /**
     * Comment on the first/current post visible on Facebook.
     */
    suspend fun facebookComment(comment: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            // Find and tap Comment button/icon
            val tapped = a11y.clickByText("Bình luận")
                || a11y.clickByText("Comment")
            if (!tapped) return AutomationResult.error("Cannot find Comment button")
            delay(1000)

            // Type comment
            val typed = a11y.typeText(comment)
            if (!typed) return AutomationResult.error("Cannot type comment")
            delay(300)

            // Send comment (Enter or send button)
            a11y.pressEnter()

            AutomationResult.success("Commented on Facebook: ${comment.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Facebook comment failed: ${e.message}")
        }
    }

    // ─── Messenger ────────────────────────────────────────────────

    /**
     * Reply to a Messenger conversation by contact name.
     *
     * Flow:
     * 1. Open Messenger
     * 2. Find conversation by name
     * 3. Tap to open
     * 4. Type and send message
     */
    suspend fun messengerReply(contactName: String, message: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            // Step 1: Open Messenger
            openApp("com.facebook.orca")
            delay(2000)

            // Step 2: Find and tap conversation
            val found = a11y.clickByText(contactName)
            if (!found) return AutomationResult.error("Cannot find conversation: $contactName")
            delay(1500)

            // Step 3: Find message input and type
            val typed = a11y.typeIntoField("Aa", message)
                || a11y.typeIntoField("Message", message)
                || a11y.typeIntoField("Nhắn tin", message)
                || a11y.typeText(message)
            if (!typed) return AutomationResult.error("Cannot type into message field")
            delay(300)

            // Step 4: Send (tap send button or press enter)
            val sent = a11y.clickByText("Gửi")
                || a11y.clickByText("Send")
                || a11y.pressEnter()
            if (!sent) return AutomationResult.error("Cannot send message")

            AutomationResult.success("Sent to $contactName: ${message.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Messenger reply failed: ${e.message}")
        }
    }

    /**
     * Read the last messages in the current Messenger conversation.
     */
    fun messengerReadMessages(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        val screen = a11y.readScreen() ?: return AutomationResult.error("Cannot read screen")

        if (!screen.packageName.contains("facebook.orca")) {
            return AutomationResult.error("Messenger is not open")
        }

        val messages = screen.elements
            .filter { it.text.isNotEmpty() && !it.isClickable && !it.isEditable }
            .map { it.text }
            .takeLast(10)

        return AutomationResult.success(
            "Messages:\n${messages.joinToString("\n")}"
        )
    }

    // ─── Zalo ─────────────────────────────────────────────────────

    /**
     * Send a Zalo message to a contact.
     */
    suspend fun zaloSendMessage(contactName: String, message: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.zing.zalo")
            delay(2000)

            val found = a11y.clickByText(contactName)
            if (!found) return AutomationResult.error("Cannot find: $contactName")
            delay(1500)

            val typed = a11y.typeIntoField("Nhắn tin", message)
                || a11y.typeIntoField("Tin nhắn", message)
                || a11y.typeText(message)
            if (!typed) return AutomationResult.error("Cannot type message")
            delay(300)

            a11y.clickByText("Gửi") || a11y.pressEnter()

            AutomationResult.success("Zalo sent to $contactName: ${message.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Zalo failed: ${e.message}")
        }
    }

    /** Post to Zalo Timeline/Nhật ký (đăng bài mạng xã hội Zalo) */
    suspend fun zaloPost(content: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.zing.zalo")
            delay(2000)

            // Navigate to Nhật ký (Timeline) tab
            val goToTimeline = a11y.clickByText("Nhật ký")
                || a11y.clickByText("Timeline")
                || a11y.clickByText("Cá nhân")
            if (!goToTimeline) {
                // Try tab index 3 (usually Nhật ký is the 3rd or 4th tab)
                a11y.clickByText("Khám phá")
            }
            delay(1500)

            // Tap compose / create post
            val compose = a11y.clickByText("Hôm nay bạn")
                || a11y.clickByText("Bạn đang nghĩ gì")
                || a11y.clickByText("Đăng gì đó")
                || a11y.clickByText("Viết bài")
                || a11y.clickByText("Tạo bài viết")
                || a11y.clickByText("What's on your mind")
            if (!compose) return AutomationResult.error("Không tìm thấy ô đăng bài Zalo")
            delay(2000)

            // Type post content
            val typed = a11y.typeIntoField("nhĩ gì", content)
                || a11y.typeIntoField("Hãy chia sẻ", content)
                || a11y.typeIntoField("Chia sẻ", content)
                || a11y.typeText(content)
            if (!typed) return AutomationResult.error("Không nhập được nội dung bài Zalo")
            delay(1000)

            // Post / Đăng
            val posted = a11y.clickByText("Đăng")
                || a11y.clickByText("Post")
                || a11y.clickByText("Chia sẻ")
            if (!posted) return AutomationResult.error("Không tìm nút Đăng bài Zalo")

            AutomationResult.success("📝 Zalo Timeline posted: ${content.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Zalo post failed: ${e.message}")
        }
    }

    /** Read Zalo Timeline / Nhật ký feed */
    suspend fun zaloReadTimeline(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.zing.zalo")
            delay(2000)

            // Navigate to Nhật ký
            a11y.clickByText("Nhật ký")
                || a11y.clickByText("Timeline")
                || a11y.clickByText("Cá nhân")
            delay(1500)

            val result = readCurrentScreen()
            if (result.success) {
                AutomationResult.success("📝 Zalo Timeline:\n${result.message}")
            } else {
                AutomationResult.error("Cannot read Zalo timeline")
            }
        } catch (e: Exception) {
            AutomationResult.error("Zalo timeline read failed: ${e.message}")
        }
    }

    // ─── Gmail / Email ────────────────────────────────────────────

    /**
     * Read the Gmail inbox — returns subject lines + senders of visible emails.
     *
     * Flow:
     * 1. Open Gmail app
     * 2. Wait for inbox to load
     * 3. Read screen content to extract email subjects and senders
     */
    suspend fun gmailReadInbox(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.google.android.gm")
            delay(2500) // Gmail can be slow to load

            val screen = a11y.readScreen()
                ?: return AutomationResult.error("Cannot read Gmail screen")

            if (!screen.packageName.contains("android.gm")) {
                return AutomationResult.error("Gmail is not open (current: ${screen.packageName})")
            }

            // Extract email items from screen elements
            val emails = screen.elements
                .filter { it.text.isNotEmpty() && !it.isEditable }
                .map { it.text }
                .filter { text ->
                    // Filter out UI chrome, keep email content
                    text.length > 3 &&
                    !text.startsWith("Gmail") &&
                    !text.startsWith("Search") &&
                    !text.startsWith("Compose") &&
                    !text.contains("Navigation")
                }
                .take(20)

            if (emails.isEmpty()) {
                AutomationResult.success("Inbox trống hoặc không đọc được nội dung.")
            } else {
                AutomationResult.success(
                    "📧 Gmail Inbox (${emails.size} items):\n${emails.joinToString("\n") { "• $it" }}"
                )
            }
        } catch (e: Exception) {
            AutomationResult.error("Gmail read failed: ${e.message}")
        }
    }

    /**
     * Compose and send an email via Gmail.
     *
     * Flow:
     * 1. Open Gmail app
     * 2. Tap Compose button
     * 3. Fill To, Subject, Body
     * 4. Tap Send
     */
    suspend fun gmailCompose(to: String, subject: String, body: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.google.android.gm")
            delay(2000)

            // Tap Compose / Soạn thư
            val tapped = a11y.clickByText("Compose")
                || a11y.clickByText("Soạn thư")
                || a11y.clickByText("✏️")
            if (!tapped) return AutomationResult.error("Cannot find Compose button")
            delay(1500)

            // Fill To field
            val toFilled = a11y.typeIntoField("To", to)
                || a11y.typeIntoField("Tới", to)
            if (!toFilled) return AutomationResult.error("Cannot fill To field")
            delay(300)

            // Fill Subject
            val subFilled = a11y.typeIntoField("Subject", subject)
                || a11y.typeIntoField("Chủ đề", subject)
            if (!subFilled) return AutomationResult.error("Cannot fill Subject field")
            delay(300)

            // Fill Body
            val bodyFilled = a11y.typeIntoField("Compose email", body)
                || a11y.typeIntoField("Soạn email", body)
                || a11y.typeText(body)
            if (!bodyFilled) return AutomationResult.error("Cannot fill email body")
            delay(300)

            // Send
            val sent = a11y.clickByText("Send")
                || a11y.clickByText("Gửi")
                || a11y.clickByText("➤")
            if (!sent) return AutomationResult.error("Cannot find Send button")

            AutomationResult.success("📧 Email sent to $to: $subject")
        } catch (e: Exception) {
            AutomationResult.error("Gmail compose failed: ${e.message}")
        }
    }

    /**
     * Search emails in Gmail.
     * Returns subjects of matching emails visible on screen.
     */
    suspend fun gmailSearch(query: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.google.android.gm")
            delay(2000)

            // Tap search
            val tapped = a11y.clickByText("Search in mail")
                || a11y.clickByText("Tìm trong thư")
                || a11y.clickByText("Search")
            if (!tapped) return AutomationResult.error("Cannot find Search field")
            delay(800)

            // Type search query
            val typed = a11y.typeText(query)
            if (!typed) return AutomationResult.error("Cannot type search query")
            delay(300)

            // Submit search
            a11y.pressEnter()
            delay(2000) // Wait for results

            // Read results
            val screen = a11y.readScreen()
                ?: return AutomationResult.error("Cannot read search results")

            val results = screen.elements
                .filter { it.text.isNotEmpty() && it.text.length > 5 }
                .map { it.text }
                .take(15)

            AutomationResult.success(
                "🔍 Search '$query' (${results.size} results):\n${results.joinToString("\n") { "• $it" }}"
            )
        } catch (e: Exception) {
            AutomationResult.error("Gmail search failed: ${e.message}")
        }
    }

    /**
     * Archive the currently open email in Gmail.
     */
    suspend fun gmailArchive(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            val archived = a11y.clickByText("Archive")
                || a11y.clickByText("Lưu trữ")
            if (archived) {
                AutomationResult.success("📥 Email archived")
            } else {
                AutomationResult.error("Cannot find Archive button — is an email open?")
            }
        } catch (e: Exception) {
            AutomationResult.error("Gmail archive failed: ${e.message}")
        }
    }

    /**
     * Label/categorize the currently open email.
     * Taps "Label" menu and selects the specified label.
     */
    suspend fun gmailLabel(label: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            // Tap the 3-dot menu or Label button
            val menuTapped = a11y.clickByText("More options")
                || a11y.clickByText("Thêm tùy chọn")
                || a11y.clickByText("⋮")
            if (!menuTapped) return AutomationResult.error("Cannot open menu")
            delay(500)

            // Tap Label
            val labelTapped = a11y.clickByText("Label")
                || a11y.clickByText("Nhãn")
                || a11y.clickByText("Move to")
                || a11y.clickByText("Di chuyển tới")
            if (!labelTapped) return AutomationResult.error("Cannot find Label option")
            delay(500)

            // Select the target label
            val selected = a11y.clickByText(label)
            if (!selected) return AutomationResult.error("Label not found: $label")
            delay(300)

            // Confirm
            a11y.clickByText("OK") || a11y.clickByText("Apply") || a11y.clickByText("Áp dụng")

            AutomationResult.success("🏷️ Email labeled: $label")
        } catch (e: Exception) {
            AutomationResult.error("Gmail label failed: ${e.message}")
        }
    }

    /**
     * Mark the current email as read/unread.
     */
    suspend fun gmailMarkRead(markAsRead: Boolean = true): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            val text = if (markAsRead) {
                a11y.clickByText("Mark as read") || a11y.clickByText("Đánh dấu là đã đọc")
            } else {
                a11y.clickByText("Mark as unread") || a11y.clickByText("Đánh dấu là chưa đọc")
            }

            if (text) {
                AutomationResult.success(if (markAsRead) "✅ Marked as read" else "📧 Marked as unread")
            } else {
                AutomationResult.error("Cannot find mark read/unread option")
            }
        } catch (e: Exception) {
            AutomationResult.error("Gmail mark failed: ${e.message}")
        }
    }

    // ─── Instagram ────────────────────────────────────────────────

    /**
     * Post a caption to Instagram (assumes image is already selected or camera is open).
     * For full posting, user needs to select image first.
     */
    suspend fun instagramCaption(caption: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            // If Instagram isn't open, open it
            openApp("com.instagram.android")
            delay(2000)

            // Tap the create/post button (+ icon)
            val createTapped = a11y.clickByText("Create")
                || a11y.clickByText("Tạo")
                || a11y.clickByText("+")
            if (!createTapped) return AutomationResult.error("Cannot find Create button")
            delay(1500)

            // Select Post option
            a11y.clickByText("Post") || a11y.clickByText("Bài viết")
            delay(1000)

            // Select first image (tap "Next" to proceed)
            a11y.clickByText("Next") || a11y.clickByText("Tiếp")
            delay(1000)

            // Skip filters
            a11y.clickByText("Next") || a11y.clickByText("Tiếp")
            delay(1000)

            // Type caption
            val typed = a11y.typeIntoField("Write a caption", caption)
                || a11y.typeIntoField("Viết chú thích", caption)
                || a11y.typeText(caption)
            if (!typed) return AutomationResult.error("Cannot type caption")
            delay(300)

            // Share
            val shared = a11y.clickByText("Share")
                || a11y.clickByText("Chia sẻ")
            if (!shared) return AutomationResult.error("Cannot find Share button")

            AutomationResult.success("📸 Instagram posted: ${caption.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Instagram post failed: ${e.message}")
        }
    }

    // ─── Threads (Meta) ─────────────────────────────────────

    /** Post to Threads */
    suspend fun threadsPost(content: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.instagram.barcelona")
            delay(2000)

            // Tap compose/new post button
            val newPost = a11y.clickByText("New thread")
                || a11y.clickByText("Tạo thread mới")
                || a11y.clickByText("+")
                || a11y.clickByText("Đăng")
            if (!newPost) {
                // Try tapping the FAB/compose icon at bottom
                a11y.clickByText("Compose")
                    || a11y.clickByText("Soạn")
            }
            delay(1500)

            // Type content
            val typed = a11y.typeText(content)
            if (!typed) return AutomationResult.error("Cannot type in Threads")
            delay(300)

            // Post
            val posted = a11y.clickByText("Post")
                || a11y.clickByText("Đăng")
                || a11y.clickByText("Share")
            if (!posted) return AutomationResult.error("Cannot find Post button")

            AutomationResult.success("🧵 Threads posted: ${content.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Threads post failed: ${e.message}")
        }
    }

    /** Read Threads feed */
    suspend fun threadsReadFeed(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("com.instagram.barcelona")
            delay(2000)
            val result = readCurrentScreen()
            if (result.success) {
                AutomationResult.success("🧵 Threads Feed:\n${result.message}")
            } else {
                AutomationResult.error("Cannot read Threads feed")
            }
        } catch (e: Exception) {
            AutomationResult.error("Threads read failed: ${e.message}")
        }
    }

    // ─── Lark (Feishu) ────────────────────────────────────────

    /** Lark package — international version; CN = com.ss.android.lark */
    private val larkPackage: String
        get() {
            // Try international first, fall back to CN
            val intent = context.packageManager.getLaunchIntentForPackage("com.larksuite.suite")
            return if (intent != null) "com.larksuite.suite" else "com.ss.android.lark"
        }

    /**
     * Read Lark chat inbox — returns visible chat names and last messages.
     */
    suspend fun larkReadChats(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp(larkPackage)
            delay(2500)

            // Tap "消息" / "Messaging" tab if not already there
            a11y.clickByText("Messaging") || a11y.clickByText("消息")
                || a11y.clickByText("Tin nhắn") || a11y.clickByText("Chat")
            delay(1000)

            val screen = a11y.readScreen()
                ?: return AutomationResult.error("Cannot read Lark screen")

            val chats = screen.elements
                .filter { it.text.isNotEmpty() && !it.isEditable }
                .map { it.text }
                .filter { text ->
                    text.length > 2 &&
                    !text.equals("Messaging", ignoreCase = true) &&
                    !text.equals("消息") &&
                    !text.contains("Search") &&
                    !text.contains("搜索") &&
                    !text.contains("Navigation")
                }
                .take(20)

            AutomationResult.success(
                "💬 Lark Chats (${chats.size}):\n${chats.joinToString("\n") { "• $it" }}"
            )
        } catch (e: Exception) {
            AutomationResult.error("Lark read chats failed: ${e.message}")
        }
    }

    /**
     * Send a Lark message to a contact/group.
     */
    suspend fun larkSendMessage(contactName: String, message: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp(larkPackage)
            delay(2000)

            // Find and tap conversation
            val found = a11y.clickByText(contactName)
            if (!found) return AutomationResult.error("Cannot find Lark chat: $contactName")
            delay(1500)

            // Type message
            val typed = a11y.typeIntoField("Message", message)
                || a11y.typeIntoField("Tin nhắn", message)
                || a11y.typeIntoField("输入消息", message)
                || a11y.typeText(message)
            if (!typed) return AutomationResult.error("Cannot type message in Lark")
            delay(300)

            // Send
            val sent = a11y.clickByText("Send")
                || a11y.clickByText("Gửi")
                || a11y.clickByText("发送")
                || a11y.pressEnter()
            if (!sent) return AutomationResult.error("Cannot send Lark message")

            AutomationResult.success("💬 Lark sent to $contactName: ${message.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Lark send failed: ${e.message}")
        }
    }

    /**
     * Read Lark Mail inbox.
     */
    suspend fun larkReadMail(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp(larkPackage)
            delay(2000)

            // Navigate to Mail tab
            val mailTapped = a11y.clickByText("Mail")
                || a11y.clickByText("邮箱")
                || a11y.clickByText("Hộp thư")
                || a11y.clickByText("Email")
            if (!mailTapped) return AutomationResult.error("Cannot find Lark Mail tab")
            delay(2000)

            val screen = a11y.readScreen()
                ?: return AutomationResult.error("Cannot read Lark Mail screen")

            val emails = screen.elements
                .filter { it.text.isNotEmpty() && !it.isEditable }
                .map { it.text }
                .filter { text ->
                    text.length > 3 &&
                    !text.equals("Mail", ignoreCase = true) &&
                    !text.equals("邮箱") &&
                    !text.contains("Compose") &&
                    !text.contains("写邮件") &&
                    !text.contains("Navigation")
                }
                .take(20)

            if (emails.isEmpty()) {
                AutomationResult.success("📭 Lark Mail: Hộp thư trống hoặc không đọc được.")
            } else {
                AutomationResult.success(
                    "📧 Lark Mail (${emails.size}):\n${emails.joinToString("\n") { "• $it" }}"
                )
            }
        } catch (e: Exception) {
            AutomationResult.error("Lark mail read failed: ${e.message}")
        }
    }

    /**
     * Compose and send a Lark Mail.
     */
    suspend fun larkComposeMail(to: String, subject: String, body: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp(larkPackage)
            delay(2000)

            // Go to Mail
            a11y.clickByText("Mail") || a11y.clickByText("邮箱")
                || a11y.clickByText("Hộp thư")
            delay(1500)

            // Tap Compose
            val composeTapped = a11y.clickByText("Compose")
                || a11y.clickByText("写邮件")
                || a11y.clickByText("Soạn thư")
                || a11y.clickByText("✏️")
            if (!composeTapped) return AutomationResult.error("Cannot find Compose in Lark Mail")
            delay(1500)

            // Fill To
            val toFilled = a11y.typeIntoField("To", to)
                || a11y.typeIntoField("收件人", to)
                || a11y.typeIntoField("Tới", to)
            if (!toFilled) return AutomationResult.error("Cannot fill To field")
            delay(300)

            // Fill Subject
            val subFilled = a11y.typeIntoField("Subject", subject)
                || a11y.typeIntoField("主题", subject)
                || a11y.typeIntoField("Chủ đề", subject)
            if (!subFilled) return AutomationResult.error("Cannot fill Subject")
            delay(300)

            // Fill Body
            val bodyFilled = a11y.typeIntoField("Content", body)
                || a11y.typeIntoField("正文", body)
                || a11y.typeText(body)
            if (!bodyFilled) return AutomationResult.error("Cannot fill mail body")
            delay(300)

            // Send
            val sent = a11y.clickByText("Send")
                || a11y.clickByText("发送")
                || a11y.clickByText("Gửi")
            if (!sent) return AutomationResult.error("Cannot find Send in Lark Mail")

            AutomationResult.success("📧 Lark Mail sent to $to: $subject")
        } catch (e: Exception) {
            AutomationResult.error("Lark mail compose failed: ${e.message}")
        }
    }

    // ─── Telegram ─────────────────────────────────────────────

    /**
     * Send a Telegram message to a contact/group.
     */
    suspend fun telegramSendMessage(contactName: String, message: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("org.telegram.messenger")
            delay(2000)

            // Find and tap conversation
            val found = a11y.clickByText(contactName)
            if (!found) return AutomationResult.error("Cannot find Telegram chat: $contactName")
            delay(1500)

            // Type message
            val typed = a11y.typeIntoField("Message", message)
                || a11y.typeIntoField("Tin nhắn", message)
                || a11y.typeText(message)
            if (!typed) return AutomationResult.error("Cannot type Telegram message")
            delay(300)

            // Send
            a11y.clickByText("Send") || a11y.pressEnter()

            AutomationResult.success("✈️ Telegram sent to $contactName: ${message.take(50)}...")
        } catch (e: Exception) {
            AutomationResult.error("Telegram send failed: ${e.message}")
        }
    }

    /**
     * Read Telegram chat list.
     */
    suspend fun telegramReadChats(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        return try {
            openApp("org.telegram.messenger")
            delay(2500)

            val screen = a11y.readScreen()
                ?: return AutomationResult.error("Cannot read Telegram screen")

            val chats = screen.elements
                .filter { it.text.isNotEmpty() && !it.isEditable }
                .map { it.text }
                .filter { it.length > 2 && !it.contains("Telegram") && !it.contains("Search") }
                .take(20)

            AutomationResult.success(
                "✈️ Telegram (${chats.size}):\n${chats.joinToString("\n") { "• $it" }}"
            )
        } catch (e: Exception) {
            AutomationResult.error("Telegram read failed: ${e.message}")
        }
    }

    // ─── Generic App Control ──────────────────────────────────────

    /**
     * Read what's on the current screen (any app).
     */
    fun readCurrentScreen(): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        val screen = a11y.readScreen() ?: return AutomationResult.error("Cannot read screen")

        val summary = buildString {
            appendLine("App: ${screen.packageName}")
            appendLine("Elements: ${screen.elementCount}")
            appendLine("---")
            for (element in screen.elements) {
                if (element.text.isNotEmpty()) {
                    val type = when {
                        element.isEditable -> "[INPUT]"
                        element.isClickable -> "[BUTTON]"
                        element.isScrollable -> "[SCROLL]"
                        else -> "[TEXT]"
                    }
                    appendLine("$type ${element.text}")
                }
            }
        }

        return AutomationResult.success(summary)
    }

    /**
     * Click any button/element by its text on the current screen.
     */
    fun clickElement(text: String): AutomationResult {
        if (!a11y.isRunning()) return AutomationResult.error("Accessibility service not enabled")

        val clicked = a11y.clickByText(text)
        return if (clicked) {
            AutomationResult.success("Clicked: $text")
        } else {
            AutomationResult.error("Element not found: $text")
        }
    }

    /**
     * Open an app by package name.
     */
    fun openApp(packageName: String) {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }

    /**
     * Open a URL in the default browser.
     */
    fun openUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}

// ─── Result Type ──────────────────────────────────────────────────────

data class AutomationResult(
    val success: Boolean,
    val message: String,
) {
    companion object {
        fun success(message: String) = AutomationResult(true, message)
        fun error(message: String) = AutomationResult(false, message)
    }
}
