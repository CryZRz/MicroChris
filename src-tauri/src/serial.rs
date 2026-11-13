use crate::state::Backend;
use std::{
    io::{Read, Write},
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};
use tauri::{Emitter, State};
#[tauri::command]
pub(crate) fn ports() -> Result<Vec<String>, String> {
    serialport::available_ports()
        .map(|p| p.into_iter().map(|p| p.port_name).collect())
        .map_err(|e| e.to_string())
}
fn disconnect(s: &Backend) {
    if let Some(stop) = s.serial_stop.lock().unwrap().take() {
        stop.store(true, Ordering::SeqCst)
    }
    s.serial.lock().unwrap().take();
}
#[tauri::command]
pub(crate) fn serial_close(s: State<Backend>) {
    disconnect(&s)
}
#[tauri::command]
pub(crate) fn serial_send(s: State<Backend>, text: String) -> Result<(), String> {
    s.serial
        .lock()
        .unwrap()
        .as_mut()
        .ok_or("Monitor desconectado")?
        .write_all(text.as_bytes())
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub(crate) fn serial_open(
    app: tauri::AppHandle,
    s: State<Backend>,
    port: String,
    baud: u32,
) -> Result<(), String> {
    if s.busy.load(Ordering::SeqCst) {
        return Err("Operación en curso".into());
    }
    disconnect(&s);
    let p = serialport::new(port, baud)
        .timeout(Duration::from_millis(100))
        .open()
        .map_err(|e| e.to_string())?;
    let mut reader = p.try_clone().map_err(|e| e.to_string())?;
    let stop = std::sync::Arc::new(AtomicBool::new(false));
    *s.serial.lock().unwrap() = Some(p);
    *s.serial_stop.lock().unwrap() = Some(stop.clone());
    std::thread::spawn(move || {
        let mut b = [0; 1024];
        while !stop.load(Ordering::SeqCst) {
            match reader.read(&mut b) {
                Ok(n) if n > 0 => {
                    let _ = app.emit("serial", String::from_utf8_lossy(&b[..n]).to_string());
                }
                Err(e) if e.kind() != std::io::ErrorKind::TimedOut => {
                    let _ = app.emit("serial-error", e.to_string());
                    break;
                }
                _ => {}
            }
        }
    });
    Ok(())
}
