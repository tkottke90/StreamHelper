import { z } from "zod";
import { getDB, getOne, updateRecord } from "./db.service";
import { Signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

const BaseTableSchema = {
  id: z.number({ coerce: true }),
  createdAt: z.date({ coerce: true }),
  updatedAt: z.date({ coerce: true }),
  deletedAt: z.date({ coerce: true }).optional()
}

const ConfigSchema = z.object({
  key: z.string(),
  value: z.string(),
  canDelete: z.number({ coerce: true }).default(0),
  ...BaseTableSchema
});

type Config = z.infer<typeof ConfigSchema>;

const configs: Record<string, Signal<Config>> = {}

export async function initialize() {
  const db = await getDB();
  
  // Load all the config
  await db.select<Array<Record<string, any>>>('SELECT * FROM config')
          .then(result => {
            return result.forEach(record => {
              const config = ConfigSchema.parse(record)
              configs[config.key] = new Signal(config);
            })
          });
}

async function refreshConfig(configName: string) {
  return await getOne('SELECT * FROM config WHERE key == $1', [configName])
    .then(record => {
      if (record) {
        return ConfigSchema.parse(record);
      } else {
        null;
      }
    });
}

function update(configName: string, newValue: string) {
  const query = [
    'INSERT INTO config (key, value)',
    'VALUES ($1, $2)',
    'ON CONFLICT(key)',
    'DO UPDATE SET value = $2',
  ].join(' ')

  return updateRecord(query, [ configName, newValue ]);
}

export function useConfig(configName: string) {
  const loading = useSignal(false);
  let value = useSignal<Config>();

  useEffect(() => {
    loading.value = true;
    if (configs[configName]) {
      value = configs[configName]
    } else {
      refreshConfig(configName)
        .then(config => {
          value.value = config;
        });
      loading.value = false;
    }
  }, []);

  return {
    configName,
    config: value,
    value: value.value?.value ?? '',
    isLoading: loading,
    update: async (newValue: string) => {
      await update(configName, newValue);
      value.value = await refreshConfig(configName);
    }
  }
}

export type UseConfigEntity = ReturnType<typeof useConfig>;