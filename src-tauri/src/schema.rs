use chrono::{DateTime, Utc};
#[derive(serde::Serialize, serde::Deserialize)]
pub struct MemoryItem {
    pub memory_id: String,
    pub created_at: DateTime<Utc>,
    pub active_node_id: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MemoryType {
    Diary,
    Fact,
    Event,
    Schedule,
    Generic
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MemoryNode {
    pub node_id: String,
    pub memory_id: String,
    pub parent_node_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub content: serde_json::Value,
    pub title: String,
    pub memory_type: MemoryType,
    pub change_reason: Option<String>,
}
