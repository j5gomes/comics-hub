# Comics Hub

A local-first comic collection manager for iOS and Android, built with React Native and Expo.

## Features

| Feature | Description |
|---|---|
| **Collection** | Browse owned comics filtered by type (All / Comics / BD / Manga) with a stats header and pull-to-refresh |
| **Wishlist** | Same view as Collection for comics marked as wishlist; switch status in one tap from any comic |
| **Series** | Group comics into series; each card shows an auto 2×2 cover grid and volume count |
| **Comic detail** | Tap-to-edit all fields inline with auto-save; portrait cover with fullscreen viewer and camera/gallery picker; status pills; bottom-sheet pickers for type, publisher, store, and series; writer/artist/colorist assignment |
| **Publishers** | Inline name edit; toggle supported languages and comic types as pills |
| **Stores** | Inline name and location edit; store type picker (Physical / Online / Convention) |
| **Authors** | Circular profile photo with fullscreen viewer and picker; inline name edit; toggle roles (Writer / Artist / Colorist) |
| **Seed data** | One-tap seed with Marvel, DC, and Image Comics sample data (publishers, stores, authors, series, 20 comics) |
| **Sync (planned)** | PocketBase sync via outbox pattern — every write is queued for replay against a remote instance |

---

## Data Model

| Entity | Key fields |
|---|---|
| Comic | title, type (Comics/BD/Manga), status (owned/wishlist), cover image, publisher, store, series, volume number, volume name, writer, artist, colorist |
| Series | title, publisher |
| Publisher | name, supported languages, supported comic types |
| Store | name, location, type (physical/online/convention) |
| Author | name, roles (writer/artist/colorist), photo |

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Routing | Expo Router (file-based) |
| Database | expo-sqlite + Drizzle ORM |
| Migrations | drizzle-orm/expo-sqlite migrator |
| Server state | TanStack React Query |
| Image handling | expo-image, expo-image-picker, expo-image-manipulator |
| Sync (planned) | PocketBase via sync outbox pattern |

### Architecture

- **Local-first**: all data lives in a SQLite database on-device via Drizzle ORM
- **Migrations**: schema changes are applied automatically on app launch using `useMigrations`
- **Sync outbox**: every write appends a record to `sync_outbox`; a background worker can replay these against a PocketBase instance
- **Soft deletes**: records are marked with `deleted_at` rather than removed, supporting sync conflict resolution
- **Stale-while-revalidate off**: `staleTime: Infinity` in React Query — the SQLite layer is the source of truth, cache is invalidated explicitly after mutations

---

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `i` / `a` to open in a simulator.

### Development Build

For full native functionality (image picker, file system), use a development build:

```bash
npx expo run:ios
# or
npx expo run:android
```
