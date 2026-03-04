use chrono::{DateTime, Utc};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PageMeta {
    pub id: String,
    #[serde(rename = "type")]
    pub page_type: PageType,
    pub head_snapshot_id: Option<String>,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub tags: Vec<String>,
    pub book_id: Option<String>,
    pub parent_page_id: Option<String>,
    pub last_opened_at: DateTime<Utc>,
    pub last_updated_at: DateTime<Utc>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum PageType {
    Diary,
    Fact,
    Event,
    Schedule,
    Generic,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub id: String,
    pub page_id: String,
    pub parent_snapshot_id: Option<String>,
    pub content_json: String,
    pub created_at: String,
    pub comment: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Book {
    pub id: String,
    pub title: String,
    pub created_at: String,
    #[serde(rename = "type")]
    pub book_type: PageType,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VersionedPage {
    pub page_meta: PageMeta,
    pub snapshots: Vec<Snapshot>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct Tag {
    pub id: String,
    pub label: String,
    pub description: String,
    pub priority: f32,
}
