import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { Image } from "expo-image";
import {
  useSeriesDetail,
  useComicsInSeries,
  useUpdateSeries,
  useDeleteSeries,
} from "../../hooks/useSeries";
import { SeriesCoverGrid } from "../../components/SeriesCoverGrid";
import { Input, Select, Button } from "../../components/ui";
import { usePublishers } from "../../hooks/usePublishers";
import type { Comic } from "../../types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_GRID_SIZE = Math.min(SCREEN_WIDTH * 0.4, 180);
const VOLUME_COVER_SIZE = 64;

function VolumeRow({ comic }: { comic: Comic }) {
  const router = useRouter();
  const volumeLabel =
    comic.volume_name ||
    (comic.volume_number != null ? `Vol. ${comic.volume_number}` : null);

  return (
    <Pressable
      onPress={() => router.push(`/comic/${comic.id}`)}
      style={styles.volumeRow}
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

  useEffect(() => {
    if (seriesData) {
      setTitle(seriesData.title);
      setPublisherId(seriesData.publisher_id ?? "");
      navigation.setOptions({ title: seriesData.title });
    }
  }, [seriesData, navigation]);

  const covers = (volumes ?? [])
    .filter((v) => !!v.cover_image_local)
    .slice(0, 4)
    .map((v) => v.cover_image_local!);

  const publisherOptions = [
    { label: "None", value: "" },
    ...(publishersList?.map((p) => ({ label: p.name, value: p.id })) ?? []),
  ];

  const handleSave = async () => {
    if (!title.trim()) return;
    await updateSeries.mutateAsync({
      id,
      data: { title: title.trim(), publisher_id: publisherId || null },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Series",
      `Are you sure you want to delete "${seriesData?.title}"? Comics in this series will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSeries.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading || !seriesData) {
    return <View style={styles.container} />;
  }

  return (
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
          <Text style={styles.seriesTitle}>{seriesData.title}</Text>
          <Text style={styles.seriesCount}>
            {volumes?.length ?? 0}{" "}
            {(volumes?.length ?? 0) === 1 ? "volume" : "volumes"}
          </Text>
        </View>
      </View>

      {/* Edit fields */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Series Details</Text>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Series title"
        />
        <Select
          label="Publisher"
          options={publisherOptions}
          value={publisherId}
          onChange={setPublisherId}
        />
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={updateSeries.isPending}
          disabled={!title.trim()}
        />
      </View>

      {/* Volumes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Volumes</Text>
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
      </View>

      <Button
        title="Delete Series"
        variant="danger"
        onPress={handleDelete}
        loading={deleteSeries.isPending}
        style={styles.deleteButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  coverGridWrapper: {
    borderRadius: 8,
    overflow: "hidden",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  seriesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  seriesCount: {
    fontSize: 14,
    color: "#64748b",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  volumeList: {
    gap: 8,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
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
    color: "#94a3b8",
  },
  volumeInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  volumeLabel: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    marginBottom: 2,
  },
  volumeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  volumeChevron: {
    fontSize: 22,
    color: "#94a3b8",
    paddingRight: 12,
  },
  emptyVolumes: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  emptyVolumesText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  deleteButton: {
    marginTop: 32,
    marginHorizontal: 0,
  },
});
