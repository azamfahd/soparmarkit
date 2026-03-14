import { db } from '../db';
import { remoteApi } from './apiService';

export const syncService = {
  enqueue: async (action: 'create' | 'update' | 'delete', table: string, data: any) => {
    await db.sync_queue.add({ action, table, data, timestamp: Date.now() });
  },

  processQueue: async () => {
    const queue = await db.sync_queue.orderBy('timestamp').toArray();
    
    for (const item of queue) {
      try {
        const api = remoteApi[item.table as keyof typeof remoteApi];
        if (!api) throw new Error(`Table ${item.table} not found in remoteApi`);

        if (item.action === 'create') {
          await (api as any).add(item.data);
        } else if (item.action === 'update') {
          await (api as any).update(item.data.id, item.data);
        } else if (item.action === 'delete') {
          await (api as any).delete(item.data.id);
        }
        
        await db.sync_queue.delete(item.id!);
      } catch (error) {
        console.error('Failed to sync operation:', item, error);
        break;
      }
    }
  }
};
