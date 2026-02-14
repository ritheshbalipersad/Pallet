import { palletsApi, movementsApi } from '../api/client';
import { getQueue, removeFromQueue, QueuedAction } from './queue';

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getQueue();
  let synced = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await processItem(item);
      await removeFromQueue(item.id);
      synced++;
    } catch {
      failed++;
    }
  }
  return { synced, failed };
}

async function processItem(item: QueuedAction): Promise<void> {
  switch (item.type) {
    case 'create_pallet':
      await palletsApi.create(item.payload as Parameters<typeof palletsApi.create>[0]);
      break;
    case 'start_movement':
      await movementsApi.start(item.payload as Parameters<typeof movementsApi.start>[0]);
      break;
    case 'confirm_movement': {
      const { movementId, notes } = item.payload as { movementId: number; notes?: string };
      await movementsApi.confirm(movementId, { notes });
      break;
    }
    case 'update_pallet': {
      const { id, ...body } = item.payload as { id: number; conditionStatus?: string };
      await palletsApi.update(id, body);
      break;
    }
    default:
      throw new Error(`Unknown action: ${(item as QueuedAction).type}`);
  }
}

export function useOnlineSync(callback?: (synced: number, failed: number) => void) {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    syncQueue().then((r) => callback?.(r.synced, r.failed));
  });
}
