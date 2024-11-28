import { invoke } from "@tauri-apps/api/core";
import { getDB } from './db.service';
import { Signal } from "@preact/signals";
import Database from "@tauri-apps/plugin-sql";
import { Entity } from "../utils/sql-table.util";
import { z } from "zod";

const config = new Signal({
  initialized: '',
  iracingUrl: ''
})

const ConfigTableSchema = {
  key: z.string(),
  value: z.string(),
  canDelete: z.boolean().default(false)
};

class Config extends Entity<typeof ConfigTableSchema> {
  
  constructor(db: Promise<Database>) {
    super(db, invoke<string>('query_config_table_name', {}), ConfigTableSchema)
  }
}

const ConfigDAO = new Config(getDB());


async function initialize() {
  const nextConfig = structuredClone(config.value);
  
  const result = await ConfigDAO.createIfMissing({ key: 'iracing_url', value: '', canDelete: false })

  console.dir(result)
}

export function useConfigService() {
  return {
    createConfig: ConfigDAO.create,
    getById: (id: number) => ConfigDAO.select({ id }),
    getByKey: (key: string) => ConfigDAO.select({ key }),
    loadConfigs: ConfigDAO.select
  }
}

initialize();