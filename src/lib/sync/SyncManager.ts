import { pushChanges } from "./pushChanges";
import { pullChanges } from "./pullChanges";
import { pushImages, pullImages } from "./imageSync";
import { getPocketBaseInstance } from "../pocketbase";

type SyncListener = (status: SyncStatus) => void;

export type SyncStatus = {
  isSyncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
  lastResult: {
    pushed: number;
    pulled: number;
    imagesPushed: number;
    imagesPulled: number;
  } | null;
};

class _SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isSyncing = false;
  private lastSyncAt: string | null = null;

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(status: SyncStatus) {
    this.listeners.forEach((l) => l(status));
  }

  /**
   * Request a sync with a 2-second debounce.
   */
  requestSync() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.sync(), 2000);
  }

  /**
   * Run a full sync cycle: push -> pull -> image sync.
   */
  async sync(): Promise<SyncStatus> {
    const pb = getPocketBaseInstance();
    if (!pb || this.isSyncing) {
      return {
        isSyncing: false,
        lastSyncAt: this.lastSyncAt,
        error: pb ? "Already syncing" : "PocketBase not configured",
        lastResult: null,
      };
    }

    this.isSyncing = true;
    this.notify({
      isSyncing: true,
      lastSyncAt: this.lastSyncAt,
      error: null,
      lastResult: null,
    });

    try {
      // 1. Push local changes
      const pushResult = await pushChanges();

      // 2. Pull remote changes
      const pullResult = await pullChanges();

      // 3. Sync images
      const imagesPushed = await pushImages();
      const imagesPulled = await pullImages();

      this.lastSyncAt = new Date().toISOString();

      const status: SyncStatus = {
        isSyncing: false,
        lastSyncAt: this.lastSyncAt,
        error: null,
        lastResult: {
          pushed: pushResult.pushed,
          pulled: pullResult.pulled,
          imagesPushed,
          imagesPulled,
        },
      };

      this.notify(status);
      return status;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";

      const status: SyncStatus = {
        isSyncing: false,
        lastSyncAt: this.lastSyncAt,
        error: errorMessage,
        lastResult: null,
      };

      this.notify(status);
      return status;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const SyncManager = new _SyncManager();
