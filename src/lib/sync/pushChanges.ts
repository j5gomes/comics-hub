import { eq } from "drizzle-orm";
import { db } from "../../../db";
import {
  syncOutbox,
  publishers,
  stores,
  comics,
  authors,
  comicAuthors,
} from "../../../db/schema";
import { getPocketBaseInstance } from "../pocketbase";
import type { SyncOutboxEntry } from "../../types";

const entityToCollection: Record<string, string> = {
  publishers: "publishers",
  stores: "stores",
  comics: "comics",
  authors: "authors",
  comic_authors: "comic_authors",
};

async function resolveRemoteId(
  entity: string,
  localId: string
): Promise<string | null> {
  const tableMap = { publishers, stores, comics, authors, comic_authors: comicAuthors } as Record<string, any>;
  const table = tableMap[entity];
  if (!table) return null;

  const rows = await db
    .select({ remote_id: table.remote_id })
    .from(table)
    .where(eq(table.id, localId))
    .limit(1);

  return rows[0]?.remote_id ?? null;
}

async function processOutboxEntry(entry: SyncOutboxEntry) {
  const pb = getPocketBaseInstance();
  if (!pb) throw new Error("PocketBase not initialized");

  const collection = entityToCollection[entry.entity];
  if (!collection) throw new Error(`Unknown entity: ${entry.entity}`);

  const payload = JSON.parse(entry.payload);

  if (entry.operation === "delete") {
    const remoteId = await resolveRemoteId(entry.entity, entry.entity_id);
    if (remoteId) {
      await pb.collection(collection).delete(remoteId);
    }
  } else {
    // Upsert
    const remoteId = await resolveRemoteId(entry.entity, entry.entity_id);

    // Resolve FK remote IDs
    if (payload.publisher_id) {
      const pubRemoteId = await resolveRemoteId(
        "publishers",
        payload.publisher_id
      );
      if (pubRemoteId) payload.publisher = pubRemoteId;
    }
    if (payload.store_id) {
      const storeRemoteId = await resolveRemoteId("stores", payload.store_id);
      if (storeRemoteId) payload.store = storeRemoteId;
    }

    // Resolve author_id and comic_id FKs for comic_authors
    if (payload.author_id) {
      const authorRemoteId = await resolveRemoteId("authors", payload.author_id);
      if (authorRemoteId) payload.author = authorRemoteId;
    }
    if (payload.comic_id) {
      const comicRemoteId = await resolveRemoteId("comics", payload.comic_id);
      if (comicRemoteId) payload.comic = comicRemoteId;
    }

    // Map local fields to PocketBase fields
    const pbData = {
      client_id: payload.id,
      name: payload.name,
      title: payload.title,
      comic_type: payload.comic_type,
      status: payload.status,
      languages: payload.languages,
      comic_types: payload.comic_types,
      location: payload.location,
      store_type: payload.store_type,
      publisher: payload.publisher,
      store: payload.store,
      author: payload.author,
      comic: payload.comic,
      role: payload.role,
      roles: payload.roles,
      photo_local: payload.photo_local,
      photo_remote: payload.photo_remote,
    };

    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(pbData).filter(([, v]) => v !== undefined)
    );

    if (remoteId) {
      await pb.collection(collection).update(remoteId, cleanData);
    } else {
      const record = await pb.collection(collection).create(cleanData);
      // Store the remote ID locally
      const tableMap = { publishers, stores, comics, authors, comic_authors: comicAuthors } as Record<string, any>;
      const table = tableMap[entry.entity];
      if (table) {
        await db
          .update(table)
          .set({ remote_id: record.id, sync_status: "synced" })
          .where(eq(table.id, entry.entity_id));
      }
    }
  }
}

export async function pushChanges(): Promise<{
  pushed: number;
  errors: number;
}> {
  const entries = await db.select().from(syncOutbox).all();

  let pushed = 0;
  let errors = 0;

  // Process in order (oldest first)
  for (const entry of entries) {
    try {
      await processOutboxEntry(entry);
      // Remove from outbox on success
      await db.delete(syncOutbox).where(eq(syncOutbox.id, entry.id));
      pushed++;
    } catch (error) {
      errors++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await db
        .update(syncOutbox)
        .set({
          attempts: entry.attempts + 1,
          last_error: errorMessage,
        })
        .where(eq(syncOutbox.id, entry.id));
    }
  }

  return { pushed, errors };
}
