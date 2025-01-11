import { useComputed } from "@preact/signals";
import { useConfig, UseConfigEntity } from "./config.service";

export function useIRacingPath() {
  const iRacingConfig = useConfig('iracing_path');

  const isConfigured = useComputed(() => iRacingConfig.value.value !== '')

  return {
    ...iRacingConfig,
    isConfigured,
    getFilePath: (filename: string) => `${iRacingConfig.value.value}/${filename}`
  }
}

export function useSettings(): Record<string, UseConfigEntity> {
  const iRacingPath = useIRacingPath();

  return {
    iRacingPath
  }
}