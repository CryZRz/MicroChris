use crate::{models::Entry, state::Backend};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::Ordering,
};
use tauri::State;
pub(crate) fn safe(s: &Backend, p: &str) -> Result<PathBuf, String> {
    let root = s.root.lock().unwrap().clone().ok_or("Abre un proyecto")?;
    let target = root.join(p);
    let check = if target.exists() {
        target.canonicalize()
    } else {
        target.parent().ok_or("Ruta inválida")?.canonicalize()
    }
    .map_err(|e| e.to_string())?;
    if !check.starts_with(&root) {
        return Err("Ruta fuera del proyecto".into());
    }
    Ok(target)
}
fn tree(root: &Path, base: &Path, out: &mut Vec<Entry>) -> Result<(), String> {
    for item in fs::read_dir(base).map_err(|e| e.to_string())? {
        let p = item.map_err(|e| e.to_string())?.path();
        if p.is_symlink() {
            continue;
        }
        let n = p.file_name().unwrap().to_string_lossy();
        if n.starts_with('.') || n == "build" || n == "node_modules" {
            continue;
        }
        out.push(Entry {
            path: p
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/"),
            directory: p.is_dir(),
        });
        if p.is_dir() {
            tree(root, &p, out)?
        }
    }
    Ok(())
}
#[tauri::command]
pub(crate) fn open_project(s: State<Backend>, path: String) -> Result<Vec<Entry>, String> {
    if s.busy.load(Ordering::SeqCst) {
        return Err("Operación en curso".into());
    }
    let root = PathBuf::from(path)
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let mut entries = vec![];
    tree(&root, &root, &mut entries)?;
    entries.sort_by(|a, b| a.path.cmp(&b.path));
    *s.root.lock().unwrap() = Some(root);
    Ok(entries)
}
#[tauri::command]
pub(crate) fn create_project(s: State<Backend>, path: String) -> Result<Vec<Entry>, String> {
    if s.busy.load(Ordering::SeqCst) {
        return Err("Operación en curso".into());
    }
    fs::create_dir(&path).map_err(|e| e.to_string())?;
    open_project(s, path)
}
#[tauri::command]
pub(crate) fn read_file(s: State<Backend>, path: String) -> Result<String, String> {
    fs::read_to_string(safe(&s, &path)?).map_err(|e| e.to_string())
}
#[tauri::command]
pub(crate) fn write_file(s: State<Backend>, path: String, text: String) -> Result<(), String> {
    fs::write(safe(&s, &path)?, text).map_err(|e| e.to_string())
}
#[tauri::command]
pub(crate) fn rename_file(
    s: State<Backend>,
    path: String,
    destination: String,
) -> Result<(), String> {
    fs::rename(safe(&s, &path)?, safe(&s, &destination)?).map_err(|e| e.to_string())
}
#[tauri::command]
pub(crate) fn delete_file(s: State<Backend>, path: String) -> Result<(), String> {
    let p = safe(&s, &path)?;
    if p.is_dir() {
        return Err("Solo se eliminan archivos".into());
    }
    fs::remove_file(p).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicU64;

    static NEXT_PROJECT: AtomicU64 = AtomicU64::new(0);
    struct ProjectDirectory(PathBuf);
    impl Drop for ProjectDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn project() -> (ProjectDirectory, Backend) {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let sequence = NEXT_PROJECT.fetch_add(1, Ordering::Relaxed);
        let root = std::env::temp_dir().join(format!(
            "microchris-project-{}-{unique}-{sequence}",
            std::process::id()
        ));
        fs::create_dir(&root).unwrap();
        let backend = Backend::default();
        *backend.root.lock().unwrap() = Some(root.canonicalize().unwrap());
        (ProjectDirectory(root), backend)
    }
    #[test]
    fn paths_stay_within_the_open_project() {
        let (dir, backend) = project();
        fs::write(dir.0.join("main.asm"), "nop").unwrap();
        assert!(safe(&backend, "main.asm").is_ok());
        assert!(safe(&backend, "new.asm").is_ok());
        assert!(safe(&backend, "../outside.asm").is_err());
        assert!(safe(&Backend::default(), "main.asm").is_err());
    }
    #[cfg(unix)]
    #[test]
    fn symlinks_cannot_escape_the_project() {
        let (dir, backend) = project();
        std::os::unix::fs::symlink(std::env::temp_dir(), dir.0.join("outside")).unwrap();
        assert!(safe(&backend, "outside").is_err());
        let mut entries = vec![];
        tree(&dir.0, &dir.0, &mut entries).unwrap();
        assert!(entries.is_empty());
    }
}
