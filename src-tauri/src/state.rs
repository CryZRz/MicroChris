use std::{
    path::PathBuf,
    sync::{atomic::AtomicBool, Mutex},
};
#[derive(Default)]
pub(crate) struct Backend {
    pub(crate) root: Mutex<Option<PathBuf>>,
    pub(crate) busy: AtomicBool,
    pub(crate) serial: Mutex<Option<Box<dyn serialport::SerialPort>>>,
    pub(crate) serial_stop: Mutex<Option<std::sync::Arc<AtomicBool>>>,
}
