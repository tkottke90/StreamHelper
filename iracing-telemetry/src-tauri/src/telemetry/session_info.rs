use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SessionInfo {}

impl SessionInfo {
    pub fn from_buffer(buf: &Vec<u8>, offset: u32, length: u32) -> String {
        let start: usize = usize::try_from(offset - 1).unwrap();
        let end: usize = usize::try_from(offset + length).unwrap();
        let session_info_buf = &buf[start..end];

        let mut output = String::new();

        for byte in session_info_buf.iter() {
            if byte.is_ascii() {
                output.push(*byte as char)
            } else {
                output.push('?')
            }
        }

        output
    }
}
