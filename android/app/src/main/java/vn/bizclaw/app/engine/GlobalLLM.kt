package vn.bizclaw.app.engine

/**
 * Global singleton for BizClawLLM — survives screen navigation.
 * Model stays loaded when user switches between screens.
 * Only closes when app is fully destroyed.
 */
object GlobalLLM {
    val instance: BizClawLLM = BizClawLLM()

    /** Name of the currently loaded model (null = no model loaded) */
    var loadedModelName: String? = null
        private set

    fun setModelName(name: String?) {
        loadedModelName = name
    }
}
