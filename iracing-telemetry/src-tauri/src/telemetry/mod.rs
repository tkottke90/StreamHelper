mod telemetry_header;
mod telemetry_metadata;
mod telemetry_sample;
mod session_info;
mod metric_headers;

extern crate yaml_rust;

use std::path::PathBuf;
use std::fs::{read, write};
use std::str::FromStr;
use serde::{Deserialize, Serialize};
use telemetry_header::TelemetryHeader;
use telemetry_metadata::TelemetryMetadata;
use session_info::SessionInfo;
use metric_headers::VariableHeader;

#[derive(Debug, Serialize, Deserialize)]
pub struct Telemetry {
  header: TelemetryHeader,
  metadata: TelemetryMetadata,
  session: String,
  variable_defs: Vec<VariableHeader>
}


#[tauri::command]
pub fn get_telemetry(path: String) -> Telemetry {
  load_telemetry(String::from(path)).unwrap()
}

#[tauri::command]
pub fn get_next_data(telemetry: Telemetry) -> () {
  println!("get next data");

  println!("{:?}", telemetry);
}

fn load_telemetry(path: String) -> Result<Telemetry, Box<dyn std::error::Error>> {
  let mut input_path = PathBuf::from_str(&path)?;
  
  let file_contents: Vec<u8> = read(&input_path)?;

  let header_buffer: Vec<u8> = TelemetryHeader::get_header_slice(&file_contents);
  let header: TelemetryHeader = TelemetryHeader::from_buffer(header_buffer);

  let sub_header_buffer: Vec<u8> = TelemetryMetadata::get_sub_header_slice(&file_contents, TelemetryHeader::get_header_size());
  let _sub_header: TelemetryMetadata = TelemetryMetadata::from_buffer(sub_header_buffer);
  let _session: String = SessionInfo::from_buffer(&file_contents, header.session_info_offset, header.session_info_length);
  let _vars: Vec<VariableHeader> = VariableHeader::from_buffer(&file_contents, header.var_header_offset, header.num_vars);

  println!("Telemetry file parsed - {}", &path);


  let telem: Telemetry = Telemetry {
    header: header,
    metadata: _sub_header,
    session: _session,
    variable_defs: _vars
  };

  input_path.set_extension("json");
  let json_data = serde_json::to_string_pretty(&telem)?;
  // let _ = write(format!("{}.json", input_path.file_stem().unwrap().to_str().unwrap()), json_data);

  Ok(telem)
}