import { invoke } from "@tauri-apps/api/core";
import { getFilesInDir } from "./file-system.service";

const TelemetryFilenameRegex = /(\w+)_([\w\s]+)\s([\d\s-]+)\..*/g;

export function getNextRecord(telemetry: Telemetry) {
  return invoke<Record<string, any>>('get_next_data', { telemetry })
}

export function getTelemetry(path: string) {
  return invoke<Telemetry>('get_telemetry', { path })
}

export async function getTelemetryFiles(directory: string) {
  const files = await getFilesInDir(directory);

  return files.filter(file => file.endsWith('.ibt'));
}