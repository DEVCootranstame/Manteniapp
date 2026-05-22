import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import { OfflineQueueService } from '../services/offline-queue.service';

export interface NetworkState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export function useNetwork(): NetworkState {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const refreshPendingCount = useCallback(async () => {
    const count = await OfflineQueueService.getPendingCount();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    const count = await OfflineQueueService.getPendingCount();
    if (count === 0) return;
    setIsSyncing(true);
    try {
      await OfflineQueueService.processAll();
      await refreshPendingCount();
      setLastSynced(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    let mounted = true;

    // Get initial state
    Network.getStatus().then(status => {
      if (!mounted) return;
      setIsOnline(status.connected);
    });

    refreshPendingCount();

    // Listen for changes
    const listener = Network.addListener('networkStatusChange', async (status) => {
      if (!mounted) return;
      setIsOnline(status.connected);
      if (status.connected) {
        // Auto-sync when connection is restored
        await syncNow();
      }
    });

    return () => {
      mounted = false;
      listener.then(h => h.remove());
    };
  }, [refreshPendingCount, syncNow]);

  return { isOnline, pendingCount, isSyncing, lastSynced, syncNow, refreshPendingCount };
}
