mod telemetry_header;
mod telemetry_sub_header;

use std::fs::read;
use telemetry_header::TelemetryHeader;
use telemetry_sub_header::DiskSubHeader;

pub fn read_telemetry(path: String) -> Result<(), Box<dyn std::error::Error>> {
  let file_contents: Vec<u8> = read(path)?;

  let header_buffer: Vec<u8> = TelemetryHeader::get_header_slice(&file_contents);
  let header: TelemetryHeader = TelemetryHeader::from_buffer(header_buffer);

  let sub_header_buffer: Vec<u8> = DiskSubHeader::get_sub_header_slice(&file_contents, TelemetryHeader::get_header_size());
  let sub_header = DiskSubHeader::from_buffer(sub_header_buffer);

  println!("{:?}", header);
  println!("{:?}", sub_header);

  Ok(())
}