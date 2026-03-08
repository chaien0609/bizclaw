val list = listOf("app_gemini_123", "app_gemini")
val res = list.mapNotNull { 
    if (it.startsWith("app_") && it !in listOf("app_gemini")) {
        return@mapNotNull null
    }
    it
}
println(res)
