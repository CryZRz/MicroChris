pub(crate) fn validate_hex(text: &str, limit: u32) -> Result<(), String> {
    let mut base = 0;
    for line in text.lines() {
        if !line.starts_with(':') || line.len() < 11 {
            return Err("HEX inválido".into());
        }
        let bytes = (1..line.len())
            .step_by(2)
            .map(|i| {
                line.get(i..i + 2)
                    .and_then(|x| u8::from_str_radix(x, 16).ok())
                    .ok_or("HEX inválido")
            })
            .collect::<Result<Vec<_>, _>>()?;
        if bytes.len() != bytes[0] as usize + 5
            || bytes.iter().fold(0u8, |a, b| a.wrapping_add(*b)) != 0
        {
            return Err("Checksum HEX inválido".into());
        }
        let n = bytes[0] as u32;
        let addr = u16::from_be_bytes([bytes[1], bytes[2]]) as u32;
        match bytes[3] {
            0 => {
                if base + addr + n > limit {
                    return Err("El programa invade la zona del bootloader".into());
                }
            }
            2 if n == 2 => base = u16::from_be_bytes([bytes[4], bytes[5]]) as u32 * 16,
            4 if n == 2 => base = u16::from_be_bytes([bytes[4], bytes[5]]) as u32 * 65536,
            _ => {}
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bounds_and_checksum() {
        assert!(validate_hex(":020000000102FB\n:00000001FF", 2).is_ok());
        assert!(validate_hex(":020000000102FB", 1).is_err());
        assert!(validate_hex(":02000000010200", 2).is_err());
    }
}
