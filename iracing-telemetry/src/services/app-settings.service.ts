import { useComputed } from "@preact/signals";
import { useConfig, UseConfigEntity } from "./config.service";

export function useIRacingPath() {
  const iRacingConfig = useConfig('iracing_path');

  const isConfigured = useComputed(() => iRacingConfig.config.value?.value !== '')

  return {
    ...iRacingConfig,
    isConfigured
  }
}

export function useSettings(): Record<string, UseConfigEntity> {
  const iRacingPath = useIRacingPath();

  return {
    iRacingPath
  }
}