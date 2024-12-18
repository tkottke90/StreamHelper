import { invoke } from "@tauri-apps/api/core";
import { getDB } from './db.service';
import { Signal } from "@preact/signals";
import Database from "@tauri-apps/plugin-sql";
import { Entity, inferTableSchema } from "../utils/sql-table.util";
import { z } from "zod";
import { ComponentChildren } from "preact";
import { useContext } from "preact/hooks";
import { createAsyncContext } from "../utils/context.util";

const config = new Signal({
  initialized: '',
  iracingUrl: ''
})

const ConfigTableSchema = {
  key: z.string(),
  value: z.string(),
  canDelete: z.number().default(0)
};

class Config extends Entity<typeof ConfigTableSchema> {
  
  constructor(db: Promise<Database>) {
    super(db, invoke<string>('query_config_table_name', {}), ConfigTableSchema)
  }

  toConfigMap(configs: inferTableSchema<typeof ConfigTableSchema>[]) {
    const map: Record<string, any> = {}

    configs.forEach(config => {
      map[config.key] = config.value;
    });

    return map;
  }
}

const ConfigDAO = new Config(getDB());


async function initialize() {
  const nextConfig = structuredClone(config.value);
  
  console.debug('Creating iRacing Url Config')
  await ConfigDAO.createIfMissing({ key: 'iracing_url', value: '', canDelete: 0 })
  
  console.debug('Creating Initialized Config')
  await ConfigDAO.createIfMissing({ key: 'initialized', value: '', canDelete: 0 })
  
  
  const configs = ConfigDAO.toConfigMap(await ConfigDAO.select({}));

  nextConfig.initialized = configs.initialized ?? ''
  nextConfig.iracingUrl = configs.iracing_url ?? ''
  
  configs.value = nextConfig;
}

async function saveChanges() {
  
}

const configContext = createAsyncContext({
  createConfig: ConfigDAO.create, 
  getById: (id: number) => ConfigDAO.select({ id }),
  getByKey: (key: string) => ConfigDAO.select({ key }),
  update: (id: number, config: inferTableSchema<typeof ConfigTableSchema>) => ConfigDAO.update(id, config),
  configs: config
}, initialize)


const ContextProvider = configContext.provider;

export function ConfigContext({ children }: { children: ComponentChildren }) {
  return (
    <ContextProvider>
      { children }
    </ContextProvider>
  )
}

export function useConfigContext() {
  return useContext(configContext.context);
}