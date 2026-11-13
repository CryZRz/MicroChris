use serde::{Deserialize, Serialize};
#[derive(Serialize)]
pub(crate) struct Entry {
    pub(crate) path: String,
    pub(crate) directory: bool,
}
#[derive(Serialize, Deserialize)]
pub(crate) struct Project {
    pub(crate) main: String,
    pub(crate) board: String,
    pub(crate) baud: u32,
}
