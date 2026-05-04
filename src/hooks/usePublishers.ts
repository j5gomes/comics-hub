import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, isNull } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import { publishers, syncOutbox } from "../../db/schema";
import type { PublisherFormData } from "../types";

export function usePublishers() {
  return useQuery({
    queryKey: ["publishers"],
    queryFn: async () => {
      return db
        .select()
        .from(publishers)
        .where(isNull(publishers.deleted_at))
        .all();
    },
  });
}

export function usePublisher(id: string) {
  return useQuery({
    queryKey: ["publishers", id],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(publishers)
        .where(eq(publishers.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreatePublisher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PublisherFormData) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const record = {
        id,
        name: data.name,
        languages: JSON.stringify(data.languages),
        comic_types: JSON.stringify(data.comic_types),
        logo_local: data.logo_local ?? null,
        created_at: now,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.insert(publishers).values(record).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "publishers",
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
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
    },
  });
}

export function useUpdatePublisher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PublisherFormData;
    }) => {
      const now = new Date().toISOString();
      const updates = {
        name: data.name,
        languages: JSON.stringify(data.languages),
        comic_types: JSON.stringify(data.comic_types),
        logo_local: data.logo_local ?? null,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.update(publishers).set(updates).where(eq(publishers.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "publishers",
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
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
      queryClient.invalidateQueries({
        queryKey: ["publishers", variables.id],
      });
    },
  });
}

export function useDeletePublisher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      expoDb.withTransactionSync(() => {
        db.update(publishers)
          .set({ deleted_at: now, updated_at: now, sync_status: "pending" })
          .where(eq(publishers.id, id))
          .run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "publishers",
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
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
    },
  });
}
