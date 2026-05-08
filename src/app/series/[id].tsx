import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import {
  useSeriesDetail,
  useComicsInSeries,
  useUpdateSeries,
  useDeleteSeries,
} from "../../hooks/useSeries";
import { SeriesCoverGrid } from "../../components/SeriesCoverGrid";
import { PickerSheet } from "../../components/PickerSheet";
import { usePublishers } from "../../hooks/usePublishers";
import type { Comic } from "../../types";
import type { SeriesFormData } from "../../types";

const ACCENT = "#6366f1";
const BORDER = "#e5e7eb";
const BG = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const TEXT_MUTED = "#94a3b8";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_GRID_SIZE = Math.min(SCREEN_WIDTH * 0.4, 180);
const VOLUME_COVER_SIZE = 64;

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

function VolumeRow({ comic }: { comic: Comic }) {
  const router = useRouter();
  const volumeLabel =
    comic.volume_name ||
    (comic.volume_number != null ? `Vol. ${comic.volume_number}` : null);

  return (
    <Pressable
      onPress={() => router.push(`/comic/${comic.id}`)}
      style={({ pressed }) => [styles.volumeRow, pressed && styles.volumeRowPressed]}
    >
      {comic.cover_image_local ? (
        <Image
          source={{ uri: comic.cover_image_local }}
          style={styles.volumeCover}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.volumeCoverPlaceholder}>
          <Text style={styles.volumeCoverInitial}>
            {comic.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.volumeInfo}>
        {volumeLabel ? (
          <Text style={styles.volumeLabel}>{volumeLabel}</Text>
        ) : null}
        <Text style={styles.volumeTitle}>{comic.title}</Text>
      </View>
      <Text style={styles.volumeChevron}>›</Text>
    </Pressable>
  );
}

export default function SeriesDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: seriesData, isLoading } = useSeriesDetail(id);
  const { data: volumes } = useComicsInSeries(id);
  const { data: publishersList } = usePublishers();
  const updateSeries = useUpdateSeries();
  const deleteSeries = useDeleteSeries();

  const [title, setTitle] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!seriesData) return;
    setTitle(seriesData.title);
    setPublisherId(seriesData.publisher_id ?? "");
    navigation.setOptions({ title: seriesData.title });
  }, [seriesData, navigation]);

  const buildFormData = useCallback(
    (overrides: Partial<SeriesFormData> = {}): SeriesFormData => ({
      title,
      publisher_id: publisherId || null,
      ...overrides,
    }),
    [title, publisherId]
  );

  const save = useCallback(
    (overrides: Partial<SeriesFormData> = {}) =>
      updateSeries.mutateAsync({ id, data: buildFormData(overrides) }),
    [id, buildFormData, updateSeries]
  );

  const handleDelete = () =>
    Alert.alert(
      "Delete Series",
      `Delete "${seriesData?.title}"? Comics in this series will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => { await deleteSeries.mutateAsync(id); router.back(); },
        },
      ]
    );

  if (isLoading || !seriesData) {
    return <View style={styles.loading}><ActivityIndicator color={ACCENT} /></View>;
  }

  const covers = (volumes ?? [])
    .filter((v) => !!v.cover_image_local)
    .slice(0, 4)
    .map((v) => v.cover_image_local!);

  const publisherName = publishersList?.find((p) => p.id === publisherId)?.name ?? "";
  const publisherOptions = [
    { label: "None", value: "" },
    ...(publishersList?.map((p) => ({ label: p.name, value: p.id })) ?? []),
  ];
  const volumeCount = volumes?.length ?? 0;

  const ratedVolumes = volumes?.filter((v) => v.rating != null) ?? [];
  const averageRating =
    ratedVolumes.length > 0
      ? Math.round((ratedVolumes.reduce((s, v) => s + v.rating!, 0) / ratedVolumes.length) * 10) / 10
      : null;

  const pricedVolumes = volumes?.filter((v) => v.price != null) ?? [];
  const totalPrice =
    pricedVolumes.length > 0
      ? pricedVolumes.reduce((s, v) => s + v.price!, 0)
      : null;

  const pagedVolumes = volumes?.filter((v) => v.page_count != null) ?? [];
  const totalPageCount =
    pagedVolumes.length > 0
      ? pagedVolumes.reduce((s, v) => s + v.page_count!, 0)
      : null;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.coverGridWrapper}>
            <SeriesCoverGrid covers={covers} size={COVER_GRID_SIZE} />
          </View>
          <View style={styles.headerInfo}>
            {editingTitle ? (
              <TextInput
                style={styles.headerTitleInput}
                value={title}
                onChangeText={setTitle}
                onBlur={() => {
                  setEditingTitle(false);
                  save({ title: title.trim() });
                  navigation.setOptions({ title: title.trim() });
                }}
                onSubmitEditing={() => {
                  setEditingTitle(false);
                  save({ title: title.trim() });
                  navigation.setOptions({ title: title.trim() });
                }}
                returnKeyType="done"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Pressable onPress={() => setEditingTitle(true)}>
                <Text style={styles.headerTitle}>{title}</Text>
              </Pressable>
            )}
            <Text style={styles.headerMeta}>
              {volumeCount} {volumeCount === 1 ? "volume" : "volumes"}
            </Text>
          </View>
        </View>

        {/* Details */}
        <SectionHeader title="Details" />
        <View style={styles.card}>
          <DetailRow
            label="Publisher"
            value={publisherName}
            onPress={() => setPickerOpen(true)}
          />
          <DetailRow
            label="Avg. Rating"
            value={averageRating != null ? `${averageRating} / 5` : ""}
          />
          <DetailRow
            label="Total Price"
            value={totalPrice != null ? `€${totalPrice.toFixed(2)}` : ""}
          />
          <DetailRow
            label="Total Pages"
            value={totalPageCount != null ? totalPageCount.toLocaleString() : ""}
            last
          />
        </View>

        {/* Volumes */}
        <View style={styles.volumesSectionHeader}>
          <Text style={styles.volumesSectionLabel}>Volumes</Text>
          <Pressable
            onPress={() => router.push(`/comic/new?seriesId=${id}`)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add Volume</Text>
          </Pressable>
        </View>

        {volumes?.length ? (
          <View style={styles.volumeList}>
            {volumes.map((comic) => (
              <VolumeRow key={comic.id} comic={comic} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyVolumes}>
            <Text style={styles.emptyVolumesText}>
              No volumes yet. Add your first volume.
            </Text>
          </View>
        )}

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Series</Text>
        </Pressable>
      </ScrollView>

      <PickerSheet
        visible={pickerOpen}
        title="Publisher"
        options={publisherOptions}
        value={publisherId}
        onSelect={async (val) => {
          setPublisherId(val);
          setPickerOpen(false);
          await save({ publisher_id: val || null });
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  container: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 48 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  coverGridWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  headerInfo: { flex: 1, gap: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },
  headerTitleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
    paddingBottom: 2,
  },
  headerMeta: { fontSize: 14, color: TEXT_SECONDARY },

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
  rowChevron: { fontSize: 18, color: TEXT_MUTED, marginLeft: 2 },

  volumesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 6,
  },
  volumesSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: ACCENT,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  volumeList: {
    marginHorizontal: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    backgroundColor: CARD_BG,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  volumeRowPressed: { backgroundColor: "#f9fafb" },
  volumeCover: {
    width: VOLUME_COVER_SIZE,
    height: VOLUME_COVER_SIZE,
  },
  volumeCoverPlaceholder: {
    width: VOLUME_COVER_SIZE,
    height: VOLUME_COVER_SIZE,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  volumeCoverInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_MUTED,
  },
  volumeInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  volumeLabel: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: "600",
    marginBottom: 2,
  },
  volumeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  volumeChevron: {
    fontSize: 22,
    color: TEXT_MUTED,
    paddingRight: 12,
  },

  emptyVolumes: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyVolumesText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: "center",
  },

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
  deleteButtonText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
