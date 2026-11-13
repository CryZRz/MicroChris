use std::{
    io::{BufRead, BufReader, Read},
    path::Path,
    process::{Command, Stdio},
};
use tauri::Emitter;
pub(crate) fn run(
    app: &tauri::AppHandle,
    tool: &Path,
    args: &[String],
    cwd: &Path,
    phase: &str,
    id: &str,
) -> Result<(), String> {
    let mut child = Command::new(tool)
        .args(args)
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("No se pudo ejecutar {}: {e}", tool.display()))?;
    let mut threads = vec![];
    for pipe in [
        Box::new(child.stdout.take().unwrap()) as Box<dyn Read + Send>,
        Box::new(child.stderr.take().unwrap()),
    ] {
        let a = app.clone();
        let phase = phase.to_owned();
        let id = id.to_owned();
        threads.push(std::thread::spawn(move || {
            for line in BufReader::new(pipe).lines() {
                if let Ok(line) = line {
                    let _ = a.emit(
                        "output",
                        serde_json::json!({"id":id,"phase":phase,"text":line}),
                    );
                }
            }
        }));
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    for t in threads {
        let _ = t.join();
    }
    if status.success() {
        Ok(())
    } else {
        Err(format!("{phase}: código de salida {status}"))
    }
}
