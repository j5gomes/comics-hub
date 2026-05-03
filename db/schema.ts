import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const series = sqliteTable("series", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  publisher_id: text("publisher_id").references(() => publishers.id),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const publishers = sqliteTable("publishers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  languages: text("languages").notNull().default("[]"),
  comic_types: text("comic_types").notNull().default("[]"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  store_type: text("store_type").notNull().default("physical"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const comics = sqliteTable("comics", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  comic_type: text("comic_type").notNull().default("comics"),
  status: text("status").notNull().default("owned"),
  publisher_id: text("publisher_id").references(() => publishers.id),
  store_id: text("store_id").references(() => stores.id),
  series_id: text("series_id").references(() => series.id),
  volume_number: integer("volume_number"),
  volume_name: text("volume_name"),
  cover_image_local: text("cover_image_local"),
  cover_image_remote: text("cover_image_remote"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const authors = sqliteTable("authors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  roles: text("roles").notNull().default("[]"),
  photo_local: text("photo_local"),
  photo_remote: text("photo_remote"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const comicAuthors = sqliteTable("comic_authors", {
  id: text("id").primaryKey(),
  comic_id: text("comic_id")
    .notNull()
    .references(() => comics.id),
  author_id: text("author_id")
    .notNull()
    .references(() => authors.id),
  role: text("role").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
  sync_status: text("sync_status").notNull().default("pending"),
  remote_id: text("remote_id"),
});

export const syncOutbox = sqliteTable("sync_outbox", {
  id: text("id").primaryKey(),
  entity: text("entity").notNull(),
  entity_id: text("entity_id").notNull(),
  operation: text("operation").notNull(),
  payload: text("payload").notNull(),
  idempotency_key: text("idempotency_key").notNull(),
  created_at: text("created_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  last_error: text("last_error"),
});

export const syncMeta = sqliteTable("sync_meta", {
  id: text("id").primaryKey(),
  entity: text("entity").notNull(),
  last_pulled_at: text("last_pulled_at"),
});
