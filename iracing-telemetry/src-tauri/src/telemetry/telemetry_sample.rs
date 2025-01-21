use std::collections::HashMap;
use std::io::{ErrorKind, Read, Seek};
use std::{fs::File, io::SeekFrom};
use serde::{Serialize, Deserialize};
use super::metric_headers::VariableHeader;

const SAMPLE_ID_KEY: &str = "SessionTick";

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryValue {
    pub data: String,
    pub unit: String,
    pub data_type: u32
}

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

    pub fn get_record(&self, index: u32) -> HashMap<String, TelemetryValue> {
        // println!("> Loading File: {}", &self.file);
        let mut data_file = File::open(&self.file).unwrap();
        let size: usize = usize::try_from(self.variable_buf_len.clone()).unwrap();
        
        let read_start = &self.header_offset + (&index * &self.variable_buf_len);
        
        let _ = data_file.seek(SeekFrom::Start((read_start).into())).unwrap();
        
        let mut output = HashMap::new();
        let mut data: Vec<u8> = TelemetrySampler::create_read_vec(size);
        
        match data_file.read_exact(&mut data) {
            Err(error) => match error.kind() {
                ErrorKind::UnexpectedEof => {
                    println!("End of File Reached");
                    return output
                },
                other_error => {
                    panic!("Error reading file: {other_error:?}")
                }
            },
            _ => ()
        }
        
        // If the lengths do not match then we know that we
        // are at the end of the file
        if data.len().ne(&size) {
            return output;
        }
        
        for variable in &self.headers {
            output.insert(
                variable.name.clone(),
                TelemetryValue {
                    data_type: variable.var_type.clone(),
                    unit: variable.unit.clone(),
                    data: variable.parse_binary_to_value(&data)
                }
            );
        }

        output
    }

    pub fn read_next_sample(&mut self) -> HashMap<String, TelemetryValue> {
        // println!("----- Read Next Sample (Index: {}) -----", self.sample_count);
        
        let output = self.get_record(self.sample_count.clone());
        
        self.sample_count += 1;
        
        output
    }
    
    pub fn read_all_samples(&mut self) -> HashMap<String, HashMap<String, TelemetryValue>> {
        // println!("----- Reading All Samples -----");
        let mut output: HashMap<String, HashMap<String, TelemetryValue>> = HashMap::new();
        let mut done = false;

        while done != true {
            let next_sample = self.read_next_sample();

            if next_sample.len() > 0 {
                match next_sample.get(SAMPLE_ID_KEY) {
                    None => { println!("Could not find session tick variable"); },
                    Some(value) => { output.insert(value.data.clone(), next_sample); }
                };
            } else {
                done = true;
            }
        }

        output
    }

    fn create_read_vec(capacity: usize) -> Vec<u8> {
        // Create new vector
        let mut new_vec: Vec<u8> = vec![0; 1024];

        // Fill the vector
        new_vec.resize_with(capacity, || { 0 });

        // Return new vector
        new_vec
    }

}
