use std::{fs::File, io::SeekFrom};
use std::io::{Read, Seek};

use super::metric_headers::VariableHeader;

enum VariableType {

}

pub struct TelemetrySampler {
  sample_count: u32,
  headers: Vec<VariableHeader>,

  pub length: u32,
  pub file: String
}

impl TelemetrySampler {
  
  pub fn new(file: String, length: u32, headers: &Vec<VariableHeader>) -> TelemetrySampler {
    TelemetrySampler {
      sample_count: 0,
      headers: headers.to_vec(),
      file: file,
      length: length
    }
  }

  pub fn read_next_sample(&self) -> String {
    let mut data_file = File::open(&self.file).unwrap();
    let _ = data_file.seek(SeekFrom::Start((&self.length * &self.sample_count).into()));

    let mut data = vec![0; usize::try_from(self.length).unwrap()];
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

