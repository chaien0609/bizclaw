//! Vector store — SQLite-based vector storage for semantic search.
//!
//! Stores embedding vectors as BLOBs in a separate `chunk_embeddings` table.
//! Uses brute-force cosine similarity (fast enough for <100K chunks on Pi).
//!
//! ## Design
//! - No external vector DB (Pinecone/Qdrant/Chroma) needed
//! - Works on 512MB RAM devices
//! - Hybrid search: BM25 keyword (0.3) + vector similarity (0.7)

use rusqlite::{Connection, params};

use crate::embeddings::{bytes_to_vector, cosine_similarity, vector_to_bytes};
use crate::search::SearchResult;

/// Create the chunk_embeddings table if it doesn't exist.
/// FTS5 virtual tables cannot be altered, so we use a separate table.
pub fn ensure_vector_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS chunk_embeddings (
            doc_id TEXT NOT NULL,
            chunk_idx TEXT NOT NULL,
            embedding BLOB NOT NULL,
            PRIMARY KEY (doc_id, chunk_idx)
        );",
    )
    .map_err(|e| format!("Failed to create chunk_embeddings table: {e}"))?;

    tracing::debug!("📐 Vector embeddings table ready");
    Ok(())
}

/// Store an embedding vector for a specific chunk.
pub fn store_embedding(
    conn: &Connection,
    doc_id: &str,
    chunk_idx: &str,
    embedding: &[f32],
) -> Result<(), String> {
    let bytes = vector_to_bytes(embedding);
    conn.execute(
        "INSERT OR REPLACE INTO chunk_embeddings (doc_id, chunk_idx, embedding) VALUES (?1, ?2, ?3)",
        params![doc_id, chunk_idx, bytes],
    )
    .map_err(|e| format!("Store embedding error: {e}"))?;
    Ok(())
}

/// Count chunks that have embeddings.
pub fn embedded_chunk_count(conn: &Connection) -> usize {
    conn.query_row("SELECT COUNT(*) FROM chunk_embeddings", [], |row| {
        row.get::<_, i64>(0)
    })
    .unwrap_or(0) as usize
}

/// Vector-only search: find most similar chunks to query embedding.
pub fn vector_search(
    conn: &Connection,
    query_embedding: &[f32],
    limit: usize,
) -> Vec<SearchResult> {
    let mut stmt = match conn.prepare(
        "SELECT c.doc_id, c.chunk_idx, c.content, d.name, ce.embedding
         FROM chunks c
         JOIN documents d ON d.id = CAST(c.doc_id AS INTEGER)
         JOIN chunk_embeddings ce ON ce.doc_id = c.doc_id AND ce.chunk_idx = c.chunk_idx",
    ) {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!("Vector search prepare error: {e}");
            return Vec::new();
        }
    };

    let mut scored: Vec<(f32, SearchResult)> = Vec::new();

    let rows = stmt.query_map([], |row| {
        let doc_name: String = row.get(3)?;
        let chunk_idx_str: String = row.get(1)?;
        let content: String = row.get(2)?;
        let embedding_bytes: Vec<u8> = row.get(4)?;
        Ok((doc_name, chunk_idx_str, content, embedding_bytes))
    });

    if let Ok(rows) = rows {
        for row in rows.flatten() {
            let (doc_name, chunk_idx_str, content, embedding_bytes) = row;
            let chunk_embedding = bytes_to_vector(&embedding_bytes);

            if chunk_embedding.is_empty() {
                continue;
            }

            let similarity = cosine_similarity(query_embedding, &chunk_embedding);

            scored.push((
                similarity,
                SearchResult {
                    doc_name,
                    chunk_idx: chunk_idx_str.parse().unwrap_or(0),
                    content,
                    score: similarity as f64,
                },
            ));
        }
    }

    // Sort by similarity descending (highest first)
    scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(limit);
    scored.into_iter().map(|(_, r)| r).collect()
}

/// Hybrid search: combines FTS5 BM25 + vector cosine similarity.
///
/// Score = keyword_weight * bm25_normalized + vector_weight * cosine_similarity
pub fn hybrid_search(
    conn: &Connection,
    query: &str,
    query_embedding: Option<&[f32]>,
    limit: usize,
    keyword_weight: f32,
    vector_weight: f32,
) -> Vec<SearchResult> {
    let limit = limit.min(10);

    // Get keyword results (BM25)
    let keyword_results = fts5_search(conn, query, limit * 2);

    // If no embeddings available, just return keyword results
    let query_emb = match query_embedding {
        Some(e) if !e.is_empty() => e,
        _ => {
            return keyword_results.into_iter().take(limit).collect();
        }
    };

    // Get vector results
    let vector_results = vector_search(conn, query_emb, limit * 2);

    // Merge and re-rank
    let mut combined: std::collections::HashMap<String, (f32, SearchResult)> =
        std::collections::HashMap::new();

    // Normalize BM25 scores (BM25 is negative in SQLite, lower = better)
    let max_bm25 = keyword_results
        .iter()
        .map(|r| r.score.abs())
        .fold(f64::MIN, f64::max);
    let max_bm25 = if max_bm25 == 0.0 { 1.0 } else { max_bm25 };

    for r in &keyword_results {
        let key = format!("{}:{}", r.doc_name, r.chunk_idx);
        let normalized_bm25 = (r.score.abs() / max_bm25) as f32; // 0..1, higher = more relevant
        let score = keyword_weight * normalized_bm25;
        combined.insert(
            key,
            (
                score,
                SearchResult {
                    doc_name: r.doc_name.clone(),
                    chunk_idx: r.chunk_idx,
                    content: r.content.clone(),
                    score: score as f64,
                },
            ),
        );
    }

    for r in &vector_results {
        let key = format!("{}:{}", r.doc_name, r.chunk_idx);
        let vector_score = vector_weight * r.score as f32; // cosine similarity is already 0..1
        let entry = combined.entry(key).or_insert((
            0.0,
            SearchResult {
                doc_name: r.doc_name.clone(),
                chunk_idx: r.chunk_idx,
                content: r.content.clone(),
                score: 0.0,
            },
        ));
        entry.0 += vector_score;
        entry.1.score = entry.0 as f64;
    }

    let mut results: Vec<SearchResult> = combined.into_values().map(|(_, r)| r).collect();
    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit);
    results
}

/// Internal FTS5 search (same as KnowledgeStore::search but standalone).
fn fts5_search(conn: &Connection, query: &str, limit: usize) -> Vec<SearchResult> {
    let clean_query: String = query
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect();

    if clean_query.trim().is_empty() {
        return Vec::new();
    }

    let mut stmt = match conn.prepare(
        "SELECT c.doc_id, c.chunk_idx, c.content, d.name, bm25(chunks) as score
         FROM chunks c
         JOIN documents d ON d.id = CAST(c.doc_id AS INTEGER)
         WHERE chunks MATCH ?1
         ORDER BY score
         LIMIT ?2",
    ) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    stmt.query_map(params![clean_query, limit as i64], |row| {
        Ok(SearchResult {
            doc_name: row.get(3)?,
            chunk_idx: row.get::<_, String>(1)?.parse().unwrap_or(0),
            content: row.get(2)?,
            score: row.get(4)?,
        })
    })
    .map(|rows| rows.filter_map(|r| r.ok()).collect())
    .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                source TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now')),
                chunk_count INTEGER DEFAULT 0
            );
            CREATE VIRTUAL TABLE chunks USING fts5(
                doc_id, chunk_idx, content, tokenize='unicode61'
            );
            ",
        )
        .unwrap();
        ensure_vector_schema(&conn).unwrap();
        conn
    }

    #[test]
    fn test_vector_schema() {
        let conn = setup_test_db();
        // Should not error on second call
        ensure_vector_schema(&conn).unwrap();
    }

    #[test]
    fn test_store_and_search_embedding() {
        let conn = setup_test_db();

        // Insert a document + chunk
        conn.execute(
            "INSERT INTO documents (name, source, chunk_count) VALUES ('test.md', '', 1)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO chunks (doc_id, chunk_idx, content) VALUES ('1', '0', 'Rust is a systems programming language')",
            [],
        )
        .unwrap();

        // Store embedding
        let embedding = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        store_embedding(&conn, "1", "0", &embedding).unwrap();

        assert_eq!(embedded_chunk_count(&conn), 1);

        // Search with similar vector
        let query = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let results = vector_search(&conn, &query, 5);
        assert_eq!(results.len(), 1);
        assert!(results[0].score > 0.99); // Nearly identical vectors
    }

    #[test]
    fn test_hybrid_search_keyword_only() {
        let conn = setup_test_db();

        conn.execute(
            "INSERT INTO documents (name, source, chunk_count) VALUES ('doc.md', '', 1)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO chunks (doc_id, chunk_idx, content) VALUES ('1', '0', 'BizClaw is an AI agent platform')",
            [],
        )
        .unwrap();

        // Search without embeddings — should fall back to keyword
        let results = hybrid_search(&conn, "BizClaw AI", None, 5, 0.3, 0.7);
        assert_eq!(results.len(), 1);
        assert!(results[0].content.contains("BizClaw"));
    }
}
