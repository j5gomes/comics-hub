import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, isNull, and } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import { authors, comicAuthors, syncOutbox } from "../../db/schema";
import type { AuthorFormData } from "../types";

export function useAuthors() {
  return useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      return db
        .select()
        .from(authors)
        .where(isNull(authors.deleted_at))
        .all();
    },
  });
}

export function useAuthor(id: string) {
  return useQuery({
    queryKey: ["authors", id],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(authors)
        .where(eq(authors.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AuthorFormData) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const record = {
        id,
        name: data.name,
        roles: JSON.stringify(data.roles),
        photo_local: data.photo_local,
        created_at: now,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.insert(authors).values(record).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "authors",
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
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: AuthorFormData;
    }) => {
      const now = new Date().toISOString();
      const updates = {
        name: data.name,
        roles: JSON.stringify(data.roles),
        photo_local: data.photo_local,
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.update(authors).set(updates).where(eq(authors.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "authors",
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
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["authors", variables.id] });
    },
  });
}

export function useAddRoleToAuthor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const rows = await db
        .select()
        .from(authors)
        .where(eq(authors.id, id))
        .limit(1);
      const author = rows[0];
      if (!author) throw new Error("Author not found");

      let currentRoles: string[] = [];
      try {
        currentRoles = JSON.parse(author.roles);
      } catch {
        /* empty */
      }

      if (currentRoles.includes(role)) return author;

      const newRoles = [...currentRoles, role];
      const now = new Date().toISOString();
      const updates = {
        roles: JSON.stringify(newRoles),
        updated_at: now,
        sync_status: "pending" as const,
      };

      expoDb.withTransactionSync(() => {
        db.update(authors).set(updates).where(eq(authors.id, id)).run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "authors",
            entity_id: id,
            operation: "upsert",
            payload: JSON.stringify({
              id,
              name: author.name,
              photo_local: author.photo_local,
              ...updates,
            }),
            idempotency_key: randomUUID(),
            created_at: now,
          })
          .run();
      });

      return { ...author, roles: JSON.stringify(newRoles) };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["authors", variables.id] });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      expoDb.withTransactionSync(() => {
        db.update(authors)
          .set({ deleted_at: now, updated_at: now, sync_status: "pending" })
          .where(eq(authors.id, id))
          .run();
        db.insert(syncOutbox)
          .values({
            id: randomUUID(),
            entity: "authors",
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
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });
}

export type ComicAuthorSummary = { name: string; photo: string | null };

export function useComicAuthorsSummary() {
  return useQuery({
    queryKey: ["comic_authors", "summary"],
    queryFn: async () => {
      const rows = await db
        .select({
          comic_id: comicAuthors.comic_id,
          author_id: comicAuthors.author_id,
          author_name: authors.name,
          author_photo: authors.photo_local,
        })
        .from(comicAuthors)
        .innerJoin(authors, eq(comicAuthors.author_id, authors.id))
        .where(isNull(comicAuthors.deleted_at))
        .all();

      const map: Record<string, ComicAuthorSummary[]> = {};
      for (const row of rows) {
        if (!map[row.comic_id]) map[row.comic_id] = [];
        if (!map[row.comic_id].some((a) => a.name === row.author_name)) {
          map[row.comic_id].push({
            name: row.author_name,
            photo: row.author_photo,
          });
        }
      }
      return map;
    },
  });
}

export function useComicAuthors(comicId: string) {
  return useQuery({
    queryKey: ["comic_authors", comicId],
    queryFn: async () => {
      return db
        .select({
          id: comicAuthors.id,
          comic_id: comicAuthors.comic_id,
          author_id: comicAuthors.author_id,
          role: comicAuthors.role,
          author_name: authors.name,
          author_photo: authors.photo_local,
        })
        .from(comicAuthors)
        .innerJoin(authors, eq(comicAuthors.author_id, authors.id))
        .where(
          and(
            eq(comicAuthors.comic_id, comicId),
            isNull(comicAuthors.deleted_at)
          )
        )
        .all();
    },
    enabled: !!comicId,
  });
}
