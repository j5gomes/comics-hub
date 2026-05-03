import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "../../db";
import { syncOutbox } from "../../db/schema";

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const pendingCount = useCallback(async () => {
    const rows = await db.select().from(syncOutbox).all();
    return rows.length;
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // Push and pull phases will be implemented in Phase 4
      // For now, just mark the sync time
      setLastSyncAt(new Date().toISOString());

      // Invalidate all queries after sync
      queryClient.invalidateQueries();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sync failed";
      setError(message);
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return { isSyncing, lastSyncAt, error, sync, pendingCount };
}
