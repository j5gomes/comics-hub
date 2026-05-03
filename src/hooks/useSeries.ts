import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, isNull, isNotNull, and, asc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import { series, comics, syncOutbox } from "../../db/schema";
import type { SeriesFormData } from "../types";

export function useSeriesList() {
  return useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const seriesList = await db
        .select()
        .from(series)
        .where(isNull(series.deleted_at))
        .all();

      const seriesComics = await db
        .select({
          series_id: comics.series_id,
          cover_image_local: comics.cover_image_local,
          volume_number: comics.volume_number,
        })
        .from(comics)
        .where(and(isNull(comics.deleted_at), isNotNull(comics.series_id)))
        .orderBy(asc(comics.volume_number))
        .all();

      const coversMap: Record<string, string[]> = {};
      const countMap: Record<string, number> = {};
      for (const comic of seriesComics) {
        if (!comic.series_id) continue;
        countMap[comic.series_id] = (countMap[comic.series_id] ?? 0) + 1;
        if (!coversMap[comic.series_id]) coversMap[comic.series_id] = [];
        if (coversMap[comic.series_id].length < 4 && comic.cover_image_local) {
          coversMap[comic.series_id].push(comic.cover_image_local);
        }
      }

      return seriesList.map((s) => ({
        ...s,
        covers: coversMap[s.id] ?? [],
        volumeCount: countMap[s.id] ?? 0,
      }));
    },
  });
}

export function useSeriesDetail(id: string) {
  return useQuery({
    queryKey: ["series", "detail", id],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(series)
        .where(eq(series.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useComicsInSeries(seriesId: string) {
  return useQuery({
    queryKey: ["comics", "series", seriesId],
    queryFn: async () => {
      return db
        .select()
        .from(comics)
        .where(and(eq(comics.series_id, seriesId), isNull(comics.deleted_at)))
        .orderBy(asc(comics.volume_number))
        .all();
    },
    enabled: !!seriesId,
  });
}

export function useCreateSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SeriesFormData) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const record = {
        id,
        title: data.title,
        publisher_id: data.publisher_id,
        created_at: now,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.insert(series).values(record).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "series",
            entity_id: id,
            operation: "upsert",
            payload: JSON.stringify(record),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();
      });

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useUpdateSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SeriesFormData }) => {
      const now = new Date().toISOString();
      const updates = {
        title: data.title,
        publisher_id: data.publisher_id,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.update(series).set(updates).where(eq(series.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "series",
            entity_id: id,
            operation: "upsert",
            payload: JSON.stringify({ id, ...updates }),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();
      });

      return { id, ...updates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", "detail", variables.id] });
    },
  });
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      expoDb.withTransactionSync(() => {
        db.update(series)
          .set({ deleted_at: now, updated_at: now, sync_status: "pending" })
          .where(eq(series.id, id))
          .run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "series",
            entity_id: id,
            operation: "delete",
            payload: JSON.stringify({ id }),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}
