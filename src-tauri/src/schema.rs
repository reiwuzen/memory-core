use chrono::{DateTime, Utc};
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct MemoryItem {
    pub memory_id: String,
    pub created_at: DateTime<Utc>,
    pub active_node_id: String,
}

#[derive(serde::Serialize, serde::Deserialize,Clone,Debug)]
pub enum MemoryType {
    Diary,
    Fact,
    Event,
    Schedule,
    Generic
}

#[derive(serde::Serialize, serde::Deserialize, Clone ,Debug)]
pub struct MemoryNode {
    pub node_id: String,
    pub memory_id: String,
    pub parent_node_id: Option<String>,
    pub created_at: DateTime<Utc>,
    // pub content_string: String,
    pub content_json: serde_json::Value,
    pub title: String,
    pub memory_type: MemoryType,
    pub change_reason: Option<String>,
    pub tags: Vec<Tag>
}


#[derive(serde::Serialize, serde::Deserialize,Clone, Debug)]
pub struct Tag {
    pub id: String,
    pub label: String,
    pub description:String,
    pub priority: f32,
}

#[derive(serde::Serialize)]
pub struct MemoryPayload {
    pub memory_item: MemoryItem,
    pub active_node: MemoryNode,
    pub nodes: Vec<MemoryNode>,
}