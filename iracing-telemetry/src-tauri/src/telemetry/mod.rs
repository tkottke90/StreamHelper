mod metric_headers;
mod session_info;
mod telemetry_header;
mod telemetry_metadata;
mod telemetry_sample;

extern crate yaml_rust;

use metric_headers::VariableHeader;
use serde::{Deserialize, Serialize};
use session_info::SessionInfo;
use tauri::ipc::InvokeError;
use telemetry_sample::TelemetrySampler;
use std::collections::HashMap;
use std::fs::{read, read_dir};
use std::path::PathBuf;
use std::str::FromStr;
use telemetry_header::TelemetryHeader;
use telemetry_metadata::TelemetryMetadata;

#[derive(Debug, Serialize, Deserialize)]
pub struct Telemetry {
    header: TelemetryHeader,
    metadata: TelemetryMetadata,
    session: String,
    variable_defs: Vec<VariableHeader>,
    sampler: TelemetrySampler
}

#[tauri::command]
pub fn get_telemetry(path: String) -> Telemetry {
    load_telemetry(String::from(path)).unwrap()
}

#[tauri::command]
pub fn get_next_data(mut telemetry: Telemetry) -> HashMap<String, String> {
    println!("get next data");

    telemetry.sampler.read_next_sample()
}

fn load_telemetry(path: String) -> Result<Telemetry, Box<dyn std::error::Error>> {
    let input_path = PathBuf::from_str(&path)?;

    let file_contents: Vec<u8> = read(&input_path)?;

    let header_buffer: Vec<u8> = TelemetryHeader::get_header_slice(&file_contents);
    let header: TelemetryHeader = TelemetryHeader::from_buffer(header_buffer);

    let sub_header_buffer: Vec<u8> =
        TelemetryMetadata::get_sub_header_slice(&file_contents, TelemetryHeader::get_header_size());
    let _sub_header: TelemetryMetadata = TelemetryMetadata::from_buffer(sub_header_buffer);
    let _session: String = SessionInfo::from_buffer(
        &file_contents,
        header.session_info_offset.clone(),
        header.session_info_length.clone(),
    );
    let _vars: Vec<VariableHeader> =
        VariableHeader::from_buffer(&file_contents, header.var_header_offset.clone(), header.num_vars.clone());

    println!("Telemetry file parsed - {}", &path);

    let telemetry_sampler = TelemetrySampler::new(
        path, 
        header.buf_offset.clone(),
        header.sample_buf_len.clone(),
        _vars.clone()
    );

    let telem: Telemetry = Telemetry {
        header: header.clone(),
        metadata: _sub_header,
        session: _session,
        variable_defs: _vars.clone(),
        sampler: telemetry_sampler
    };

    Ok(telem)
}

#[tauri::command]
pub fn read_telemetry_dir(dir_path: String) -> Result<Vec<String>, InvokeError> {
    println!("Reading Directory: {}", dir_path);
    let directory: std::fs::ReadDir = read_dir(dir_path).unwrap();
    
    let files = directory.map(
        |entry: Result<std::fs::DirEntry, std::io::Error>| String::from(entry.unwrap().file_name().to_str().unwrap())
    ).collect::<Vec<String>>();
    
    Ok(files)
}