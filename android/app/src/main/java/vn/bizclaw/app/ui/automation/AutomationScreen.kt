package vn.bizclaw.app.ui.automation

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.bizclaw.app.engine.GlobalLLM
import vn.bizclaw.app.engine.LocalAgent
import vn.bizclaw.app.engine.LocalAgentManager
import vn.bizclaw.app.service.BizClawAccessibilityService
import vn.bizclaw.app.service.BizClawNotificationListener

// ═══════════════════════════════════════════════════════════════
// Social app definitions
// ═══════════════════════════════════════════════════════════════

data class SocialApp(
    val emoji: String,
    val name: String,
    val packageName: String,
    val color: Color,
)

val SOCIAL_APPS = listOf(
    SocialApp("💬", "Zalo", "com.zing.zalo", Color(0xFF0068FF)),
    SocialApp("💙", "Messenger", "com.facebook.orca", Color(0xFF0084FF)),
    SocialApp("📘", "Facebook", "com.facebook.katana", Color(0xFF1877F2)),
    SocialApp("📸", "Instagram", "com.instagram.android", Color(0xFFE4405F)),
)

// ═══════════════════════════════════════════════════════════════
// Automation Screen
// ═══════════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AutomationScreen(
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val manager = remember { LocalAgentManager(context) }
    var agents by remember { mutableStateOf(manager.loadAgents()) }
    var showCreateFlow by remember { mutableStateOf(false) }

    // Service status
    val notifListenerConnected = BizClawNotificationListener.instance != null
    val accessibilityRunning = BizClawAccessibilityService.isRunning()
    val modelLoaded = GlobalLLM.instance.isLoaded

    // Recent notifications
    var recentNotifs by remember {
        mutableStateOf(BizClawNotificationListener.recentNotifications.toList())
    }

    // Listen for new notifications
    DisposableEffect(Unit) {
        val callback: (BizClawNotificationListener.SocialNotification) -> Unit = {
            recentNotifs = BizClawNotificationListener.recentNotifications.toList()
        }
        BizClawNotificationListener.onNotificationReceived = callback
        onDispose {
            BizClawNotificationListener.onNotificationReceived = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("⚡ Tự Động Hoá", fontWeight = FontWeight.Bold)
                        Text(
                            "Zalo • Facebook • Messenger",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại")
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // ─── Status Card ──────────────────────────────
            item {
                StatusCard(
                    modelLoaded = modelLoaded,
                    notifListener = notifListenerConnected,
                    accessibility = accessibilityRunning,
                    onEnableNotifListener = {
                        try {
                            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    },
                    onEnableAccessibility = {
                        try {
                            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    },
                )
            }

            // ─── Flow Templates ──────────────────────────────
            item {
                Text(
                    "⚡ Tạo Flow Nhanh",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
            }

            items(FLOW_TEMPLATES) { template ->
                FlowTemplateCard(
                    template = template,
                    onUse = {
                        val agent = LocalAgent(
                            id = "flow_${System.currentTimeMillis()}",
                            emoji = template.emoji,
                            name = template.name,
                            role = template.description,
                            systemPrompt = template.systemPrompt,
                            triggerApps = template.targetApps,
                            autoReply = true,
                        )
                        manager.addAgent(agent)
                        agents = manager.loadAgents()
                    },
                )
            }

            // ─── Active Automation Agents ──────────────────────────
            val autoAgents = agents.filter { it.autoReply }
            if (autoAgents.isNotEmpty()) {
                item {
                    Text(
                        "🤖 Agent Đang Hoạt Động (${autoAgents.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                }

                items(autoAgents) { agent ->
                    ActiveAgentCard(
                        agent = agent,
                        onToggle = { enabled ->
                            manager.updateAgent(agent.copy(autoReply = enabled))
                            agents = manager.loadAgents()
                        },
                        onDelete = {
                            manager.deleteAgent(agent.id)
                            agents = manager.loadAgents()
                        },
                    )
                }
            }

            // ─── Recent Notifications ──────────────────────────
            if (recentNotifs.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "📩 Tin nhắn gần đây (${recentNotifs.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                        TextButton(onClick = {
                            BizClawNotificationListener.recentNotifications.clear()
                            recentNotifs = emptyList()
                        }) {
                            Text("Xoá hết")
                        }
                    }
                }

                items(recentNotifs.take(20)) { notif ->
                    NotificationCard(notif)
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Status Card
// ═══════════════════════════════════════════════════════════════

@Composable
private fun StatusCard(
    modelLoaded: Boolean,
    notifListener: Boolean,
    accessibility: Boolean,
    onEnableNotifListener: () -> Unit,
    onEnableAccessibility: () -> Unit,
) {
    val allReady = modelLoaded && notifListener && accessibility

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (allReady)
                Color(0xFF1B5E20).copy(alpha = 0.15f)
            else
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                if (allReady) "✅ Sẵn sàng tự động hoá" else "⚠️ Cần bật thêm quyền",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))

            StatusRow("🧠 Mô hình AI", modelLoaded, "Vào 🧠 AI Cục Bộ để tải")
            StatusRow("🔔 Đọc thông báo", notifListener, "Bấm để bật", onEnableNotifListener)
            StatusRow("♿ Điều khiển apps", accessibility, "Bấm để bật", onEnableAccessibility)
        }
    }
}

@Composable
private fun StatusRow(
    label: String,
    enabled: Boolean,
    hint: String = "",
    onEnable: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            if (enabled) "✅" else "❌",
            fontSize = 14.sp,
        )
        Spacer(Modifier.width(8.dp))
        Text(
            label,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f),
        )
        if (!enabled && onEnable != null) {
            TextButton(
                onClick = onEnable,
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
            ) {
                Text(
                    hint,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Flow Templates
// ═══════════════════════════════════════════════════════════════

data class FlowTemplate(
    val emoji: String,
    val name: String,
    val description: String,
    val targetApps: List<String>,
    val systemPrompt: String,
)

val FLOW_TEMPLATES = listOf(
    FlowTemplate(
        emoji = "💬",
        name = "Trả lời Zalo CSKH",
        description = "Tự động trả lời tin nhắn Zalo bằng AI, dựa trên kho kiến thức",
        targetApps = listOf("com.zing.zalo"),
        systemPrompt = "Bạn là nhân viên chăm sóc khách hàng chuyên nghiệp. " +
            "CHỈ trả lời bằng tiếng Việt. " +
            "Lịch sự, tận tâm, giải quyết vấn đề nhanh. " +
            "Nếu không biết, nói: 'Em sẽ chuyển yêu cầu cho bộ phận phụ trách ạ.'",
    ),
    FlowTemplate(
        emoji = "💙",
        name = "Trả lời Messenger",
        description = "Tự động trả lời tin nhắn Facebook Messenger",
        targetApps = listOf("com.facebook.orca"),
        systemPrompt = "Bạn là trợ lý bán hàng trên Facebook. " +
            "CHỈ trả lời bằng tiếng Việt. " +
            "Tư vấn sản phẩm, báo giá, hướng dẫn mua hàng. " +
            "Khi có đơn, hỏi: tên, SĐT, địa chỉ giao hàng.",
    ),
    FlowTemplate(
        emoji = "📘",
        name = "Trả lời comment FB",
        description = "Tự động trả lời bình luận trên Facebook",
        targetApps = listOf("com.facebook.katana"),
        systemPrompt = "Bạn quản lý fanpage Facebook. " +
            "CHỈ trả lời bằng tiếng Việt. " +
            "Trả lời comment ngắn gọn, thân thiện. " +
            "Hướng khách inbox để tư vấn chi tiết.",
    ),
    FlowTemplate(
        emoji = "📸",
        name = "Trả lời DM Instagram",
        description = "Tự động trả lời tin nhắn Instagram",
        targetApps = listOf("com.instagram.android"),
        systemPrompt = "Bạn quản lý tài khoản Instagram shop. " +
            "CHỈ trả lời bằng tiếng Việt. " +
            "Giới thiệu sản phẩm, báo giá, link đặt hàng. " +
            "Phong cách trẻ trung, gần gũi.",
    ),
    FlowTemplate(
        emoji = "🔥",
        name = "Đa kênh (Zalo + FB + Mess)",
        description = "Trả lời tự động trên tất cả các kênh",
        targetApps = listOf("com.zing.zalo", "com.facebook.orca", "com.facebook.katana"),
        systemPrompt = "Bạn là trợ lý kinh doanh đa kênh. " +
            "CHỈ trả lời bằng tiếng Việt. " +
            "Trả lời tin nhắn từ Zalo, Facebook, Messenger. " +
            "Tư vấn sản phẩm, giải đáp thắc mắc, hỗ trợ đặt hàng. " +
            "Chuyên nghiệp nhưng thân thiện.",
    ),
)

@Composable
private fun FlowTemplateCard(
    template: FlowTemplate,
    onUse: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(48.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(template.emoji, fontSize = 24.sp)
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    template.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    template.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                )
                // App badges
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    template.targetApps.forEach { pkg ->
                        val app = SOCIAL_APPS.find { it.packageName == pkg }
                        if (app != null) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = app.color.copy(alpha = 0.15f),
                            ) {
                                Text(
                                    "${app.emoji} ${app.name}",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = app.color,
                                )
                            }
                        }
                    }
                }
            }

            Button(
                onClick = onUse,
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text("Dùng", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Active Agent Card
// ═══════════════════════════════════════════════════════════════

@Composable
private fun ActiveAgentCard(
    agent: LocalAgent,
    onToggle: (Boolean) -> Unit,
    onDelete: () -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (agent.autoReply)
                Color(0xFF1B5E20).copy(alpha = 0.1f)
            else
                MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(agent.emoji, fontSize = 24.sp)
            Spacer(Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(agent.name, fontWeight = FontWeight.SemiBold)
                Text(
                    agent.role,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                // Show target apps
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    agent.triggerApps.forEach { pkg ->
                        val app = SOCIAL_APPS.find { it.packageName == pkg }
                        if (app != null) {
                            Text(
                                app.emoji,
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                    }
                }
            }
            Switch(
                checked = agent.autoReply,
                onCheckedChange = onToggle,
            )
            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    "Xoá",
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Notification Card
// ═══════════════════════════════════════════════════════════════

@Composable
private fun NotificationCard(notif: BizClawNotificationListener.SocialNotification) {
    val app = SOCIAL_APPS.find { it.packageName == notif.packageName }

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (notif.replied)
                Color(0xFF1B5E20).copy(alpha = 0.08f)
            else
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(app?.emoji ?: "📱", fontSize = 16.sp)
                Spacer(Modifier.width(6.dp))
                Text(
                    "${notif.app} • ${notif.sender}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                )
                if (notif.replied) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFF00E676).copy(alpha = 0.2f),
                    ) {
                        Text(
                            "✅ Đã trả lời",
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF00E676),
                        )
                    }
                }
            }
            Text(
                notif.message,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (notif.replied && notif.replyContent.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                ) {
                    Text(
                        "🤖 ${notif.replyContent}",
                        modifier = Modifier.padding(8.dp),
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}
