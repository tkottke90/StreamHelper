mod telemetry_header;
mod telemetry_sub_header;
mod session_info;
mod variable_headers;

extern crate yaml_rust;

use std::fs::read;
use telemetry_header::TelemetryHeader;
use telemetry_sub_header::DiskSubHeader;
use session_info::SessionInfo;
use variable_headers::VariableHeader;
use yaml_rust::{YamlLoader, Yaml};

#[tauri::command]
pub fn get_telemetry(path: String) -> String {
  read_telemetry(String::from(path)).unwrap()
}

fn read_telemetry(path: String) -> Result<String, Box<dyn std::error::Error>> {
  let file_contents: Vec<u8> = read(&path)?;

  let header_buffer: Vec<u8> = TelemetryHeader::get_header_slice(&file_contents);
  let header: TelemetryHeader = TelemetryHeader::from_buffer(header_buffer);

  let sub_header_buffer: Vec<u8> = DiskSubHeader::get_sub_header_slice(&file_contents, TelemetryHeader::get_header_size());
  let _sub_header: DiskSubHeader = DiskSubHeader::from_buffer(sub_header_buffer);
  let _session: String = SessionInfo::from_buffer(&file_contents, header.session_info_offset, header.session_info_length);
  let _vars: Vec<VariableHeader> = VariableHeader::from_buffer(&file_contents, header.var_header_offset, header.num_vars);

  // println!("{:?}", header);
  // println!("{:?}", sub_header);
  // println!("{}", session);
  // println!("{:?}", _vars);

  println!("Telemetry file parsed - {}", &path);

  // let yml: Vec<Yaml> = YamlLoader::load_from_str(&_session)?;

  // println!("{:?}", yml);

  Ok(_session)
}
