package vn.bizclaw.app.engine

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * ProviderChat — Gọi API thật cho từng provider
 *
 * Hỗ trợ:
 * - LOCAL_GGUF  → dùng GlobalLLM
 * - OPENAI      → gọi /v1/chat/completions
 * - GEMINI      → gọi Gemini generateContent API
 * - OLLAMA      → gọi /api/chat (Ollama format)
 * - CUSTOM_API  → gọi /v1/chat/completions (OpenAI-compatible)
 */
object ProviderChat {
    private const val TAG = "ProviderChat"
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    /**
     * Gửi tin nhắn đến 1 provider, trả về response text
     */
    suspend fun chat(
        provider: AIProvider,
        systemPrompt: String,
        userMessage: String,
    ): String {
        return when (provider.type) {
            ProviderType.LOCAL_GGUF -> chatLocal(systemPrompt, userMessage)
            ProviderType.OPENAI, ProviderType.CUSTOM_API -> chatOpenAI(provider, systemPrompt, userMessage)
            ProviderType.GEMINI -> chatGemini(provider, systemPrompt, userMessage)
            ProviderType.OLLAMA -> chatOllama(provider, systemPrompt, userMessage)
            ProviderType.BIZCLAW_CLOUD -> "⚠️ BizClaw Cloud chưa hỗ trợ"
        }
    }

    // ─── Local GGUF ─────────────────────────────────
    private suspend fun chatLocal(systemPrompt: String, userMessage: String): String {
        val llm = GlobalLLM.instance
        if (!llm.isLoaded) return "⚠️ Chưa tải mô hình cục bộ. Vào 🧠 AI Cục Bộ để tải."

        return withContext(Dispatchers.IO) {
            try {
                llm.addSystemPrompt(systemPrompt)
                val sb = StringBuilder()
                llm.getResponseAsFlow(userMessage).collect { token ->
                    sb.append(token)
                }
                sb.toString().trim()
            } catch (e: Exception) {
                "⚠️ Lỗi mô hình cục bộ: ${e.message}"
            }
        }
    }

    // ─── OpenAI / Custom API ─────────────────────────
    private suspend fun chatOpenAI(
        provider: AIProvider,
        systemPrompt: String,
        userMessage: String,
    ): String = withContext(Dispatchers.IO) {
        try {
            val url = URL("${provider.baseUrl.trimEnd('/')}/chat/completions")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Authorization", "Bearer ${provider.apiKey}")
            conn.connectTimeout = 30000
            conn.readTimeout = 60000
            conn.doOutput = true

            val body = buildJsonObject {
                put("model", provider.model)
                putJsonArray("messages") {
                    addJsonObject {
                        put("role", "system")
                        put("content", systemPrompt)
                    }
                    addJsonObject {
                        put("role", "user")
                        put("content", userMessage)
                    }
                }
                put("max_tokens", 1024)
                put("temperature", 0.7)
            }

            conn.outputStream.use { os ->
                os.write(json.encodeToString(body).toByteArray())
            }

            val code = conn.responseCode
            if (code != 200) {
                val errBody = try {
                    conn.errorStream?.bufferedReader()?.readText() ?: "No error body"
                } catch (_: Exception) { "Cannot read error" }
                Log.e(TAG, "OpenAI error $code: $errBody")
                return@withContext when (code) {
                    401 -> "❌ API key không hợp lệ. Kiểm tra lại trong Cài đặt → Nguồn AI."
                    429 -> "⚠️ Đã vượt giới hạn. Thử lại sau."
                    500, 502, 503 -> "⚠️ Server đang bận. Thử lại sau."
                    else -> "❌ Lỗi $code từ ${provider.name}"
                }
            }

            val respBody = conn.inputStream.bufferedReader().readText()
            conn.disconnect()

            val respJson = json.parseToJsonElement(respBody).jsonObject
            val content = respJson["choices"]
                ?.jsonArray?.firstOrNull()
                ?.jsonObject?.get("message")
                ?.jsonObject?.get("content")
                ?.jsonPrimitive?.content

            content?.trim() ?: "⚠️ Không nhận được phản hồi từ ${provider.name}"
        } catch (e: Exception) {
            Log.e(TAG, "OpenAI chat error", e)
            "❌ Lỗi kết nối ${provider.name}: ${e.message?.take(80)}"
        }
    }

    // ─── Google Gemini ─────────────────────────────
    private suspend fun chatGemini(
        provider: AIProvider,
        systemPrompt: String,
        userMessage: String,
    ): String = withContext(Dispatchers.IO) {
        try {
            val model = provider.model.ifBlank { "gemini-2.0-flash" }
            val url = URL(
                "${provider.baseUrl.trimEnd('/')}/v1beta/models/$model:generateContent?key=${provider.apiKey}"
            )
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = 30000
            conn.readTimeout = 60000
            conn.doOutput = true

            val body = buildJsonObject {
                putJsonObject("systemInstruction") {
                    putJsonArray("parts") {
                        addJsonObject { put("text", systemPrompt) }
                    }
                }
                putJsonArray("contents") {
                    addJsonObject {
                        put("role", "user")
                        putJsonArray("parts") {
                            addJsonObject { put("text", userMessage) }
                        }
                    }
                }
                putJsonObject("generationConfig") {
                    put("maxOutputTokens", 1024)
                    put("temperature", 0.7)
                }
            }

            conn.outputStream.use { os ->
                os.write(json.encodeToString(body).toByteArray())
            }

            val code = conn.responseCode
            if (code != 200) {
                val errBody = try {
                    conn.errorStream?.bufferedReader()?.readText() ?: ""
                } catch (_: Exception) { "" }
                Log.e(TAG, "Gemini error $code: $errBody")
                return@withContext when (code) {
                    400 -> "❌ API key Gemini không hợp lệ."
                    403 -> "❌ API key bị từ chối. Kiểm tra quyền."
                    429 -> "⚠️ Vượt giới hạn Gemini. Thử lại sau."
                    else -> "❌ Lỗi $code từ Gemini"
                }
            }

            val respBody = conn.inputStream.bufferedReader().readText()
            conn.disconnect()

            val respJson = json.parseToJsonElement(respBody).jsonObject
            val content = respJson["candidates"]
                ?.jsonArray?.firstOrNull()
                ?.jsonObject?.get("content")
                ?.jsonObject?.get("parts")
                ?.jsonArray?.firstOrNull()
                ?.jsonObject?.get("text")
                ?.jsonPrimitive?.content

            content?.trim() ?: "⚠️ Không nhận được phản hồi từ Gemini"
        } catch (e: Exception) {
            Log.e(TAG, "Gemini chat error", e)
            "❌ Lỗi kết nối Gemini: ${e.message?.take(80)}"
        }
    }

    // ─── Ollama ─────────────────────────────────
    private suspend fun chatOllama(
        provider: AIProvider,
        systemPrompt: String,
        userMessage: String,
    ): String = withContext(Dispatchers.IO) {
        try {
            val url = URL("${provider.baseUrl.trimEnd('/')}/api/chat")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = 10000
            conn.readTimeout = 120000
            conn.doOutput = true

            val body = buildJsonObject {
                put("model", provider.model.ifBlank { "qwen2.5:7b" })
                putJsonArray("messages") {
                    addJsonObject {
                        put("role", "system")
                        put("content", systemPrompt)
                    }
                    addJsonObject {
                        put("role", "user")
                        put("content", userMessage)
                    }
                }
                put("stream", false)
            }

            conn.outputStream.use { os ->
                os.write(json.encodeToString(body).toByteArray())
            }

            val code = conn.responseCode
            if (code != 200) {
                return@withContext "❌ Ollama lỗi $code. Kiểm tra: 1) 'ollama serve' đang chạy? 2) IP đúng? 3) Model đã tải?"
            }

            val respBody = conn.inputStream.bufferedReader().readText()
            conn.disconnect()

            val respJson = json.parseToJsonElement(respBody).jsonObject
            val content = respJson["message"]
                ?.jsonObject?.get("content")
                ?.jsonPrimitive?.content

            content?.trim() ?: "⚠️ Ollama không trả lời"
        } catch (e: java.net.ConnectException) {
            "❌ Không kết nối được Ollama. Kiểm tra:\n• 'ollama serve' đang chạy?\n• IP ${provider.baseUrl} đúng?\n• Cùng mạng WiFi?"
        } catch (e: Exception) {
            Log.e(TAG, "Ollama chat error", e)
            "❌ Lỗi Ollama: ${e.message?.take(80)}"
        }
    }
}
