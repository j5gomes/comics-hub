const m0000 = `
CREATE TABLE IF NOT EXISTS \`publishers\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`languages\` text NOT NULL DEFAULT '[]',
  \`comic_types\` text NOT NULL DEFAULT '[]',
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`stores\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`location\` text,
  \`store_type\` text NOT NULL DEFAULT 'physical',
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`comics\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`title\` text NOT NULL,
  \`comic_type\` text NOT NULL DEFAULT 'comics',
  \`status\` text NOT NULL DEFAULT 'owned',
  \`publisher_id\` text REFERENCES \`publishers\`(\`id\`),
  \`store_id\` text REFERENCES \`stores\`(\`id\`),
  \`cover_image_local\` text,
  \`cover_image_remote\` text,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`sync_outbox\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`entity\` text NOT NULL,
  \`entity_id\` text NOT NULL,
  \`operation\` text NOT NULL,
  \`payload\` text NOT NULL,
  \`idempotency_key\` text NOT NULL,
  \`created_at\` text NOT NULL,
  \`attempts\` integer NOT NULL DEFAULT 0,
  \`last_error\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`sync_meta\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`entity\` text NOT NULL,
  \`last_pulled_at\` text
);`;

const m0001 = `
CREATE TABLE IF NOT EXISTS \`authors\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`comic_authors\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`comic_id\` text NOT NULL REFERENCES \`comics\`(\`id\`),
  \`author_id\` text NOT NULL REFERENCES \`authors\`(\`id\`),
  \`role\` text NOT NULL,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);`;

const m0002 = `
ALTER TABLE \`authors\` ADD COLUMN \`roles\` text NOT NULL DEFAULT '[]';`;

const m0003 = `
ALTER TABLE \`authors\` ADD COLUMN \`photo_local\` text;
--> statement-breakpoint
ALTER TABLE \`authors\` ADD COLUMN \`photo_remote\` text;`;

const m0005 = `
CREATE TABLE IF NOT EXISTS \`series\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`title\` text NOT NULL,
  \`publisher_id\` text,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`series_id\` text;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`volume_number\` integer;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`volume_name\` text;`;

const m0004 = `
CREATE TABLE \`authors_rebuild\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`roles\` text NOT NULL DEFAULT '[]',
  \`photo_local\` text,
  \`photo_remote\` text,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`deleted_at\` text,
  \`sync_status\` text NOT NULL DEFAULT 'pending',
  \`remote_id\` text
);
--> statement-breakpoint
INSERT INTO \`authors_rebuild\` (\`id\`, \`name\`, \`photo_local\`, \`photo_remote\`, \`created_at\`, \`updated_at\`, \`deleted_at\`, \`sync_status\`, \`remote_id\`)
  SELECT \`id\`, \`name\`, \`photo_local\`, \`photo_remote\`, \`created_at\`, \`updated_at\`, \`deleted_at\`, \`sync_status\`, \`remote_id\` FROM \`authors\`;
--> statement-breakpoint
DROP TABLE \`authors\`;
--> statement-breakpoint
ALTER TABLE \`authors_rebuild\` RENAME TO \`authors\`;`;

const m0006 = `
ALTER TABLE \`publishers\` ADD COLUMN \`logo_local\` text;`;

const m0007 = `
ALTER TABLE \`comics\` ADD COLUMN \`published_at\` text;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`price\` real;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`rating\` integer;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`notes\` text;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`binding\` text;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`bought_at\` text;
--> statement-breakpoint
ALTER TABLE \`comics\` ADD COLUMN \`page_count\` integer;`;

const m0008 = `
ALTER TABLE \`stores\` ADD COLUMN \`logo_local\` text;`;

export default {
  journal: {
    entries: [
      { idx: 0, when: 1714000000, tag: "0000_init", breakpoints: true },
      { idx: 1, when: 1714100000, tag: "0001_authors", breakpoints: true },
      { idx: 2, when: 1714200000, tag: "0002_author_role", breakpoints: true },
      { idx: 3, when: 1714300000, tag: "0003_author_photos", breakpoints: true },
      { idx: 4, when: 1714400000, tag: "0004_fix_authors_roles", breakpoints: true },
      { idx: 5, when: 1714500000, tag: "0005_series", breakpoints: true },
      { idx: 6, when: 1714600000, tag: "0006_publisher_logo", breakpoints: true },
      { idx: 7, when: 1714700000, tag: "0007_comics_extra_fields", breakpoints: true },
      { idx: 8, when: 1714800000, tag: "0008_store_logo", breakpoints: true },
    ],
  },
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
    m0008,
  },
};
