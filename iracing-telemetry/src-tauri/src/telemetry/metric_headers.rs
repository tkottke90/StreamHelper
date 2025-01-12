use std::arch::aarch64::float32x2_t;

use serde::{Deserialize, Serialize};

const VARIABLE_SIZE: u32 = 144;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VariableHeader {
    pub var_type: u32,
    pub offset: u32,
    pub count: u32,
    pub count_as_time: u8,
    pub name: String,
    pub description: String,
    pub unit: String,

    _offset: usize,
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

            let offset = u32::from_le_bytes(var_buf[4..8].try_into().unwrap());

            output.push(VariableHeader {
                var_type: u32::from_le_bytes(var_buf[0..4].try_into().unwrap()),
                offset: offset,
                count: u32::from_le_bytes(var_buf[8..12].try_into().unwrap()),
                count_as_time: u8::from_le_bytes(var_buf[12..13].try_into().unwrap()),
                name: VariableHeader::parse_string_header(var_buf, 16, 48),
                description: VariableHeader::parse_string_header(var_buf, 48, 112),
                unit: VariableHeader::parse_string_header(var_buf, 112, 144),
                _offset: usize::try_from(offset).unwrap()
            })
        }

        output
    }

    pub fn parse_binary_to_value(&self, buf: &Vec<u8>) -> String {
        match self.var_type {
            0 => return VariableHeader::parse_string_header(buf, self._offset, 1),
            1 => return u8::from_ne_bytes(buf[self._offset..1].try_into().unwrap()).to_string(),
            2 => return u32::from_ne_bytes(buf[self._offset..4].try_into().unwrap()).to_string(),
            3 => return u32::from_ne_bytes(buf[self._offset..4].try_into().unwrap()).to_string(),
            4 => return f32::from_ne_bytes(buf[self._offset..4].try_into().unwrap()).to_string(),
            5 => return f64::from_ne_bytes(buf[self._offset..8].try_into().unwrap()).to_string(),
            _ => String::new()
        }
    }

    pub fn parse_string_header(buf: &[u8], start_index: usize, end_index: usize) -> String {
        String::from_utf8(buf[start_index..end_index].to_vec())
            .unwrap_or_default()
            .replace("\0", "")
    }
}
