
interface Telemetry {
  [key: string]: any;
  headers: {
    version: number;
    status: number;
    tick_rate: number;
    session_info_update: number;
    session_info_offset: number;
    session_info_length: number;
    num_vars: number;
    var_header_offset: number;
    num_buf: number;
    buf_len: number;
    buf_offset: number;
  }

  metadata: {
    start_date: number;
    start_time: number;
    end_time: number;
    lap_count: number;
    record_count: number;
  }

  session: string;

  variable_defs: Array<{
    var_type: number;
    offset: number;
    count: number;
    count_as_time: number;
    name: string;
    description: string;
    unit: string;
  }>
}