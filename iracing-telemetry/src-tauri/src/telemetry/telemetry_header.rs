use serde::{Deserialize, Serialize};

const VARIABLE_SIZE: u32 = 112;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TelemetryHeader {
    version: u32,
    pub status: u32,
    pub tick_rate: u32,

    pub session_info_update: u32,
    pub session_info_offset: u32,
    pub session_info_length: u32,

    pub num_vars: u32,
    pub var_header_offset: u32,

    num_buf: u32,
    pub sample_buf_len: u32,
    pub buf_offset: u32,

    // #[serde(skip_serializing)]
    _parts: Vec<u32>,
}

impl TelemetryHeader {
    pub fn get_header_size() -> usize {
        112
    }

    pub fn get_header_slice(file: &Vec<u8>) -> Vec<u8> {
        file[..usize::try_from(VARIABLE_SIZE).unwrap()].to_vec()
    }

    pub fn from_buffer(raw_buf: Vec<u8>) -> TelemetryHeader {
        let buf = Self::parts_to_buffer(&raw_buf, 4, 0, Vec::new());

        TelemetryHeader {
            version: buf[0],
            status: buf[1],
            tick_rate: buf[2],
            session_info_update: buf[3],
            session_info_offset: buf[4],
            session_info_length: buf[5],
            num_vars: buf[6],
            var_header_offset: buf[7],
            num_buf: buf[8],
            sample_buf_len: buf[9],
            buf_offset: buf[13],
            _parts: buf[..10].to_vec(),
        }
    }

    fn parts_to_buffer(buf: &Vec<u8>, size: usize, start: usize, mut accum: Vec<u32>) -> Vec<u32> {
        let len: usize = buf.len();

        if len % size != 0 {
            todo!()
        }

        if start >= len {
            return accum;
        } else {
            let next: u32 = u32::from_le_bytes(buf[start..start + size].try_into().unwrap());
            accum.push(next);

            return Self::parts_to_buffer(buf, size, start + size, accum);
        }
    }
}
