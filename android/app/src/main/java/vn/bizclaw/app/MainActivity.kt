package vn.bizclaw.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import vn.bizclaw.app.ui.agents.AgentsScreen
import vn.bizclaw.app.ui.agents.KnowledgeBaseScreen
import vn.bizclaw.app.ui.chat.ChatScreen
import vn.bizclaw.app.ui.chat.ChatViewModel
import vn.bizclaw.app.ui.dashboard.DashboardScreen
import vn.bizclaw.app.engine.GlobalLLM
import vn.bizclaw.app.engine.LocalAgent
import vn.bizclaw.app.ui.localllm.LocalLLMScreen
import vn.bizclaw.app.ui.settings.SettingsScreen
import vn.bizclaw.app.ui.theme.BizClawTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            BizClawTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    BizClawNavHost()
                }
            }
        }
    }
}

enum class Screen {
    Chat, Agents, Settings, Dashboard, LocalLLM, KnowledgeBase
}

@Composable
fun BizClawNavHost() {
    val context = LocalContext.current
    val chatViewModel: ChatViewModel = viewModel()
    var currentScreen by remember { mutableStateOf(Screen.Chat) }

    // Server config
    var serverUrl by remember { mutableStateOf("http://127.0.0.1:3001") }
    var apiKey by remember { mutableStateOf("") }

    // Initialize — check local models first, only check server if no local model
    LaunchedEffect(Unit) {
        chatViewModel.refreshLocalModels(context)
        // Only check server if local model not available
        if (!GlobalLLM.instance.isLoaded) {
            chatViewModel.updateServer(serverUrl, apiKey)
        } else {
            // Sync GlobalLLM state to chat view model
            chatViewModel.checkConnection()
        }
    }

    when (currentScreen) {
        Screen.Chat -> {
            ChatScreen(
                viewModel = chatViewModel,
                onOpenAgents = { currentScreen = Screen.Agents },
                onOpenSettings = { currentScreen = Screen.Settings },
                onOpenDashboard = { currentScreen = Screen.Dashboard },
                onOpenLocalLLM = { currentScreen = Screen.LocalLLM },
            )
        }

        Screen.Agents -> {
            AgentsScreen(
                onSelectAgent = { agent ->
                    // When user selects an agent, go to LocalLLM chat with that prompt
                    if (GlobalLLM.instance.isLoaded) {
                        GlobalLLM.instance.addSystemPrompt(agent.systemPrompt)
                    }
                    currentScreen = Screen.LocalLLM
                },
                onOpenKB = { currentScreen = Screen.KnowledgeBase },
                onBack = { currentScreen = Screen.Chat },
            )
        }

        Screen.Settings -> {
            SettingsScreen(
                serverUrl = serverUrl,
                apiKey = apiKey,
                isConnected = chatViewModel.isConnected.value,
                onUpdateServer = { url, key ->
                    serverUrl = url
                    apiKey = key
                    chatViewModel.updateServer(url, key)
                },
                onBack = { currentScreen = Screen.Chat },
            )
        }

        Screen.Dashboard -> {
            DashboardScreen(
                onBack = { currentScreen = Screen.Chat },
            )
        }

        Screen.LocalLLM -> {
            LocalLLMScreen(
                onBack = {
                    // Refresh local models when returning
                    chatViewModel.refreshLocalModels(context)
                    currentScreen = Screen.Chat
                },
            )
        }

        Screen.KnowledgeBase -> {
            KnowledgeBaseScreen(
                onBack = { currentScreen = Screen.Agents },
            )
        }
    }
}
