import { invoke } from "@tauri-apps/api/core";

export function getTelemetry(path: string) {
  return invoke<Telemetry>('get_telemetry', { path: "/Users/thomaskottke/Nextcloud/Documents/Obsidian/Obsidian Notes/Notes/Projects/Project - Streaming Controller/Assets/lamborghinievogt3_fuji gp 2024-11-16 17-24-11.ibt" })
}

export function getNextRecord(telemetry: Telemetry) {
  return invoke<Record<string, any>>('get_next_data', { telemetry })
}