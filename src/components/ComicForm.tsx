import { useState, useEffect } from "react";
import { View, ScrollView, Pressable, Text, TextInput, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Input, Select, Button } from "./ui";
import { ImagePickerButton } from "./ImagePickerButton";
import { AuthorPickerModal } from "./AuthorPickerModal";
import { DatePickerSheet } from "./DatePickerSheet";
import { useImagePicker } from "../hooks/useImagePicker";
import { usePublishers } from "../hooks/usePublishers";
import { useStores } from "../hooks/useStores";
import { useAuthors, useComicAuthors } from "../hooks/useAuthors";
import { useSeriesList } from "../hooks/useSeries";
import {
  COMIC_TYPES,
  COMIC_TYPE_LABELS,
  COMIC_STATUSES,
  AUTHOR_ROLES,
  AUTHOR_ROLE_LABELS,
  BINDING_TYPES,
  BINDING_TYPE_LABELS,
  MONTH_OPTIONS,
} from "../lib/constants";
import type { AuthorRole } from "../lib/constants";
import type { ComicFormData, Comic } from "../types";

type Props = {
  initialData?: Comic | null;
  onSubmit: (data: ComicFormData) => void;
  isLoading: boolean;
  footer?: React.ReactNode;
  defaultSeriesId?: string;
};

function formatMonthYear(value: string): string {
  const [y, m] = value.split("-");
  const monthLabel = MONTH_OPTIONS.find((mo) => mo.value === m)?.label;
  return monthLabel ? `${monthLabel} ${y}` : value;
}

function formatFullDate(value: string): string {
  const [y, m, d] = value.split("-");
  const monthLabel = MONTH_OPTIONS.find((mo) => mo.value === m)?.label;
  return monthLabel ? `${parseInt(d)} ${monthLabel} ${y}` : value;
}

export function ComicForm({ initialData, onSubmit, isLoading, footer, defaultSeriesId }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [comicType, setComicType] = useState(
    initialData?.comic_type ?? "comics"
  );
  const [status, setStatus] = useState(initialData?.status ?? "owned");
  const [publisherId, setPublisherId] = useState(
    initialData?.publisher_id ?? ""
  );
  const [storeId, setStoreId] = useState(initialData?.store_id ?? "");
  const [seriesId, setSeriesId] = useState(
    initialData?.series_id ?? defaultSeriesId ?? ""
  );
  const [volumeNumber, setVolumeNumber] = useState(
    initialData?.volume_number != null ? String(initialData.volume_number) : ""
  );
  const [volumeName, setVolumeName] = useState(initialData?.volume_name ?? "");
  const [publishedAt, setPublishedAt] = useState<string | null>(initialData?.published_at ?? null);
  const [showPublishedPicker, setShowPublishedPicker] = useState(false);
  const [price, setPrice] = useState(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [binding, setBinding] = useState(initialData?.binding ?? "");
  const [boughtAt, setBoughtAt] = useState<string | null>(initialData?.bought_at ?? null);
  const [showBoughtAtPicker, setShowBoughtAtPicker] = useState(false);
  const [pageCount, setPageCount] = useState(
    initialData?.page_count != null ? String(initialData.page_count) : ""
  );

  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker();

  // Set initial image if editing
  useState(() => {
    if (initialData?.cover_image_local) {
      setImageUri(initialData.cover_image_local);
    }
  });

  const { data: publishersList } = usePublishers();
  const { data: storesList } = useStores();
  const { data: authorsList } = useAuthors();
  const { data: seriesList } = useSeriesList();

  // Author state — one per role
  const [writerId, setWriterId] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [coloristId, setColoristId] = useState<string | null>(null);
  const [pickerRole, setPickerRole] = useState<AuthorRole | null>(null);

  // Load existing comic_authors when editing
  const { data: existingComicAuthors } = useComicAuthors(
    initialData?.id ?? ""
  );

  useEffect(() => {
    if (existingComicAuthors && existingComicAuthors.length > 0) {
      for (const ca of existingComicAuthors) {
        if (ca.role === "writer") setWriterId(ca.author_id);
        else if (ca.role === "artist") setArtistId(ca.author_id);
        else if (ca.role === "colorist") setColoristId(ca.author_id);
      }
    }
  }, [existingComicAuthors]);

  const publisherOptions = [
    { label: "None", value: "" },
    ...(publishersList?.map((p) => ({ label: p.name, value: p.id })) ?? []),
  ];

  const storeOptions = [
    { label: "None", value: "" },
    ...(storesList?.map((s) => ({ label: s.name, value: s.id })) ?? []),
  ];

  const seriesOptions = [
    { label: "None", value: "" },
    ...(seriesList?.map((s) => ({ label: s.title, value: s.id })) ?? []),
  ];

  const getAuthorIdForRole = (role: AuthorRole): string | null => {
    if (role === "writer") return writerId;
    if (role === "artist") return artistId;
    return coloristId;
  };

  const setAuthorIdForRole = (role: AuthorRole, authorId: string | null) => {
    if (role === "writer") setWriterId(authorId);
    else if (role === "artist") setArtistId(authorId);
    else setColoristId(authorId);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const parsedVolumeNumber = volumeNumber.trim()
      ? parseInt(volumeNumber.trim(), 10)
      : null;
    const parsedPrice = price.trim() ? parseFloat(price.trim()) : null;
    const parsedPageCount = pageCount.trim() ? parseInt(pageCount.trim(), 10) : null;
    onSubmit({
      title: title.trim(),
      comic_type: comicType,
      status,
      publisher_id: publisherId || null,
      store_id: storeId || null,
      cover_image_local: imageUri,
      writer_id: writerId,
      artist_id: artistId,
      colorist_id: coloristId,
      series_id: seriesId || null,
      volume_number: Number.isNaN(parsedVolumeNumber) ? null : parsedVolumeNumber,
      volume_name: volumeName.trim() || null,
      published_at: publishedAt,
      price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
      rating,
      notes: notes.trim() || null,
      binding: binding || null,
      bought_at: boughtAt,
      page_count: parsedPageCount != null && !Number.isNaN(parsedPageCount) ? parsedPageCount : null,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ImagePickerButton
        imageUri={imageUri}
        onPickFromGallery={pickFromGallery}
        onPickFromCamera={pickFromCamera}
        onClear={clearImage}
      />

      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Comic title"
      />

      <Select
        label="Type"
        options={COMIC_TYPES.map((t) => ({
          label: COMIC_TYPE_LABELS[t],
          value: t,
        }))}
        value={comicType}
        onChange={setComicType}
      />

      <Select
        label="Status"
        options={COMIC_STATUSES.map((s) => ({
          label: s === "owned" ? "Owned" : "Wishlist",
          value: s,
        }))}
        value={status}
        onChange={setStatus}
      />

      <Select
        label="Publisher"
        options={publisherOptions}
        value={publisherId}
        onChange={setPublisherId}
      />

      {status === "owned" && (
        <Select
          label="Store"
          options={storeOptions}
          value={storeId}
          onChange={setStoreId}
        />
      )}

      <Select
        label="Series"
        options={seriesOptions}
        value={seriesId}
        onChange={setSeriesId}
      />

      {seriesId ? (
        <>
          <Input
            label="Volume Number"
            value={volumeNumber}
            onChangeText={setVolumeNumber}
            placeholder="e.g. 1"
            keyboardType="numeric"
          />
          <Input
            label="Volume Name"
            value={volumeName}
            onChangeText={setVolumeName}
            placeholder="e.g. The Beginning (optional)"
          />
        </>
      ) : null}

      {/* Authors Section */}
      <Text style={styles.sectionLabel}>Authors</Text>

      {AUTHOR_ROLES.map((role) => {
        const authorId = getAuthorIdForRole(role);
        const author = authorId
          ? authorsList?.find((a) => a.id === authorId)
          : null;

        return (
          <Pressable
            key={role}
            onPress={() => setPickerRole(role)}
            style={styles.roleCard}
          >
            <View style={styles.roleCardLeft}>
              {author?.photo_local ? (
                <Image
                  source={{ uri: author.photo_local }}
                  style={styles.authorThumb}
                />
              ) : (
                <View style={styles.authorThumbPlaceholder}>
                  <Text style={styles.authorThumbInitial}>
                    {author ? author.name.charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.roleLabel}>
                  {AUTHOR_ROLE_LABELS[role]}
                </Text>
                <Text
                  style={[
                    styles.authorName,
                    !author && styles.authorNameEmpty,
                  ]}
                >
                  {author ? author.name : "Tap to select..."}
                </Text>
              </View>
            </View>
            {author && (
              <Pressable
                onPress={() => setAuthorIdForRole(role, null)}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}

      <AuthorPickerModal
        visible={pickerRole !== null}
        role={pickerRole ?? "writer"}
        onSelect={(authorId) => {
          if (pickerRole) {
            setAuthorIdForRole(pickerRole, authorId);
          }
          setPickerRole(null);
        }}
        onClose={() => setPickerRole(null)}
      />

      {/* Details Section */}
      <Text style={styles.sectionLabel}>Details</Text>

      <View style={styles.dateFieldContainer}>
        <Text style={styles.dateFieldLabel}>Published</Text>
        <Pressable
          style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
          onPress={() => setShowPublishedPicker(true)}
        >
          <Text style={[styles.dateFieldValue, !publishedAt && styles.dateFieldPlaceholder]}>
            {publishedAt ? formatMonthYear(publishedAt) : "Select month & year…"}
          </Text>
          <Text style={styles.dateFieldChevron}>›</Text>
        </Pressable>
      </View>

      <DatePickerSheet
        visible={showPublishedPicker}
        title="Published"
        mode="month-year"
        value={publishedAt}
        onDone={setPublishedAt}
        onClear={() => setPublishedAt(null)}
        onClose={() => setShowPublishedPicker(false)}
      />

      <Select
        label="Binding"
        options={[
          { label: "None", value: "" },
          ...BINDING_TYPES.map((b) => ({ label: BINDING_TYPE_LABELS[b], value: b })),
        ]}
        value={binding}
        onChange={setBinding}
      />

      <Input
        label="Number of Pages"
        value={pageCount}
        onChangeText={setPageCount}
        placeholder="e.g. 128"
        keyboardType="numeric"
      />

      <Input
        label="Price (€)"
        value={price}
        onChangeText={setPrice}
        placeholder="e.g. 14.99"
        keyboardType="decimal-pad"
      />

      <View style={styles.dateFieldContainer}>
        <Text style={styles.dateFieldLabel}>Bought At</Text>
        <Pressable
          style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
          onPress={() => setShowBoughtAtPicker(true)}
        >
          <Text style={[styles.dateFieldValue, !boughtAt && styles.dateFieldPlaceholder]}>
            {boughtAt ? formatFullDate(boughtAt) : "Select date…"}
          </Text>
          <Text style={styles.dateFieldChevron}>›</Text>
        </Pressable>
      </View>

      <DatePickerSheet
        visible={showBoughtAtPicker}
        title="Bought At"
        mode="date"
        value={boughtAt}
        onDone={setBoughtAt}
        onClear={() => setBoughtAt(null)}
        onClose={() => setShowBoughtAtPicker(false)}
      />

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(rating === star ? null : star)}
              hitSlop={4}
            >
              <Text style={[styles.star, rating != null && star <= rating && styles.starFilled]}>
                ★
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Button
        title={initialData ? "Save Changes" : "Add Comic"}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!title.trim()}
        style={styles.submitButton}
      />
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 8,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  roleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  authorThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorThumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  authorThumbInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  roleLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 1,
  },
  authorNameEmpty: {
    color: "#94a3b8",
    fontWeight: "400",
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 16,
  },
  dateFieldContainer: {
    marginBottom: 16,
  },
  dateFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    minHeight: 48,
  },
  dateFieldPressed: {
    backgroundColor: "#f9fafb",
  },
  dateFieldValue: {
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
  },
  dateFieldPlaceholder: {
    color: "#94a3b8",
  },
  dateFieldChevron: {
    fontSize: 20,
    color: "#94a3b8",
    marginLeft: 8,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 6,
  },
  star: {
    fontSize: 32,
    color: "#d1d5db",
  },
  starFilled: {
    color: "#f59e0b",
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    minHeight: 120,
  },
});
