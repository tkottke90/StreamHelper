use serde::{Deserialize, Serialize};

const VARIABLE_SIZE: u32 = 144;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VariableHeader {
    var_type: u32,
    offset: u32,
    count: u32,
    count_as_time: u8,
    name: String,
    description: String,
    unit: String,
}

impl VariableHeader {
    pub fn from_buffer(buf: &Vec<u8>, offset: u32, vars_count: u32) -> Vec<VariableHeader> {
        let vars_buf_start: usize = usize::try_from(offset).unwrap();
        let vars_buf_size: usize = usize::try_from(vars_count * VARIABLE_SIZE + offset).unwrap();

        let vars_buf: &[u8] = &buf[vars_buf_start..vars_buf_size];

        let mut output: Vec<VariableHeader> = Vec::new();

        for var_index in 1..vars_count {
            let start: usize = usize::try_from(var_index * VARIABLE_SIZE).unwrap();
            let end: usize = usize::try_from((var_index * VARIABLE_SIZE) + &VARIABLE_SIZE).unwrap();

            let var_buf: &[u8] = &vars_buf[start..end];

            output.push(VariableHeader {
                var_type: u32::from_le_bytes(var_buf[0..4].try_into().unwrap()),
                offset: u32::from_le_bytes(var_buf[4..8].try_into().unwrap()),
                count: u32::from_le_bytes(var_buf[8..12].try_into().unwrap()),
                count_as_time: u8::from_le_bytes(var_buf[12..13].try_into().unwrap()),
                name: VariableHeader::parse_string_header(var_buf, 16, 48),
                description: VariableHeader::parse_string_header(var_buf, 48, 112),
                unit: VariableHeader::parse_string_header(var_buf, 112, 144),
            })
        }

        output
    }

    fn parse_string_header(buf: &[u8], start_index: usize, end_index: usize) -> String {
        String::from_utf8(buf[start_index..end_index].to_vec())
            .unwrap_or_default()
            .replace("\0", "")
    }
}
