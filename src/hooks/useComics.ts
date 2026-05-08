import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, isNull, and } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import { comics, comicAuthors, syncOutbox } from "../../db/schema";
import type { ComicFormData } from "../types";
import type { ComicType, ComicStatus } from "../lib/constants";
import { deleteCoverImage } from "../lib/images";

export function useComicStats(status: ComicStatus) {
  return useQuery({
    queryKey: ["comics", "stats", status],
    queryFn: async () => {
      const rows = await db
        .select({ comic_type: comics.comic_type })
        .from(comics)
        .where(and(eq(comics.status, status), isNull(comics.deleted_at)))
        .all();

      const total = rows.length;
      const byType: Record<string, number> = {};
      for (const row of rows) {
        byType[row.comic_type] = (byType[row.comic_type] || 0) + 1;
      }
      return { total, byType };
    },
  });
}

export function useComics(filters?: {
  status?: ComicStatus;
  comic_type?: ComicType;
}) {
  return useQuery({
    queryKey: ["comics", filters],
    queryFn: async () => {
      const conditions = [isNull(comics.deleted_at)];

      if (filters?.status) {
        conditions.push(eq(comics.status, filters.status));
      }
      if (filters?.comic_type) {
        conditions.push(eq(comics.comic_type, filters.comic_type));
      }

      return db
        .select()
        .from(comics)
        .where(and(...conditions))
        .all();
    },
  });
}

export function useComic(id: string) {
  return useQuery({
    queryKey: ["comics", "detail", id],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(comics)
        .where(eq(comics.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateComic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ComicFormData) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const record = {
        id,
        title: data.title,
        comic_type: data.comic_type,
        status: data.status,
        publisher_id: data.publisher_id,
        store_id: data.store_id,
        cover_image_local: data.cover_image_local,
        series_id: data.series_id,
        volume_number: data.volume_number,
        volume_name: data.volume_name,
        published_at: data.published_at,
        price: data.price,
        rating: data.rating,
        notes: data.notes,
        binding: data.binding,
        bought_at: data.bought_at,
        page_count: data.page_count,
        created_at: now,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.insert(comics).values(record).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "comics",
            entity_id: id,
            operation: "upsert",
            payload: JSON.stringify(record),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();

        // Insert comic_authors join rows
        const roleEntries = [
          { author_id: data.writer_id, role: "writer" },
          { author_id: data.artist_id, role: "artist" },
          { author_id: data.colorist_id, role: "colorist" },
        ].filter((e): e is { author_id: string; role: string } => e.author_id !== null);

        for (const entry of roleEntries) {
          const caId = randomUUID();
          const caRecord = {
            id: caId,
            comic_id: id,
            author_id: entry.author_id,
            role: entry.role,
            created_at: now,
            updated_at: now,
            sync_status: "pending" as const,
          };
          db.insert(comicAuthors).values(caRecord).run();
          db.insert(syncOutbox)
            .values({
              id: randomUUID(),
              entity: "comic_authors",
              entity_id: caId,
              operation: "upsert",
              payload: JSON.stringify(caRecord),
              idempotency_key: randomUUID(),
              created_at: now,
            })
            .run();
        }
      });

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic_authors"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useUpdateComic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ComicFormData }) => {
      const now = new Date().toISOString();
      const updates = {
        title: data.title,
        comic_type: data.comic_type,
        status: data.status,
        publisher_id: data.publisher_id,
        store_id: data.store_id,
        cover_image_local: data.cover_image_local,
        series_id: data.series_id,
        volume_number: data.volume_number,
        volume_name: data.volume_name,
        published_at: data.published_at,
        price: data.price,
        rating: data.rating,
        notes: data.notes,
        binding: data.binding,
        bought_at: data.bought_at,
        page_count: data.page_count,
        updated_at: now,
        sync_status: "pending" as const,
      };

      // Query existing comic_authors before the transaction
      const existingRows = await db
        .select()
        .from(comicAuthors)
        .where(
          and(eq(comicAuthors.comic_id, id), isNull(comicAuthors.deleted_at))
        )
        .all();

      const newEntries = [
        { author_id: data.writer_id, role: "writer" },
        { author_id: data.artist_id, role: "artist" },
        { author_id: data.colorist_id, role: "colorist" },
      ].filter((e): e is { author_id: string; role: string } => e.author_id !== null);

      const newKeys = new Set(
        newEntries.map((a) => `${a.author_id}:${a.role}`)
      );
      const existingKeys = new Set(
        existingRows.map((r) => `${r.author_id}:${r.role}`)
      );

      expoDb.withTransactionSync(() => {
        db.update(comics).set(updates).where(eq(comics.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "comics",
            entity_id: id,
            operation: "upsert",
            payload: JSON.stringify({ id, ...updates }),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();

        // Soft-delete removed author-role pairs
        for (const row of existingRows) {
          const key = `${row.author_id}:${row.role}`;
          if (!newKeys.has(key)) {
            db.update(comicAuthors)
              .set({
                deleted_at: now,
                updated_at: now,
                sync_status: "pending",
              })
              .where(eq(comicAuthors.id, row.id))
              .run();
            db.insert(syncOutbox)
              .values({
                id: randomUUID(),
                entity: "comic_authors",
                entity_id: row.id,
                operation: "delete",
                payload: JSON.stringify({ id: row.id }),
                idempotency_key: randomUUID(),
                created_at: now,
              })
              .run();
          }
        }

        // Insert new author-role pairs
        for (const entry of newEntries) {
          const key = `${entry.author_id}:${entry.role}`;
          if (!existingKeys.has(key)) {
            const caId = randomUUID();
            const caRecord = {
              id: caId,
              comic_id: id,
              author_id: entry.author_id,
              role: entry.role,
              created_at: now,
              updated_at: now,
              sync_status: "pending" as const,
            };
            db.insert(comicAuthors).values(caRecord).run();
            db.insert(syncOutbox)
              .values({
                id: randomUUID(),
                entity: "comic_authors",
                entity_id: caId,
                operation: "upsert",
                payload: JSON.stringify(caRecord),
                idempotency_key: randomUUID(),
                created_at: now,
              })
              .run();
          }
        }
      });

      return { id, ...updates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({
        queryKey: ["comics", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["comic_authors"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useDeleteComic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      const rows = await db
        .select()
        .from(comics)
        .where(eq(comics.id, id))
        .limit(1);
      const comic = rows[0];

      // Get comic_authors to soft-delete
      const caRows = await db
        .select()
        .from(comicAuthors)
        .where(
          and(eq(comicAuthors.comic_id, id), isNull(comicAuthors.deleted_at))
        )
        .all();

      expoDb.withTransactionSync(() => {
        db.update(comics)
          .set({ deleted_at: now, updated_at: now, sync_status: "pending" })
          .where(eq(comics.id, id))
          .run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "comics",
            entity_id: id,
            operation: "delete",
            payload: JSON.stringify({ id }),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();

        // Soft-delete all comic_authors for this comic
        for (const row of caRows) {
          db.update(comicAuthors)
            .set({
              deleted_at: now,
              updated_at: now,
              sync_status: "pending",
            })
            .where(eq(comicAuthors.id, row.id))
            .run();
          db.insert(syncOutbox)
            .values({
              id: randomUUID(),
              entity: "comic_authors",
              entity_id: row.id,
              operation: "delete",
              payload: JSON.stringify({ id: row.id }),
              idempotency_key: randomUUID(),
              created_at: now,
            })
            .run();
        }
      });

      if (comic?.cover_image_local) {
        await deleteCoverImage(id).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic_authors"] });
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
