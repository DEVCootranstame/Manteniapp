import { Preferences } from '@capacitor/preferences';
import { ApiService } from './api.service';

const QUEUE_KEY = 'offline_queue';

export type HttpMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * A single step within a queued job.
 * - `saveAs`: if provided, the response field (or the whole response if field='id')
 *   will be stored under this key for subsequent steps to reference.
 * - `useFrom`: map of { bodyField: savedKey } — before sending, replaces the
 *   bodyField value with the resolved value from a previous step.
 */
export interface QueueStep {
  method: HttpMethod;
  endpoint: string;
  body: Record<string, unknown>;
  saveAs?: string;           // key to store the returned id/value
  saveField?: string;        // which field of the response to save (default: 'id')
  useFrom?: Record<string, string>; // { bodyKey: savedKey }
}

/** A job is a list of steps executed in order. */
export interface QueueJob {
  id: string;
  label: string;             // human-readable description shown in UI
  createdAt: string;
  steps: QueueStep[];
  status: 'pending' | 'error';
  errorMessage?: string;
}

async function loadQueue(): Promise<QueueJob[]> {
  const { value } = await Preferences.get({ key: QUEUE_KEY });
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

async function saveQueue(queue: QueueJob[]): Promise<void> {
  await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(queue) });
}

export const OfflineQueueService = {
  async add(job: Omit<QueueJob, 'id' | 'createdAt' | 'status'>): Promise<void> {
    const queue = await loadQueue();
    queue.push({
      ...job,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    await saveQueue(queue);
  },

  async getAll(): Promise<QueueJob[]> {
    return loadQueue();
  },

  async getPendingCount(): Promise<number> {
    const q = await loadQueue();
    return q.filter(j => j.status === 'pending').length;
  },

  async remove(id: string): Promise<void> {
    const queue = await loadQueue();
    await saveQueue(queue.filter(j => j.id !== id));
  },

  /** Process all pending jobs in order. Returns { succeeded, failed } counts. */
  async processAll(): Promise<{ succeeded: number; failed: number }> {
    const queue = await loadQueue();
    let succeeded = 0;
    let failed = 0;

    for (const job of queue.filter(j => j.status === 'pending')) {
      try {
        const resolved: Record<string, unknown> = {};

        for (const step of job.steps) {
          // Inject values from previous steps
          const body = { ...step.body };
          if (step.useFrom) {
            for (const [bodyKey, savedKey] of Object.entries(step.useFrom)) {
              if (resolved[savedKey] !== undefined) {
                body[bodyKey] = resolved[savedKey];
              }
            }
          }

          let response: Record<string, unknown> | null = null;

          if (step.method === 'POST') {
            response = await ApiService.post<Record<string, unknown>>(step.endpoint, body);
          } else if (step.method === 'PATCH') {
            response = await ApiService.patch<Record<string, unknown>>(step.endpoint, body);
          }

          // Save result for next steps
          if (step.saveAs && response) {
            const field = step.saveField ?? 'id';
            resolved[step.saveAs] = response[field];
          }
        }

        // Job completed — remove from queue
        await OfflineQueueService.remove(job.id);
        succeeded++;
      } catch (err: unknown) {
        // Mark as error so we don't retry indefinitely in this session
        const queue2 = await loadQueue();
        const idx = queue2.findIndex(j => j.id === job.id);
        if (idx !== -1) {
          queue2[idx].status = 'error';
          queue2[idx].errorMessage = err instanceof Error ? err.message : String(err);
          await saveQueue(queue2);
        }
        failed++;
      }
    }

    return { succeeded, failed };
  },

  /** Reset error-state jobs back to pending so they can be retried. */
  async retryErrors(): Promise<void> {
    const queue = await loadQueue();
    const updated = queue.map(j => j.status === 'error' ? { ...j, status: 'pending' as const, errorMessage: undefined } : j);
    await saveQueue(updated);
  },

  async clearAll(): Promise<void> {
    await Preferences.remove({ key: QUEUE_KEY });
  },
};
