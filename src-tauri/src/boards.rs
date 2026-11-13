pub(crate) fn profile(
    board: &str,
) -> Result<(&'static str, &'static str, &'static str, u32), String> {
    match board {
        "uno" => Ok(("atmega328p", "arduino", "115200", 32256)),
        "nano" => Ok(("atmega328p", "arduino", "115200", 30720)),
        "nano-old" => Ok(("atmega328p", "arduino", "57600", 30720)),
        "mega" => Ok(("atmega2560", "wiring", "115200", 253952)),
        _ => Err("Placa no compatible".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn profiles() {
        assert_eq!(profile("nano-old").unwrap().2, "57600");
        assert!(profile("uno-r4").is_err());
    }
}
