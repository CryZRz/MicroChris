use crate::{
    boards::profile, hex::validate_hex, models::Project, process::run, state::Backend,
    workspace::safe,
};
use std::{fs, sync::atomic::Ordering};
use tauri::{Manager, State};
#[tauri::command]
pub(crate) async fn build(
    app: tauri::AppHandle,
    s: State<'_, Backend>,
    main: String,
    board: String,
    port: String,
    upload: bool,
    id: String,
    serial_baud: u32,
) -> Result<(), String> {
    if s.busy.swap(true, Ordering::SeqCst) {
        return Err("Operación en curso".into());
    }
    let result = build_inner(&app, &s, main, board, port, upload, id, serial_baud).await;
    s.busy.store(false, Ordering::SeqCst);
    result
}
async fn build_inner(
    app: &tauri::AppHandle,
    s: &Backend,
    main: String,
    board: String,
    port: String,
    upload: bool,
    id: String,
    serial_baud: u32,
) -> Result<(), String> {
    let (mcu, protocol, baud, limit) = profile(&board)?;
    if upload && port.is_empty() {
        return Err("Selecciona un puerto".into());
    }
    let source = safe(s, &main)?;
    let root = s.root.lock().unwrap().clone().unwrap();
    let tools = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("toolchain");
    let output = root.join("build");
    fs::create_dir_all(&output).map_err(|e| e.to_string())?;
    let hex = output.join("firmware.hex");
    if hex.exists() {
        fs::remove_file(&hex).map_err(|e| e.to_string())?
    }
    let ext = if cfg!(windows) { ".exe" } else { "" };
    let avra = tools.join(format!("bin/avra{ext}"));
    let avrdude = tools.join(format!("bin/avrdude{ext}"));
    let app = app.clone();
    let main_copy = main.clone();
    tauri::async_runtime::spawn_blocking(move || {
        run(
            &app,
            &avra,
            &[
                "-O".into(),
                "e".into(),
                "-I".into(),
                source.parent().unwrap().to_string_lossy().into(),
                "--define".into(),
                "F_CPU=16000000".into(),
                "-d".into(),
                output.join("firmware.obj").to_string_lossy().into(),
                "-e".into(),
                output.join("firmware.eep.hex").to_string_lossy().into(),
                "-I".into(),
                tools.join("include").to_string_lossy().into(),
                "-o".into(),
                hex.to_string_lossy().into(),
                source.to_string_lossy().into(),
            ],
            &root,
            "compilacion",
            &id,
        )?;
        validate_hex(&fs::read_to_string(&hex).map_err(|e| e.to_string())?, limit)?;
        if upload {
            run(
                &app,
                &avrdude,
                &[
                    "-N".into(),
                    "-C".into(),
                    tools.join("avrdude.conf").to_string_lossy().into(),
                    "-p".into(),
                    mcu.into(),
                    "-c".into(),
                    protocol.into(),
                    "-b".into(),
                    baud.into(),
                    "-P".into(),
                    port,
                    "-D".into(),
                    "-U".into(),
                    format!("flash:w:{}:i", hex.display()),
                ],
                &root,
                "carga",
                &id,
            )?
        }
        fs::write(
            root.join("avr-project.json"),
            serde_json::to_string_pretty(&Project {
                main: main_copy,
                board,
                baud: serial_baud,
            })
            .unwrap(),
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}
