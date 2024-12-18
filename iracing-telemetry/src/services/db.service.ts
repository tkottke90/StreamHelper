import Database from '@tauri-apps/plugin-sql'
import { invoke } from "@tauri-apps/api/core";
import {appDataDir} from '@tauri-apps/api/path';
import { batch, useSignal, useSignalEffect } from '@preact/signals';

type Optional<T> = T | undefined

function useCachedValue<T>(promise: Promise<T>) {
  const loading = useSignal(true);
  const value = useSignal<Optional<T>>();

  useSignalEffect(() => {
    promise
      .then((result) => {
        batch(() => {
          loading.value = false;
          value.value = result
        })
      })
      .catch((err) => {
        loading.value = false;
      });
  })

  return {
    loading,
    value
  }
}

export const useDbPath = () => {
  return useCachedValue(appDataDir())
}

let db: Database;

export async function getDB() {
  if (db) return db;

  const dbName = await invoke<string>('get_db_name');
  console.debug(`Setting up DB Connection - ${dbName}`)
  db = await Database.get(dbName);

  return db;
}
