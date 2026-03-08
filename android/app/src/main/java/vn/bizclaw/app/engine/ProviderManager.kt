package vn.bizclaw.app.engine

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Multi-Provider Manager — cho phép thêm nhiều nguồn AI
 *
 * Mỗi provider có thể là:
 * - Local GGUF (BizClawLLM)
 * - OpenAI API
 * - Gemini API
 * - Ollama (local server)
 * - BizClaw Cloud
 * - Custom API
 *
 * Mỗi agent chọn 1 provider để trả lời.
 */

@Serializable
data class AIProvider(
    val id: String,
    val name: String,
    val type: ProviderType,
    val emoji: String = "🤖",
    val apiKey: String = "",
    val baseUrl: String = "",
    val model: String = "",
    val enabled: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
)

@Serializable
enum class ProviderType {
    LOCAL_GGUF,      // On-device via BizClawLLM
    OPENAI,          // OpenAI API (GPT-4, etc.)
    GEMINI,          // Google Gemini
    OLLAMA,          // Local Ollama server
    BIZCLAW_CLOUD,   // BizClaw backend
    CUSTOM_API,      // Any OpenAI-compatible API
}

/**
 * Agent Group — nhóm agent cùng làm việc
 *
 * Ví dụ: Nhóm "CSKH" gồm:
 * - Agent phân loại (phân loại câu hỏi)
 * - Agent bán hàng (tư vấn sản phẩm)
 * - Agent kỹ thuật (hỗ trợ kỹ thuật)
 *
 * Khi có tin nhắn → agent phân loại chạy trước → chuyển cho agent phù hợp
 */
@Serializable
data class AgentGroup(
    val id: String,
    val name: String,
    val emoji: String = "👥",
    val description: String = "",
    val agentIds: List<String> = emptyList(), // Agent IDs in this group
    val routerAgentId: String? = null, // Agent that routes to others (optional)
    val createdAt: Long = System.currentTimeMillis(),
)

class ProviderManager(context: Context) {

    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }
    private val providersFile = File(context.filesDir, "ai_providers.json")
    private val groupsFile = File(context.filesDir, "agent_groups.json")

    // ─── Providers ─────────────────────────────────────

    fun loadProviders(): List<AIProvider> {
        if (!providersFile.exists()) return defaultProviders()
        return try {
            json.decodeFromString<List<AIProvider>>(providersFile.readText())
        } catch (e: Exception) {
            defaultProviders()
        }
    }

    fun saveProviders(providers: List<AIProvider>) {
        providersFile.writeText(json.encodeToString(providers))
    }

    fun addProvider(provider: AIProvider) {
        val list = loadProviders().toMutableList()
        list.add(provider)
        saveProviders(list)
    }

    fun updateProvider(provider: AIProvider) {
        val list = loadProviders().toMutableList()
        val idx = list.indexOfFirst { it.id == provider.id }
        if (idx >= 0) {
            list[idx] = provider
            saveProviders(list)
        }
    }

    fun deleteProvider(id: String) {
        val list = loadProviders().toMutableList()
        list.removeAll { it.id == id }
        saveProviders(list)
    }

    // ─── Groups ─────────────────────────────────────

    fun loadGroups(): List<AgentGroup> {
        if (!groupsFile.exists()) return emptyList()
        return try {
            json.decodeFromString<List<AgentGroup>>(groupsFile.readText())
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveGroups(groups: List<AgentGroup>) {
        groupsFile.writeText(json.encodeToString(groups))
    }

    fun addGroup(group: AgentGroup) {
        val list = loadGroups().toMutableList()
        list.add(group)
        saveGroups(list)
    }

    fun updateGroup(group: AgentGroup) {
        val list = loadGroups().toMutableList()
        val idx = list.indexOfFirst { it.id == group.id }
        if (idx >= 0) {
            list[idx] = group
            saveGroups(list)
        }
    }

    fun deleteGroup(id: String) {
        val list = loadGroups().toMutableList()
        list.removeAll { it.id == id }
        saveGroups(list)
    }

    // ─── Default Providers ─────────────────────────────

    private fun defaultProviders(): List<AIProvider> {
        val defaults = listOf(
            AIProvider(
                id = "local_gguf",
                name = "AI Cục Bộ (GGUF)",
                type = ProviderType.LOCAL_GGUF,
                emoji = "🧠",
                model = "auto",
            ),
            AIProvider(
                id = "openai",
                name = "OpenAI",
                type = ProviderType.OPENAI,
                emoji = "🌐",
                baseUrl = "https://api.openai.com/v1",
                model = "gpt-4o-mini",
                enabled = false, // Cần thêm API key
            ),
            AIProvider(
                id = "gemini",
                name = "Google Gemini",
                type = ProviderType.GEMINI,
                emoji = "✨",
                baseUrl = "https://generativelanguage.googleapis.com",
                model = "gemini-2.0-flash",
                enabled = false,
            ),
            AIProvider(
                id = "ollama",
                name = "Ollama (Máy tính)",
                type = ProviderType.OLLAMA,
                emoji = "🦙",
                baseUrl = "http://192.168.1.100:11434",
                model = "qwen2.5:7b",
                enabled = false,
            ),
        )
        saveProviders(defaults)
        return defaults
    }
}
