import { invoke } from '@tauri-apps/api/core';
import { getFilesInDir } from './file-system.service';
import { Telemetry, TelemetryData } from '../types/iracing-telemetry';

interface Variable {
  size: number;
  iracingType: string;
  jsBufferMethod: string;
  name: string;
}

const VARIABLE_TYPE: Readonly<Record<number, Variable>> = {
  0: {
    size: 1,
    iracingType: 'irsdk_char',
    jsBufferMethod: 'toString',
    name: 'String'
  },
  1: {
    size: 1,
    iracingType: 'irsdk_bool',
    jsBufferMethod: 'readInt8',
    name: 'Signed 8 Bit Int'
  },
  2: {
    size: 4,
    iracingType: 'irsdk_int',
    jsBufferMethod: 'readUInt32LE',
    name: 'Signed 32 Bit Int'
  },
  3: {
    size: 4,
    iracingType: 'irsdk_bitField',
    jsBufferMethod: 'raad',
    name: 'Unsigned 8 Bit Int'
  },
  4: {
    size: 4,
    iracingType: 'irsdk_float',
    jsBufferMethod: 'readFloatLE',
    name: 'Float'
  },
  5: {
    size: 8,
    iracingType: 'irsdk_double',
    jsBufferMethod: 'readDoubleLE',
    name: 'Double'
  }
} as const;

// const TelemetryFilenameRegex = /(\w+)_([\w\s]+)\s([\d\s-]+)\..*/g;

type TelemetryDataLoadResponse = [Telemetry, Record<string, TelemetryData>];

export function loadRecords(telemetry: Telemetry) {
  return invoke<TelemetryDataLoadResponse>('load_data', { telemetry });
}

export function getRecord(telemetry: Telemetry, index: number) {
  return invoke<Record<string, TelemetryData>>('get_data_at_index', {
    telemetry,
    index
  });
}

export function getTelemetry(path: string) {
  return invoke<Telemetry>('get_telemetry', { path });
}

export async function getTelemetryFiles(directory: string) {
  const files = await getFilesInDir(directory);

  return files.filter((file) => file.endsWith('.ibt'));
}

export function getVariableType(type: number) {
  if (type in VARIABLE_TYPE) {
    return VARIABLE_TYPE[type];
  }
  throw new Error(`Invalid Variable Type: (${type})`);
}

export function getVariableTypeName(type: number) {
  const variable = getVariableType(type);

  return variable.name;
}
