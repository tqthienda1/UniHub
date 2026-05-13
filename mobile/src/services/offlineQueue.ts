/**
 * offlineQueue.ts
 *
 * Manages a persistent local queue of check-ins that could not be synced
 * to the server because of network unavailability.
 *
 * Storage key layout (AsyncStorage):
 *   "checkin_queue"  →  JSON array of CheckInQueueItem[]
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export interface CheckInQueueItem {
  /** Unique local ID so we can remove specific items after sync */
  localId: string;
  workshopId: string;
  qrToken: string;
  /** ISO timestamp of when the scan happened locally */
  scannedAt: string;
  /** How many times we have already tried (for exponential back-off later) */
  retries: number;
}

const STORAGE_KEY = 'checkin_queue';

// ── persistence helpers ───────────────────────────────────────────────────────

export async function loadQueue(): Promise<CheckInQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckInQueueItem[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(items: CheckInQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Add a scan to the offline queue.
 * Returns the generated localId.
 */
export async function enqueue(workshopId: string, qrToken: string): Promise<string> {
  const queue = await loadQueue();
  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: CheckInQueueItem = {
    localId,
    workshopId,
    qrToken,
    scannedAt: new Date().toISOString(),
    retries: 0,
  };
  queue.push(item);
  await saveQueue(queue);
  return localId;
}

/**
 * Remove a single item from the queue by localId (after successful sync).
 */
async function dequeue(localId: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((i) => i.localId !== localId));
}

/**
 * Flush the entire queue to the server.
 *
 * @returns { synced, failed, duplicate } counts
 */
export async function flushQueue(): Promise<{
  synced: number;
  failed: number;
  duplicate: number;
}> {
  const queue = await loadQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, duplicate: 0 };

  let synced = 0;
  let failed = 0;
  let duplicate = 0;

  for (const item of queue) {
    try {
      await apiClient.post(
        `/staff-portal/workshops/${item.workshopId}/checkin`,
        { qrToken: item.qrToken },
      );
      await dequeue(item.localId);
      synced++;
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 409) {
        // Already checked in on the server — safe to discard from queue
        await dequeue(item.localId);
        duplicate++;
      } else if (status === 400 || status === 404) {
        // Invalid QR / not registered — discard so we don't retry forever
        await dequeue(item.localId);
        failed++;
      } else {
        // Network error or 5xx — leave in queue, increment retry counter
        const updatedQueue = await loadQueue();
        const idx = updatedQueue.findIndex((i) => i.localId === item.localId);
        if (idx !== -1) {
          updatedQueue[idx].retries += 1;
          await saveQueue(updatedQueue);
        }
        failed++;
      }
    }
  }

  return { synced, failed, duplicate };
}

/**
 * Count of items currently waiting in the queue.
 */
export async function pendingCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}
