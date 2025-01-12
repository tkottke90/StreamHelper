use std::collections::HashMap;
use std::io::{Read, Seek};
use std::{fs::File, io::SeekFrom};

use serde::{Serialize, Deserialize};

use super::metric_headers::VariableHeader;

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetrySampler {
    pub sample_count: u32,
    pub headers: Vec<VariableHeader>,

    pub header_offset: u32,
    pub variable_buf_len: u32,
    pub file: String,
}

impl TelemetrySampler {
    pub fn new(
        file: String,
        header_offset: u32,
        variable_buffer_size: u32,
        headers: Vec<VariableHeader>
    ) -> TelemetrySampler {
        TelemetrySampler {
            sample_count: 0,
            headers: headers.to_vec(),
            file: file,
            header_offset: header_offset,
            variable_buf_len: variable_buffer_size,
        }
    }

    pub fn read_next_sample(&mut self) -> HashMap<String, String> {
        println!("> Loading File: {}", &self.file);
        let mut data_file = File::open(&self.file).unwrap();
        let size: u32 = self.variable_buf_len.clone();
        
        println!("> Extracting Records");
        println!("             File Size: {}", data_file.metadata().unwrap().len());
        println!("  Variable Buffer Size: {}", size);
        println!("          Record Index: {}", &self.sample_count);
        let read_start = &self.header_offset + (&self.sample_count * size);
        println!("        File Start Pos: {}", &read_start);
        
        let _ = data_file.seek(SeekFrom::Start((read_start).into()));
        
        let mut output = HashMap::new();
        let mut data: Vec<u8> = Vec::with_capacity(size.try_into().unwrap());

        println!("         Data Capacity: {}", data.capacity());
        println!("> Reading File");
        data_file.read_exact(&mut data).unwrap();
        
        println!("             Data Size: {}", data.len());

        // If the lengths do not match then we know that we
        // are at the end of the file
        if data.len().ne(&self.variable_buf_len.try_into().unwrap_or(0)) {
            return output;
        }

        for variable in &self.headers {
            println!("> Reading Variable: {}", variable.name);

            output.insert(
                variable.name.clone(),
                variable.parse_binary_to_value(&data)
            );
        }

        self.sample_count += 1;

        output
    }
}
