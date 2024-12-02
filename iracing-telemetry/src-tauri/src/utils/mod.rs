pub fn get_int_from_bytes(buf: &Vec<u8>, start: usize) -> u32 {
  u32::from_le_bytes(buf[start..start + 4].try_into().unwrap())
}

pub fn get_float_from_bytes(buf: &Vec<u8>, start: usize) -> f32 {
  // Docs: Floating-point numbers are represented according to the IEEE-754 standard. The f32 type is a single-precision float
  f32::from_le_bytes(buf[start..start + 4].try_into().unwrap())

}

pub fn get_double_from_bytes(buf: &Vec<u8>, start: usize) -> f64 {
  // Docs: Floating-point numbers are represented according to the IEEE-754 standard. The f64 has double precision.
  f64::from_le_bytes(buf[start..start + 8].try_into().unwrap())
}