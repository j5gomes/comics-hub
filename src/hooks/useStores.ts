import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, isNull } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import { stores, syncOutbox } from "../../db/schema";
import type { StoreFormData } from "../types";

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      return db
        .select()
        .from(stores)
        .where(isNull(stores.deleted_at))
        .all();
    },
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(stores)
        .where(eq(stores.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StoreFormData) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const record = {
        id,
        name: data.name,
        location: data.location || null,
        store_type: data.store_type,
        created_at: now,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.insert(stores).values(record).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "stores",
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
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StoreFormData }) => {
      const now = new Date().toISOString();
      const updates = {
        name: data.name,
        location: data.location || null,
        store_type: data.store_type,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.update(stores).set(updates).where(eq(stores.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "stores",
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
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      expoDb.withTransactionSync(() => {
        db.update(stores)
          .set({ deleted_at: now, updated_at: now, sync_status: "pending" })
          .where(eq(stores.id, id))
          .run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "stores",
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
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
