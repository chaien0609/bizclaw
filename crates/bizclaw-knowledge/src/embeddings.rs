//! Embedding client — generate vector embeddings via Ollama or OpenAI-compatible APIs.
//!
//! Uses Ollama `/api/embed` by default (free, local).
//! Falls back to OpenAI `/v1/embeddings` if configured.

use serde::{Deserialize, Serialize};

/// Embedding provider configuration.
#[derive(Debug, Clone)]
pub struct EmbeddingConfig {
    /// Provider: "ollama", "openai", or "none".
    pub provider: String,
    /// Endpoint URL.
    pub endpoint: String,
    /// Model name for embeddings.
    pub model: String,
    /// API key (for OpenAI-compatible).
    pub api_key: String,
}

impl Default for EmbeddingConfig {
    fn default() -> Self {
        Self {
            provider: "ollama".into(),
            endpoint: "http://localhost:11434".into(),
            model: "nomic-embed-text".into(),
            api_key: String::new(),
        }
    }
}

/// Embedding client that generates vector representations of text.
pub struct EmbeddingClient {
    config: EmbeddingConfig,
    client: reqwest::Client,
    /// Dimension of the embedding vectors (set after first call).
    pub dimension: usize,
}

#[derive(Serialize)]
struct OllamaEmbedRequest {
    model: String,
    input: Vec<String>,
}

#[derive(Deserialize)]
struct OllamaEmbedResponse {
    embeddings: Vec<Vec<f32>>,
}

#[derive(Serialize)]
struct OpenAiEmbedRequest {
    model: String,
    input: Vec<String>,
}

#[derive(Deserialize)]
struct OpenAiEmbedResponse {
    data: Vec<OpenAiEmbedData>,
}

#[derive(Deserialize)]
struct OpenAiEmbedData {
    embedding: Vec<f32>,
}

impl EmbeddingClient {
    /// Create a new embedding client.
    pub fn new(config: EmbeddingConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
            dimension: 0,
        }
    }

    /// Check if embeddings are available (provider != "none").
    pub fn is_available(&self) -> bool {
        self.config.provider != "none" && !self.config.endpoint.is_empty()
    }

    /// Generate embedding for a single text.
    pub async fn embed_one(&mut self, text: &str) -> Result<Vec<f32>, String> {
        let results = self.embed_batch(&[text.to_string()]).await?;
        results
            .into_iter()
            .next()
            .ok_or_else(|| "Empty embedding response".into())
    }

    /// Generate embeddings for a batch of texts.
    pub async fn embed_batch(&mut self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        if texts.is_empty() {
            return Ok(vec![]);
        }

        match self.config.provider.as_str() {
            "ollama" => self.embed_ollama(texts).await,
            "openai" | "gemini" | "deepseek" => self.embed_openai_compat(texts).await,
            _ => Err(format!(
                "Unknown embedding provider: {}",
                self.config.provider
            )),
        }
    }

    /// Ollama `/api/embed` endpoint.
    async fn embed_ollama(&mut self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let url = format!("{}/api/embed", self.config.endpoint.trim_end_matches('/'));
        let body = OllamaEmbedRequest {
            model: self.config.model.clone(),
            input: texts.to_vec(),
        };

        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Ollama embed request failed: {e}"))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Ollama embed error {status}: {body}"));
        }

        let result: OllamaEmbedResponse = resp
            .json()
            .await
            .map_err(|e| format!("Ollama embed parse error: {e}"))?;

        if let Some(first) = result.embeddings.first() {
            self.dimension = first.len();
        }

        Ok(result.embeddings)
    }

    /// OpenAI-compatible `/v1/embeddings` endpoint.
    async fn embed_openai_compat(&mut self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let url = format!(
            "{}/v1/embeddings",
            self.config.endpoint.trim_end_matches('/')
        );
        let body = OpenAiEmbedRequest {
            model: self.config.model.clone(),
            input: texts.to_vec(),
        };

        let mut req = self.client.post(&url).json(&body);
        if !self.config.api_key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", self.config.api_key));
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Embedding request failed: {e}"))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Embedding error {status}: {body}"));
        }

        let result: OpenAiEmbedResponse = resp
            .json()
            .await
            .map_err(|e| format!("Embedding parse error: {e}"))?;

        let embeddings: Vec<Vec<f32>> = result.data.into_iter().map(|d| d.embedding).collect();

        if let Some(first) = embeddings.first() {
            self.dimension = first.len();
        }

        Ok(embeddings)
    }
}

/// Compute cosine similarity between two vectors.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let mut dot = 0.0f32;
    let mut norm_a = 0.0f32;
    let mut norm_b = 0.0f32;

    for i in 0..a.len() {
        dot += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }

    let denom = norm_a.sqrt() * norm_b.sqrt();
    if denom == 0.0 { 0.0 } else { dot / denom }
}

/// Serialize a vector to bytes for SQLite BLOB storage.
pub fn vector_to_bytes(vec: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(vec.len() * 4);
    for &v in vec {
        bytes.extend_from_slice(&v.to_le_bytes());
    }
    bytes
}

/// Deserialize a vector from SQLite BLOB bytes.
pub fn bytes_to_vector(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        assert!(cosine_similarity(&a, &b).abs() < 0.001);
    }

    #[test]
    fn test_cosine_similarity_opposite() {
        let a = vec![1.0, 0.0];
        let b = vec![-1.0, 0.0];
        assert!((cosine_similarity(&a, &b) + 1.0).abs() < 0.001);
    }

    #[test]
    fn test_vector_serialization_roundtrip() {
        let original = vec![0.1, 0.2, 0.3, -0.5, 1.0];
        let bytes = vector_to_bytes(&original);
        let restored = bytes_to_vector(&bytes);
        assert_eq!(original.len(), restored.len());
        for (a, b) in original.iter().zip(restored.iter()) {
            assert!((a - b).abs() < 1e-7);
        }
    }

    #[test]
    fn test_default_config() {
        let config = EmbeddingConfig::default();
        assert_eq!(config.provider, "ollama");
        assert_eq!(config.model, "nomic-embed-text");
    }
}
