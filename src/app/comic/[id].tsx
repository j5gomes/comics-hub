import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import {
  useComic,
  useUpdateComic,
  useDeleteComic,
} from "../../hooks/useComics";
import { useComicAuthors, useAuthors } from "../../hooks/useAuthors";
import { usePublishers } from "../../hooks/usePublishers";
import { useStores } from "../../hooks/useStores";
import { useSeriesList } from "../../hooks/useSeries";
import { useImagePicker } from "../../hooks/useImagePicker";
import { processAndStoreImage } from "../../lib/images";
import { showPhotoSourcePicker } from "../../lib/photoSource";
import { AuthorPickerModal } from "../../components/AuthorPickerModal";
import { PickerSheet, type PickerOption } from "../../components/PickerSheet";
import { DatePickerSheet } from "../../components/DatePickerSheet";
import { ExternalLink } from "lucide-react-native";
import {
  COMIC_TYPES,
  COMIC_TYPE_LABELS,
  BINDING_TYPES,
  BINDING_TYPE_LABELS,
  MONTH_OPTIONS,
} from "../../lib/constants";
import type { ComicFormData } from "../../types";
import type { AuthorRole } from "../../lib/constants";

// ─── constants ────────────────────────────────────────────────────────────────

const ACCENT = "#6366f1";
const BORDER = "#e5e7eb";
const BG = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const TEXT_MUTED = "#94a3b8";
const COVER_WIDTH = 110;
const COVER_HEIGHT = COVER_WIDTH * (3 / 2);

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatMonthYear(value: string): string {
  const [y, m] = value.split("-");
  return `${MONTH_OPTIONS.find((mo) => mo.value === m)?.label ?? m} ${y}`;
}

function formatFullDate(value: string): string {
  const [y, m, d] = value.split("-");
  const mon =
    MONTH_OPTIONS.find((mo) => mo.value === m)?.label?.slice(0, 3) ?? m;
  return `${parseInt(d)} ${mon} ${y}`;
}

// ─── fullscreen viewer ────────────────────────────────────────────────────────

function FullscreenViewer({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={viewer.container}>
        <StatusBar hidden />
        <Image
          source={{ uri }}
          style={viewer.image}
          contentFit="contain"
          transition={150}
        />
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            viewer.closeBtn,
            pressed && viewer.closeBtnPressed,
          ]}
          hitSlop={12}
        >
          <Text style={viewer.closeIcon}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const viewer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  closeIcon: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

// ─── row components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DetailRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, !value && styles.rowValueEmpty]}>
          {value || "—"}
        </Text>
        {onPress && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </Pressable>
  );
}

function InlineTextRow({
  label,
  value,
  onChange,
  onSave,
  last,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  last?: boolean;
  numeric?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <View style={[styles.row, styles.rowEditing, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        ref={ref}
        style={styles.inlineInput}
        value={value}
        onChangeText={onChange}
        onBlur={onSave}
        onSubmitEditing={onSave}
        returnKeyType="done"
        keyboardType={numeric ? "numeric" : "default"}
        selectTextOnFocus
      />
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

type EditingField =
  | "title"
  | "volume_number"
  | "volume_name"
  | "price"
  | "page_count"
  | "notes"
  | null;
type ActivePicker = {
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
};

export default function ComicDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: comic, isLoading } = useComic(id);
  const { data: comicAuthorRows } = useComicAuthors(id);
  const { data: publishersList } = usePublishers();
  const { data: storesList } = useStores();
  const { data: seriesList } = useSeriesList();
  const { data: authorsList } = useAuthors();
  const updateComic = useUpdateComic();
  const deleteComic = useDeleteComic();
  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker();

  const [title, setTitle] = useState("");
  const [comicType, setComicType] = useState("comics");
  const [status, setStatus] = useState("owned");
  const [publisherId, setPublisherId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [volumeName, setVolumeName] = useState("");
  const [writerId, setWriterId] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [coloristId, setColoristId] = useState<string | null>(null);

  // New detail fields
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [binding, setBinding] = useState("");
  const [boughtAt, setBoughtAt] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState("");
  const [notes, setNotes] = useState("");
  const [showPublishedPicker, setShowPublishedPicker] = useState(false);
  const [showBoughtAtPicker, setShowBoughtAtPicker] = useState(false);

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [authorPickerRole, setAuthorPickerRole] = useState<AuthorRole | null>(
    null,
  );
  const [fullscreen, setFullscreen] = useState(false);

  // ── init ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!comic) return;
    setTitle(comic.title);
    setComicType(comic.comic_type);
    setStatus(comic.status);
    setPublisherId(comic.publisher_id ?? "");
    setStoreId(comic.store_id ?? "");
    setSeriesId(comic.series_id ?? "");
    setVolumeNumber(
      comic.volume_number != null ? String(comic.volume_number) : "",
    );
    setVolumeName(comic.volume_name ?? "");
    setImageUri(comic.cover_image_local ?? null);
    setPublishedAt(comic.published_at ?? null);
    setPrice(comic.price != null ? String(comic.price) : "");
    setRating(comic.rating ?? null);
    setBinding(comic.binding ?? "");
    setBoughtAt(comic.bought_at ?? null);
    setPageCount(comic.page_count != null ? String(comic.page_count) : "");
    setNotes(comic.notes ?? "");
    navigation.setOptions({ title: comic.title });
  }, [comic]);

  useEffect(() => {
    if (!comicAuthorRows) return;
    for (const row of comicAuthorRows) {
      if (row.role === "writer") setWriterId(row.author_id);
      else if (row.role === "artist") setArtistId(row.author_id);
      else if (row.role === "colorist") setColoristId(row.author_id);
    }
  }, [comicAuthorRows]);

  // ── save ──────────────────────────────────────────────────────────────────────

  const buildFormData = useCallback(
    (overrides: Partial<ComicFormData> = {}): ComicFormData =>
      ({
        title,
        comic_type: comicType,
        status,
        publisher_id: publisherId || null,
        store_id: storeId || null,
        cover_image_local: imageUri,
        series_id: seriesId || null,
        volume_number: volumeNumber.trim() ? parseInt(volumeNumber, 10) : null,
        volume_name: volumeName.trim() || null,
        writer_id: writerId,
        artist_id: artistId,
        colorist_id: coloristId,
        published_at: publishedAt,
        price: price.trim() ? parseFloat(price) : null,
        rating,
        notes: notes.trim() || null,
        binding: binding || null,
        bought_at: boughtAt,
        page_count: pageCount.trim() ? parseInt(pageCount, 10) : null,
        ...overrides,
      }) as ComicFormData,
    [
      title,
      comicType,
      status,
      publisherId,
      storeId,
      imageUri,
      seriesId,
      volumeNumber,
      volumeName,
      writerId,
      artistId,
      coloristId,
      publishedAt,
      price,
      rating,
      notes,
      binding,
      boughtAt,
      pageCount,
    ],
  );

  const save = useCallback(
    (overrides: Partial<ComicFormData> = {}) =>
      updateComic.mutateAsync({ id, data: buildFormData(overrides) }),
    [id, buildFormData, updateComic],
  );

  // ── cover ─────────────────────────────────────────────────────────────────────

  const handleChangeCover = () =>
    showPhotoSourcePicker(!!imageUri, async (source) => {
      if (source === "gallery") await pickFromGallery();
      else if (source === "camera") await pickFromCamera();
      else if (source === "remove") {
        clearImage();
        await save({ cover_image_local: null });
      }
    });

  const prevImageUri = useRef<string | null>(null);
  useEffect(() => {
    if (!imageUri || imageUri === prevImageUri.current) return;
    prevImageUri.current = imageUri;
    if (imageUri.includes("covers/")) return;
    (async () => {
      const processed = await processAndStoreImage(imageUri, id);
      setImageUri(processed);
      await save({ cover_image_local: processed });
    })();
  }, [imageUri]);

  // ── pickers ───────────────────────────────────────────────────────────────────

  const openPicker = (
    title: string,
    options: PickerOption[],
    value: string,
    onSelect: (v: string) => Promise<void>,
  ) => setActivePicker({ title, options, value, onSelect });

  const handlePickType = () =>
    openPicker(
      "Type",
      COMIC_TYPES.map((t) => ({ label: COMIC_TYPE_LABELS[t], value: t })),
      comicType,
      async (val) => {
        setComicType(val);
        await save({ comic_type: val });
      },
    );

  const handlePickPublisher = () =>
    openPicker(
      "Publisher",
      [
        { label: "None", value: "" },
        ...(publishersList?.map((p) => ({ label: p.name, value: p.id })) ?? []),
      ],
      publisherId,
      async (val) => {
        setPublisherId(val);
        await save({ publisher_id: val || null });
      },
    );

  const handlePickStore = () =>
    openPicker(
      "Store",
      [
        { label: "None", value: "" },
        ...(storesList?.map((s) => ({ label: s.name, value: s.id })) ?? []),
      ],
      storeId,
      async (val) => {
        setStoreId(val);
        await save({ store_id: val || null });
      },
    );

  const handlePickSeries = () =>
    openPicker(
      "Series",
      [
        { label: "None", value: "" },
        ...(seriesList?.map((s) => ({ label: s.title, value: s.id })) ?? []),
      ],
      seriesId,
      async (val) => {
        setSeriesId(val);
        await save({ series_id: val || null });
      },
    );

  const handlePickBinding = () =>
    openPicker(
      "Binding",
      [
        { label: "None", value: "" },
        ...BINDING_TYPES.map((b) => ({
          label: BINDING_TYPE_LABELS[b],
          value: b,
        })),
      ],
      binding,
      async (val) => {
        setBinding(val);
        await save({ binding: val || null });
      },
    );

  const handleAuthorSelected = async (authorId: string) => {
    const role = authorPickerRole;
    setAuthorPickerRole(null);
    if (!role) return;
    const overrides: Partial<ComicFormData> = {};
    if (role === "writer") {
      setWriterId(authorId);
      overrides.writer_id = authorId;
    } else if (role === "artist") {
      setArtistId(authorId);
      overrides.artist_id = authorId;
    } else if (role === "colorist") {
      setColoristId(authorId);
      overrides.colorist_id = authorId;
    }
    await save(overrides);
  };

  const handleStatusChange = async (s: string) => {
    setStatus(s);
    await save({ status: s });
  };

  const handleDelete = () =>
    Alert.alert(
      "Delete Comic",
      `Delete "${comic?.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteComic.mutateAsync(id);
            router.back();
          },
        },
      ],
    );

  // ── render ────────────────────────────────────────────────────────────────────

  if (isLoading || !comic) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  const publisherName =
    publishersList?.find((p) => p.id === publisherId)?.name ?? "";
  const storeName = storesList?.find((s) => s.id === storeId)?.name ?? "";
  const seriesName = seriesList?.find((s) => s.id === seriesId)?.title ?? "";
  const writerName = authorsList?.find((a) => a.id === writerId)?.name ?? "";
  const artistName = authorsList?.find((a) => a.id === artistId)?.name ?? "";
  const coloristName =
    authorsList?.find((a) => a.id === coloristId)?.name ?? "";
  const typeLabel =
    COMIC_TYPE_LABELS[comicType as keyof typeof COMIC_TYPE_LABELS] ?? comicType;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Cover — tap = fullscreen */}
          <View style={styles.coverWrapper}>
            <Pressable
              onPress={() => imageUri && setFullscreen(true)}
              style={styles.coverPressable}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverInitial}>
                    {title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Edit badge on cover */}
            <Pressable
              onPress={handleChangeCover}
              style={styles.coverEditBtn}
              hitSlop={6}
            >
              <Text style={styles.coverEditIcon}>✎</Text>
            </Pressable>
          </View>

          {/* Info column */}
          <View style={styles.headerInfo}>
            {/* Title — tap to edit inline */}
            {editingField === "title" ? (
              <TextInput
                style={styles.headerTitleInput}
                value={title}
                onChangeText={setTitle}
                onBlur={() => {
                  setEditingField(null);
                  save({ title: title.trim() });
                }}
                onSubmitEditing={() => {
                  setEditingField(null);
                  save({ title: title.trim() });
                }}
                returnKeyType="done"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Pressable onPress={() => setEditingField("title")}>
                <Text style={styles.headerTitle} numberOfLines={3}>
                  {title}
                </Text>
              </Pressable>
            )}

            {/* Type · Publisher */}
            <Text style={styles.headerMeta} numberOfLines={1}>
              {typeLabel}
              {publisherName ? ` · ${publisherName}` : ""}
            </Text>

            {/* Status pills */}
            <View style={styles.statusRow}>
              {["owned", "wishlist"].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => handleStatusChange(s)}
                  style={[
                    styles.statusPill,
                    status === s && styles.statusPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      status === s && styles.statusPillTextActive,
                    ]}
                  >
                    {s === "owned" ? "Owned" : "Wishlist"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ── Details ── */}
        <SectionHeader title="Details" />
        <View style={styles.card}>
          <DetailRow label="Type" value={typeLabel} onPress={handlePickType} />
          <DetailRow
            label="Publisher"
            value={publisherName}
            onPress={handlePickPublisher}
          />
          <DetailRow
            label="Store"
            value={storeName}
            onPress={handlePickStore}
          />
          <DetailRow
            label="Published"
            value={publishedAt ? formatMonthYear(publishedAt) : ""}
            onPress={() => setShowPublishedPicker(true)}
          />
          <DetailRow
            label="Binding"
            value={
              binding
                ? (BINDING_TYPE_LABELS[
                    binding as keyof typeof BINDING_TYPE_LABELS
                  ] ?? "")
                : ""
            }
            onPress={handlePickBinding}
          />
          {editingField === "page_count" ? (
            <InlineTextRow
              label="Pages"
              value={pageCount}
              onChange={setPageCount}
              onSave={() => {
                setEditingField(null);
                save({
                  page_count: pageCount.trim() ? parseInt(pageCount, 10) : null,
                });
              }}
              numeric
            />
          ) : (
            <DetailRow
              label="Pages"
              value={pageCount ? `${pageCount} pages` : ""}
              onPress={() => setEditingField("page_count")}
            />
          )}
          {editingField === "price" ? (
            <InlineTextRow
              label="Price"
              value={price}
              onChange={setPrice}
              onSave={() => {
                setEditingField(null);
                save({ price: price.trim() ? parseFloat(price) : null });
              }}
              numeric
            />
          ) : (
            <DetailRow
              label="Price"
              value={price ? `€${parseFloat(price).toFixed(2)}` : ""}
              onPress={() => setEditingField("price")}
            />
          )}
          <DetailRow
            label="Bought At"
            value={boughtAt ? formatFullDate(boughtAt) : ""}
            onPress={() => setShowBoughtAtPicker(true)}
          />

          {/* Rating */}
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  hitSlop={4}
                  onPress={async () => {
                    const next = rating === star ? null : star;
                    setRating(next);
                    await save({ rating: next });
                  }}
                >
                  <Text
                    style={[
                      styles.star,
                      rating != null && star <= rating && styles.starFilled,
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Notes */}
        <SectionHeader title="Notes" />
        <View style={styles.card}>
          <View style={[styles.row, styles.rowLast]}>
            {editingField === "notes" ? (
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                onBlur={() => {
                  setEditingField(null);
                  save({ notes: notes.trim() || null });
                }}
                placeholder="Add notes…"
                placeholderTextColor={TEXT_MUTED}
                multiline
                autoFocus
                textAlignVertical="top"
              />
            ) : (
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setEditingField("notes")}
              >
                <Text style={[styles.rowValue, !notes && styles.rowValueEmpty]}>
                  {notes || "Tap to add notes…"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Series ── */}
        <SectionHeader title="Series" />
        <View style={styles.card}>
          <DetailRow
            label="Series"
            value={seriesName}
            onPress={handlePickSeries}
          />
          {seriesId ? (
            <>
              {editingField === "volume_number" ? (
                <InlineTextRow
                  label="Volume №"
                  value={volumeNumber}
                  onChange={setVolumeNumber}
                  onSave={() => {
                    setEditingField(null);
                    save({
                      volume_number: volumeNumber.trim()
                        ? parseInt(volumeNumber, 10)
                        : null,
                    });
                  }}
                  numeric
                />
              ) : (
                <DetailRow
                  label="Volume №"
                  value={volumeNumber}
                  onPress={() => setEditingField("volume_number")}
                />
              )}
              {editingField === "volume_name" ? (
                <InlineTextRow
                  label="Volume Name"
                  value={volumeName}
                  onChange={setVolumeName}
                  onSave={() => {
                    setEditingField(null);
                    save({ volume_name: volumeName.trim() || null });
                  }}
                />
              ) : (
                <DetailRow
                  label="Volume Name"
                  value={volumeName}
                  onPress={() => setEditingField("volume_name")}
                />
              )}
              <View style={[styles.row, styles.rowLast]}>
                <Pressable
                  onPress={() => router.push(`/series/${seriesId}`)}
                  style={({ pressed }) => [
                    styles.seriesLink,
                    pressed && styles.seriesLinkPressed,
                  ]}
                >
                  <ExternalLink size={14} color={ACCENT} strokeWidth={2.5} />
                  <Text style={styles.seriesLinkText}>{seriesName}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <DetailRow label="Volume" value="No series assigned" last />
          )}
        </View>

        {/* ── Authors ── */}
        <SectionHeader title="Authors" />
        <View style={styles.card}>
          <DetailRow
            label="Writer"
            value={writerName}
            onPress={() => setAuthorPickerRole("writer")}
          />
          <DetailRow
            label="Artist"
            value={artistName}
            onPress={() => setAuthorPickerRole("artist")}
          />
          <DetailRow
            label="Colorist"
            value={coloristName}
            onPress={() => setAuthorPickerRole("colorist")}
            last
          />
        </View>

        {/* ── Delete ── */}
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Comic</Text>
        </Pressable>
      </ScrollView>

      {/* Fullscreen viewer */}
      {fullscreen && imageUri && (
        <FullscreenViewer uri={imageUri} onClose={() => setFullscreen(false)} />
      )}

      {/* Picker sheet */}
      <PickerSheet
        visible={activePicker !== null}
        title={activePicker?.title ?? ""}
        options={activePicker?.options ?? []}
        value={activePicker?.value ?? ""}
        onSelect={(val) => activePicker?.onSelect(val)}
        onClose={() => setActivePicker(null)}
      />

      {/* Author picker */}
      <AuthorPickerModal
        visible={authorPickerRole !== null}
        role={authorPickerRole ?? "writer"}
        onSelect={handleAuthorSelected}
        onClose={() => setAuthorPickerRole(null)}
      />

      {/* Date pickers */}
      <DatePickerSheet
        visible={showPublishedPicker}
        title="Published"
        mode="month-year"
        value={publishedAt}
        onDone={async (val) => {
          setPublishedAt(val);
          await save({ published_at: val });
        }}
        onClear={async () => {
          setPublishedAt(null);
          await save({ published_at: null });
        }}
        onClose={() => setShowPublishedPicker(false)}
      />
      <DatePickerSheet
        visible={showBoughtAtPicker}
        title="Bought At"
        mode="date"
        value={boughtAt}
        onDone={async (val) => {
          setBoughtAt(val);
          await save({ bought_at: val });
        }}
        onClear={async () => {
          setBoughtAt(null);
          await save({ bought_at: null });
        }}
        onClose={() => setShowBoughtAtPicker(false)}
      />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 48,
  },

  // Header
  header: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  coverWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  coverPressable: {
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cover: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  coverInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: TEXT_MUTED,
  },
  coverEditBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  coverEditIcon: {
    color: "#fff",
    fontSize: 13,
  },

  // Info column
  headerInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 4,
  },
  headerTitleInput: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
    paddingBottom: 2,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: BG,
  },
  statusPillActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  statusPillTextActive: {
    color: "#ffffff",
  },

  // Section
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 6,
  },

  // Card / rows
  card: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 50,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: "#f9fafb" },
  rowEditing: { paddingVertical: 8 },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_SECONDARY,
    width: 112,
    flexShrink: 0,
  },
  rowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_PRIMARY,
    textAlign: "right",
    flexShrink: 1,
  },
  rowValueEmpty: { color: TEXT_MUTED },
  rowChevron: {
    fontSize: 18,
    color: TEXT_MUTED,
    marginLeft: 2,
  },
  inlineInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_PRIMARY,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
  },

  // Series link
  seriesLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: "auto",
  },
  seriesLinkPressed: {
    backgroundColor: "#ede9fe",
  },
  seriesLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: ACCENT,
  },

  // Stars
  starsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  star: {
    fontSize: 26,
    color: "#d1d5db",
  },
  starFilled: {
    color: "#f59e0b",
  },

  // Notes multiline input
  notesInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    minHeight: 80,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlignVertical: "top",
  },

  // Delete
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    alignItems: "center",
    backgroundColor: "#fff5f5",
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
});
