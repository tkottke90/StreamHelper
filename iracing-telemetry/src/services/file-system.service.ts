import { invoke } from '@tauri-apps/api/core';

export function getFilesInDir(directoryPath: string) {
  return invoke<string[]>('read_telemetry_dir', { dirPath: directoryPath });
}
