use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryMetadata {
    start_date: f32,
    start_time: f64,
    end_time: f64,
    lap_count: u32,
    record_count: u32,
}

impl TelemetryMetadata {
    pub fn get_header_size() -> usize {
        32
    }

    pub fn get_sub_header_slice(file: &Vec<u8>, header_size: usize) -> Vec<u8> {
        file[TelemetryMetadata::get_header_size()..header_size].to_vec()
    }

    pub fn from_buffer(buf: Vec<u8>) -> TelemetryMetadata {
        TelemetryMetadata {
            start_date: crate::utils::get_float_from_bytes(&buf, 0),
            start_time: crate::utils::get_double_from_bytes(&buf, 8),
            end_time: crate::utils::get_double_from_bytes(&buf, 16),
            lap_count: crate::utils::get_int_from_bytes(&buf, 24),
            record_count: 0,
        }
    }
}
