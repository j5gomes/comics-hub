export const COMIC_TYPES = ["bd", "comics", "manga"] as const;
export type ComicType = (typeof COMIC_TYPES)[number];

export const COMIC_TYPE_LABELS: Record<ComicType, string> = {
  bd: "BD",
  comics: "Comics",
  manga: "Manga",
};

export const COMIC_STATUSES = ["owned", "wishlist"] as const;
export type ComicStatus = (typeof COMIC_STATUSES)[number];

export const STORE_TYPES = ["physical", "online", "convention"] as const;
export type StoreType = (typeof STORE_TYPES)[number];

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  physical: "Physical",
  online: "Online",
  convention: "Convention",
};

export const LANGUAGES = ["PT", "EN", "FR", "JP", "ES", "DE", "IT"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  PT: "Portuguese",
  EN: "English",
  FR: "French",
  JP: "Japanese",
  ES: "Spanish",
  DE: "German",
  IT: "Italian",
};

export const AUTHOR_ROLES = ["writer", "artist", "colorist"] as const;
export type AuthorRole = (typeof AUTHOR_ROLES)[number];

export const AUTHOR_ROLE_LABELS: Record<AuthorRole, string> = {
  writer: "Writer",
  artist: "Artist",
  colorist: "Colorist",
};

export const SYNC_STATUS = ["pending", "synced"] as const;
export type SyncStatus = (typeof SYNC_STATUS)[number];

export const FILTER_OPTIONS = ["all", ...COMIC_TYPES] as const;
export type FilterOption = (typeof FILTER_OPTIONS)[number];

export const BINDING_TYPES = ["hardcover", "paperback"] as const;
export type BindingType = (typeof BINDING_TYPES)[number];

export const BINDING_TYPE_LABELS: Record<BindingType, string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
};

export const MONTH_OPTIONS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
] as const;
