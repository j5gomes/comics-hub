import { eq } from "drizzle-orm";
import { db } from "../../../db";
import {
  publishers,
  stores,
  comics,
  authors,
  comicAuthors,
  syncMeta,
} from "../../../db/schema";
import { getPocketBaseInstance } from "../pocketbase";

const entities = [
  { name: "publishers", table: publishers, collection: "publishers" },
  { name: "stores", table: stores, collection: "stores" },
  { name: "authors", table: authors, collection: "authors" },
  { name: "comics", table: comics, collection: "comics" },
  { name: "comic_authors", table: comicAuthors, collection: "comic_authors" },
] as const;

async function getLastPulledAt(entity: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(syncMeta)
    .where(eq(syncMeta.entity, entity))
    .limit(1);
  return rows[0]?.last_pulled_at ?? null;
}

async function setLastPulledAt(entity: string, timestamp: string) {
  const existing = await db
    .select()
    .from(syncMeta)
    .where(eq(syncMeta.entity, entity))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(syncMeta)
      .set({ last_pulled_at: timestamp })
      .where(eq(syncMeta.entity, entity));
  } else {
    await db.insert(syncMeta).values({
      id: entity,
      entity,
      last_pulled_at: timestamp,
    });
  }
}

function mapRemoteToLocal(
  entity: string,
  record: Record<string, any>
): Record<string, any> {
  const base = {
    remote_id: record.id,
    sync_status: "synced",
    updated_at: record.updated,
    created_at: record.created,
    deleted_at: record.deleted || null,
  };

  switch (entity) {
    case "publishers":
      return {
        ...base,
        id: record.client_id,
        name: record.name,
        languages: record.languages || "[]",
        comic_types: record.comic_types || "[]",
      };
    case "stores":
      return {
        ...base,
        id: record.client_id,
        name: record.name,
        location: record.location || null,
        store_type: record.store_type || "physical",
      };
    case "authors":
      return {
        ...base,
        id: record.client_id,
        name: record.name,
        roles: record.roles || "[]",
        photo_local: record.photo_local || null,
        photo_remote: record.photo_remote || null,
      };
    case "comics":
      return {
        ...base,
        id: record.client_id,
        title: record.title,
        comic_type: record.comic_type || "comics",
        status: record.status || "owned",
        publisher_id: record.publisher_client_id || null,
        store_id: record.store_client_id || null,
        cover_image_remote: record.cover_image || null,
      };
    case "comic_authors":
      return {
        ...base,
        id: record.client_id,
        comic_id: record.comic_client_id || null,
        author_id: record.author_client_id || null,
        role: record.role,
      };
    default:
      return base;
  }
}

export async function pullChanges(): Promise<{
  pulled: number;
  errors: number;
}> {
  const pb = getPocketBaseInstance();
  if (!pb) throw new Error("PocketBase not initialized");

  let pulled = 0;
  let errors = 0;

  for (const { name, table, collection } of entities) {
    try {
      const lastPulled = await getLastPulledAt(name);
      const filter = lastPulled ? `updated > "${lastPulled}"` : "";

      const records = await pb.collection(collection).getFullList({
        filter,
        sort: "+updated",
      });

      for (const record of records) {
        try {
          const localData = mapRemoteToLocal(name, record);

          // Check if record exists locally
          const existing = await db
            .select()
            .from(table)
            .where(eq(table.id, localData.id))
            .limit(1);

          if (existing.length > 0) {
            // Last-write-wins: only update if remote is newer
            const localUpdated = existing[0].updated_at;
            if (
              !localUpdated ||
              new Date(record.updated) >= new Date(localUpdated)
            ) {
              await db
                .update(table)
                .set(localData)
                .where(eq(table.id, localData.id));
            }
          } else {
            await db.insert(table).values(localData as any);
          }
          pulled++;
        } catch {
          errors++;
        }
      }

      // Update cursor to the latest record's update time
      if (records.length > 0) {
        const lastRecord = records[records.length - 1];
        await setLastPulledAt(name, lastRecord.updated);
      }
    } catch {
      errors++;
    }
  }

  return { pulled, errors };
}
