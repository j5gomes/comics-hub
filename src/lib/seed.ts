import { randomUUID } from "expo-crypto";
import { db, expoDb } from "../../db";
import {
  publishers,
  stores,
  authors,
  series,
  comics,
  comicAuthors,
} from "../../db/schema";

const now = () => new Date().toISOString();

export async function seedDatabase() {
  const ts = now();

  // ── Publishers ────────────────────────────────────────────────
  const marvelId = randomUUID();
  const dcId = randomUUID();
  const imageId = randomUUID();
  const castermanId = randomUUID();
  const kodanshaId = randomUUID();

  const publisherRows = [
    {
      id: marvelId,
      name: "Marvel Comics",
      languages: JSON.stringify(["EN"]),
      comic_types: JSON.stringify(["comics"]),
      logo_local: null,
    },
    {
      id: dcId,
      name: "DC Comics",
      languages: JSON.stringify(["EN"]),
      comic_types: JSON.stringify(["comics"]),
      logo_local: null,
    },
    {
      id: imageId,
      name: "Image Comics",
      languages: JSON.stringify(["EN"]),
      comic_types: JSON.stringify(["comics"]),
      logo_local: null,
    },
    {
      id: castermanId,
      name: "Casterman",
      languages: JSON.stringify(["FR", "EN"]),
      comic_types: JSON.stringify(["bd"]),
      logo_local: null,
    },
    {
      id: kodanshaId,
      name: "Kodansha",
      languages: JSON.stringify(["JP", "EN"]),
      comic_types: JSON.stringify(["manga"]),
      logo_local: null,
    },
  ].map((p) => ({
    ...p,
    created_at: ts,
    updated_at: ts,
    sync_status: "pending" as const,
  }));

  // ── Stores ────────────────────────────────────────────────────
  const store1Id = randomUUID();
  const store2Id = randomUUID();

  const storeRows = [
    {
      id: store1Id,
      name: "Local Heroes",
      location: "Lisbon, PT",
      store_type: "physical",
    },
    {
      id: store2Id,
      name: "Comixology",
      location: null,
      store_type: "online",
    },
  ].map((s) => ({
    ...s,
    created_at: ts,
    updated_at: ts,
    sync_status: "pending" as const,
  }));

  // ── Authors ───────────────────────────────────────────────────
  const stanLeeId = randomUUID();
  const jackKirbyId = randomUUID();
  const chrisClaremontId = randomUUID();
  const jimLeeId = randomUUID();
  const frankMillerId = randomUUID();
  const bkvId = randomUUID();
  const fionaStaplesId = randomUUID();
  const neilGaimanId = randomUUID();
  const daveMcKeanId = randomUUID();
  const grantMorrisonId = randomUUID();
  const hergeId = randomUUID();
  const katsuhiroOtomoId = randomUUID();

  const authorRows = [
    { id: stanLeeId,        name: "Stan Lee",          roles: JSON.stringify(["writer"]) },
    { id: jackKirbyId,      name: "Jack Kirby",         roles: JSON.stringify(["artist"]) },
    { id: chrisClaremontId, name: "Chris Claremont",    roles: JSON.stringify(["writer"]) },
    { id: jimLeeId,         name: "Jim Lee",            roles: JSON.stringify(["artist"]) },
    { id: frankMillerId,    name: "Frank Miller",       roles: JSON.stringify(["writer", "artist"]) },
    { id: bkvId,            name: "Brian K. Vaughan",   roles: JSON.stringify(["writer"]) },
    { id: fionaStaplesId,   name: "Fiona Staples",      roles: JSON.stringify(["artist", "colorist"]) },
    { id: neilGaimanId,     name: "Neil Gaiman",        roles: JSON.stringify(["writer"]) },
    { id: daveMcKeanId,     name: "Dave McKean",        roles: JSON.stringify(["artist"]) },
    { id: grantMorrisonId,  name: "Grant Morrison",     roles: JSON.stringify(["writer"]) },
    { id: hergeId,          name: "Hergé",              roles: JSON.stringify(["writer", "artist"]) },
    { id: katsuhiroOtomoId, name: "Katsuhiro Otomo",    roles: JSON.stringify(["writer", "artist"]) },
  ].map((a) => ({
    ...a,
    photo_local: null,
    photo_remote: null,
    created_at: ts,
    updated_at: ts,
    sync_status: "pending" as const,
  }));

  // ── Series ────────────────────────────────────────────────────
  const xmenSeriesId = randomUUID();
  const batmanSeriesId = randomUUID();
  const sagaSeriesId = randomUUID();
  const sandmanSeriesId = randomUUID();
  const ddSeriesId = randomUUID();
  const tintinSeriesId = randomUUID();
  const akiraSeriesId = randomUUID();

  const seriesRows = [
    { id: xmenSeriesId,     title: "X-Men",       publisher_id: marvelId },
    { id: batmanSeriesId,   title: "Batman",      publisher_id: dcId },
    { id: sagaSeriesId,     title: "Saga",        publisher_id: imageId },
    { id: sandmanSeriesId,  title: "The Sandman", publisher_id: dcId },
    { id: ddSeriesId,       title: "Daredevil",   publisher_id: marvelId },
    { id: tintinSeriesId,   title: "Tintin",      publisher_id: castermanId },
    { id: akiraSeriesId,    title: "Akira",       publisher_id: kodanshaId },
  ].map((s) => ({
    ...s,
    created_at: ts,
    updated_at: ts,
    sync_status: "pending" as const,
  }));

  // ── Comics ────────────────────────────────────────────────────
  type ComicSeed = {
    id: string;
    title: string;
    comic_type: string;
    status: string;
    publisher_id: string | null;
    store_id: string | null;
    series_id: string | null;
    volume_number: number | null;
    volume_name: string | null;
    writer_id: string | null;
    artist_id: string | null;
    colorist_id: string | null;
  };

  const comicSeeds: ComicSeed[] = [
    // X-Men (comics)
    { id: randomUUID(), title: "X-Men: Days of Future Past",    comic_type: "comics", status: "owned",    publisher_id: marvelId, store_id: store1Id, series_id: xmenSeriesId,    volume_number: 1, volume_name: "Days of Future Past",    writer_id: chrisClaremontId, artist_id: jackKirbyId,   colorist_id: null },
    { id: randomUUID(), title: "X-Men: God Loves, Man Kills",   comic_type: "comics", status: "owned",    publisher_id: marvelId, store_id: store1Id, series_id: xmenSeriesId,    volume_number: 2, volume_name: "God Loves, Man Kills",   writer_id: chrisClaremontId, artist_id: jimLeeId,      colorist_id: null },
    { id: randomUUID(), title: "X-Men: Mutant Genesis",         comic_type: "comics", status: "owned",    publisher_id: marvelId, store_id: store2Id, series_id: xmenSeriesId,    volume_number: 3, volume_name: "Mutant Genesis",         writer_id: chrisClaremontId, artist_id: jimLeeId,      colorist_id: null },
    { id: randomUUID(), title: "X-Men: Fatal Attractions",      comic_type: "comics", status: "wishlist", publisher_id: marvelId, store_id: null,     series_id: xmenSeriesId,    volume_number: 4, volume_name: "Fatal Attractions",      writer_id: chrisClaremontId, artist_id: jimLeeId,      colorist_id: null },

    // Batman (comics)
    { id: randomUUID(), title: "Batman: Year One",              comic_type: "comics", status: "owned",    publisher_id: dcId,     store_id: store1Id, series_id: batmanSeriesId,  volume_number: 1, volume_name: "Year One",               writer_id: frankMillerId,    artist_id: frankMillerId, colorist_id: null },
    { id: randomUUID(), title: "Batman: The Dark Knight Returns",comic_type: "comics", status: "owned",   publisher_id: dcId,     store_id: store1Id, series_id: batmanSeriesId,  volume_number: 2, volume_name: "The Dark Knight Returns", writer_id: frankMillerId,    artist_id: frankMillerId, colorist_id: null },
    { id: randomUUID(), title: "Batman: Hush",                  comic_type: "comics", status: "owned",    publisher_id: dcId,     store_id: store2Id, series_id: batmanSeriesId,  volume_number: 3, volume_name: "Hush",                   writer_id: grantMorrisonId,  artist_id: jimLeeId,      colorist_id: null },

    // Saga (comics)
    { id: randomUUID(), title: "Saga Vol. 1",                   comic_type: "comics", status: "owned",    publisher_id: imageId,  store_id: store1Id, series_id: sagaSeriesId,    volume_number: 1, volume_name: null, writer_id: bkvId, artist_id: fionaStaplesId, colorist_id: fionaStaplesId },
    { id: randomUUID(), title: "Saga Vol. 2",                   comic_type: "comics", status: "owned",    publisher_id: imageId,  store_id: store1Id, series_id: sagaSeriesId,    volume_number: 2, volume_name: null, writer_id: bkvId, artist_id: fionaStaplesId, colorist_id: fionaStaplesId },
    { id: randomUUID(), title: "Saga Vol. 3",                   comic_type: "comics", status: "wishlist", publisher_id: imageId,  store_id: null,     series_id: sagaSeriesId,    volume_number: 3, volume_name: null, writer_id: bkvId, artist_id: fionaStaplesId, colorist_id: fionaStaplesId },

    // The Sandman (comics)
    { id: randomUUID(), title: "The Sandman: Preludes & Nocturnes", comic_type: "comics", status: "owned",    publisher_id: dcId, store_id: store1Id, series_id: sandmanSeriesId, volume_number: 1, volume_name: "Preludes & Nocturnes", writer_id: neilGaimanId, artist_id: daveMcKeanId, colorist_id: null },
    { id: randomUUID(), title: "The Sandman: The Doll's House",     comic_type: "comics", status: "owned",    publisher_id: dcId, store_id: store1Id, series_id: sandmanSeriesId, volume_number: 2, volume_name: "The Doll's House",     writer_id: neilGaimanId, artist_id: daveMcKeanId, colorist_id: null },
    { id: randomUUID(), title: "The Sandman: Dream Country",        comic_type: "comics", status: "wishlist", publisher_id: dcId, store_id: null,     series_id: sandmanSeriesId, volume_number: 3, volume_name: "Dream Country",        writer_id: neilGaimanId, artist_id: daveMcKeanId, colorist_id: null },

    // Daredevil (comics)
    { id: randomUUID(), title: "Daredevil: Born Again",         comic_type: "comics", status: "owned",    publisher_id: marvelId, store_id: store1Id, series_id: ddSeriesId,      volume_number: 1, volume_name: "Born Again",             writer_id: frankMillerId,    artist_id: frankMillerId, colorist_id: null },
    { id: randomUUID(), title: "Daredevil: The Man Without Fear",comic_type: "comics", status: "owned",   publisher_id: marvelId, store_id: store2Id, series_id: ddSeriesId,      volume_number: 2, volume_name: "The Man Without Fear",   writer_id: frankMillerId,    artist_id: frankMillerId, colorist_id: null },

    // Tintin (bd)
    { id: randomUUID(), title: "Tintin: The Black Island",      comic_type: "bd",     status: "owned",    publisher_id: castermanId, store_id: store1Id, series_id: tintinSeriesId, volume_number: 1, volume_name: "The Black Island",   writer_id: hergeId, artist_id: hergeId, colorist_id: null },
    { id: randomUUID(), title: "Tintin: The Blue Lotus",        comic_type: "bd",     status: "owned",    publisher_id: castermanId, store_id: store1Id, series_id: tintinSeriesId, volume_number: 2, volume_name: "The Blue Lotus",     writer_id: hergeId, artist_id: hergeId, colorist_id: null },
    { id: randomUUID(), title: "Tintin: Destination Moon",      comic_type: "bd",     status: "wishlist", publisher_id: castermanId, store_id: null,     series_id: tintinSeriesId, volume_number: 3, volume_name: "Destination Moon",   writer_id: hergeId, artist_id: hergeId, colorist_id: null },

    // Akira (manga)
    { id: randomUUID(), title: "Akira Vol. 1",                  comic_type: "manga",  status: "owned",    publisher_id: kodanshaId,  store_id: store2Id, series_id: akiraSeriesId,  volume_number: 1, volume_name: null, writer_id: katsuhiroOtomoId, artist_id: katsuhiroOtomoId, colorist_id: null },
    { id: randomUUID(), title: "Akira Vol. 2",                  comic_type: "manga",  status: "owned",    publisher_id: kodanshaId,  store_id: store2Id, series_id: akiraSeriesId,  volume_number: 2, volume_name: null, writer_id: katsuhiroOtomoId, artist_id: katsuhiroOtomoId, colorist_id: null },
    { id: randomUUID(), title: "Akira Vol. 3",                  comic_type: "manga",  status: "wishlist", publisher_id: kodanshaId,  store_id: null,     series_id: akiraSeriesId,  volume_number: 3, volume_name: null, writer_id: katsuhiroOtomoId, artist_id: katsuhiroOtomoId, colorist_id: null },

    // Standalone
    { id: randomUUID(), title: "Watchmen",                      comic_type: "comics", status: "owned",    publisher_id: dcId,     store_id: store1Id, series_id: null, volume_number: null, volume_name: null, writer_id: grantMorrisonId, artist_id: frankMillerId,    colorist_id: null },
    { id: randomUUID(), title: "Maus",                          comic_type: "bd",     status: "owned",    publisher_id: null,     store_id: store1Id, series_id: null, volume_number: null, volume_name: null, writer_id: stanLeeId,       artist_id: jackKirbyId,      colorist_id: null },
    { id: randomUUID(), title: "Spider-Man: Blue",              comic_type: "comics", status: "wishlist", publisher_id: marvelId, store_id: null,     series_id: null, volume_number: null, volume_name: null, writer_id: stanLeeId,       artist_id: jackKirbyId,      colorist_id: null },
  ];

  expoDb.withTransactionSync(() => {
    for (const p of publisherRows) db.insert(publishers).values(p).run();
    for (const s of storeRows) db.insert(stores).values(s).run();
    for (const a of authorRows) db.insert(authors).values(a).run();
    for (const s of seriesRows) db.insert(series).values(s).run();

    for (const c of comicSeeds) {
      const { writer_id, artist_id, colorist_id, ...comicData } = c;
      db.insert(comics).values({
        ...comicData,
        cover_image_local: null,
        cover_image_remote: null,
        created_at: ts,
        updated_at: ts,
        sync_status: "pending",
      }).run();

      const roles = [
        { author_id: writer_id,   role: "writer" },
        { author_id: artist_id,   role: "artist" },
        { author_id: colorist_id, role: "colorist" },
      ].filter((r): r is { author_id: string; role: string } => r.author_id !== null);

      for (const r of roles) {
        db.insert(comicAuthors).values({
          id: randomUUID(),
          comic_id: c.id,
          author_id: r.author_id,
          role: r.role,
          created_at: ts,
          updated_at: ts,
          sync_status: "pending",
        }).run();
      }
    }
  });
}
