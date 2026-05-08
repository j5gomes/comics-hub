import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  publishers,
  stores,
  series,
  comics,
  authors,
  comicAuthors,
  syncOutbox,
  syncMeta,
} from "../../db/schema";

export type Publisher = InferSelectModel<typeof publishers>;
export type NewPublisher = InferInsertModel<typeof publishers>;

export type Series = InferSelectModel<typeof series>;
export type NewSeries = InferInsertModel<typeof series>;

export type Store = InferSelectModel<typeof stores>;
export type NewStore = InferInsertModel<typeof stores>;

export type Comic = InferSelectModel<typeof comics>;
export type NewComic = InferInsertModel<typeof comics>;

export type Author = InferSelectModel<typeof authors>;
export type NewAuthor = InferInsertModel<typeof authors>;

export type ComicAuthor = InferSelectModel<typeof comicAuthors>;
export type NewComicAuthor = InferInsertModel<typeof comicAuthors>;

export type SyncOutboxEntry = InferSelectModel<typeof syncOutbox>;
export type NewSyncOutboxEntry = InferInsertModel<typeof syncOutbox>;

export type SyncMetaEntry = InferSelectModel<typeof syncMeta>;

export type SeriesFormData = {
  title: string;
  publisher_id: string | null;
};

export type PublisherFormData = {
  name: string;
  languages: string[];
  comic_types: string[];
  logo_local: string | null;
};

export type StoreFormData = {
  name: string;
  location: string;
  store_type: string;
};

export type AuthorFormData = {
  name: string;
  roles: string[];
  photo_local: string | null;
};

export type ComicFormData = {
  title: string;
  comic_type: string;
  status: string;
  publisher_id: string | null;
  store_id: string | null;
  cover_image_local: string | null;
  writer_id: string | null;
  artist_id: string | null;
  colorist_id: string | null;
  series_id: string | null;
  volume_number: number | null;
  volume_name: string | null;
  published_at: string | null;
  price: number | null;
  rating: number | null;
  notes: string | null;
  binding: string | null;
  bought_at: string | null;
  page_count: number | null;
};
