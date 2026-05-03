import { useState, useEffect } from "react";
import { View, ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Input, Select, Button } from "./ui";
import { ImagePickerButton } from "./ImagePickerButton";
import { AuthorPickerModal } from "./AuthorPickerModal";
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
});
