import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface QueuedAction {
  id: string;
  type: 'create_pallet' | 'start_movement' | 'confirm_movement' | 'update_pallet';
  payload: unknown;
  createdAt: number;
  retries?: number;
}

interface PalletDB extends DBSchema {
  queue: { key: string; value: QueuedAction };
}

let db: IDBPDatabase<PalletDB> | null = null;

export async function getDB() {
  if (db) return db;
  db = await openDB<PalletDB>('palletms-offline', 1, {
    upgrade(database) {
      database.createObjectStore('queue', { keyPath: 'id' });
    },
  });
  return db;
}

export async function enqueue(action: Omit<QueuedAction, 'id' | 'createdAt'>): Promise<string> {
  const database = await getDB();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await database.add('queue', {
    ...action,
    id,
    createdAt: Date.now(),
    retries: 0,
  });
  return id;
}

export async function getQueue(): Promise<QueuedAction[]> {
  const database = await getDB();
  return database.getAll('queue');
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('queue', id);
}

export async function clearQueue(): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('queue', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
