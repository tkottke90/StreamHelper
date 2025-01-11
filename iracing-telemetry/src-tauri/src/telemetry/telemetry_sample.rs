use std::io::{Read, Seek};
use std::{fs::File, io::SeekFrom};

use serde::{Serialize, Deserialize};

use super::metric_headers::VariableHeader;
use super::telemetry_header::TelemetryHeader;

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetrySampler {
    pub sample_count: u32,
    pub headers: Vec<VariableHeader>,

    pub variable_buf_len: u32,
    pub file: String,
}

impl TelemetrySampler {
    pub fn new(file: String, header: TelemetryHeader, headers: Vec<VariableHeader>) -> TelemetrySampler {
        TelemetrySampler {
            sample_count: 0,
            headers: headers.to_vec(),
            file: file,
            variable_buf_len: header.sample_buf_len,
        }
    }

    pub fn read_next_sample(&self) -> String {
        let mut data_file = File::open(&self.file).unwrap();
        let _ = data_file.seek(SeekFrom::Start((&self.variable_buf_len * &self.sample_count).into()));

        let mut data = vec![0; usize::try_from(self.variable_buf_len).unwrap()];
        data_file.read_exact(&mut data).unwrap();

        let mut output = String::new();

        for byte in data.iter() {
            if byte.is_ascii() {
                output.push(*byte as char)
            } else {
                output.push('?')
            }
        }

        output
    }

    // fn parse_telemetry_variable(variable: &VariableHeader, buf: Vec<u8>) {
    //   VariableHeader::from_buffer(&buf, offset, vars_count);
    // }
}
