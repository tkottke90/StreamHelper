mod telemetry_header;
mod telemetry_sub_header;
mod session_info;

use std::fs::read;
use telemetry_header::TelemetryHeader;
use telemetry_sub_header::DiskSubHeader;
use session_info::SessionInfo;

pub fn read_telemetry(path: String) -> Result<(), Box<dyn std::error::Error>> {
  let file_contents: Vec<u8> = read(path)?;

  let header_buffer: Vec<u8> = TelemetryHeader::get_header_slice(&file_contents);
  let header: TelemetryHeader = TelemetryHeader::from_buffer(header_buffer);

  let sub_header_buffer: Vec<u8> = DiskSubHeader::get_sub_header_slice(&file_contents, TelemetryHeader::get_header_size());
  let sub_header: DiskSubHeader = DiskSubHeader::from_buffer(sub_header_buffer);

  let session: String = SessionInfo::from_buffer(&file_contents, header.session_info_offset, header.session_info_length);

  println!("{:?}", header);
  println!("{:?}", sub_header);
  println!("{}", session);

  Ok(())
}