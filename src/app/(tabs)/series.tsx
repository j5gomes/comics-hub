import { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Pressable,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSeriesList } from "../../hooks/useSeries";
import { SeriesCoverGrid } from "../../components/SeriesCoverGrid";
import { FilterBar } from "../../components/FilterBar";
import { EmptyState } from "../../components/EmptyState";
import type { FilterOption } from "../../lib/constants";

const COVER_SIZE = 88;

type SeriesItem = {
  id: string;
  title: string;
  covers: string[];
  volumeCount: number;
};

function SeriesCard({ item }: { item: SeriesItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/series/${item.id}`)}
      style={styles.card}
    >
      <View style={styles.cardCover}>
        <SeriesCoverGrid covers={item.covers} size={COVER_SIZE} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardCount}>
          {item.volumeCount} {item.volumeCount === 1 ? "volume" : "volumes"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SeriesScreen() {
  const router = useRouter();
  const { data: seriesList, isLoading, refetch } = useSeriesList();
  const [filter, setFilter] = useState<FilterOption>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered =
    filter === "all"
      ? seriesList
      : seriesList?.filter((s) => s.comicTypes.includes(filter));

  return (
    <View style={styles.container}>
      <FilterBar value={filter} onChange={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <SeriesCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          seriesList && seriesList.length > 0 ? (
            <View style={styles.statsHeader}>
              <Text style={styles.statsTotal}>
                {seriesList.length}{" "}
                {seriesList.length === 1 ? "Series" : "Series"}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📖"
              title="No series yet"
              message="Group your comics into series by creating one."
              actionLabel="Create Series"
              onAction={() => router.push("/series/new")}
            />
          ) : null
        }
      />
      <Pressable onPress={() => router.push("/series/new")} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  statsHeader: {
    paddingVertical: 12,
    paddingBottom: 16,
  },
  statsTotal: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardCover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    backgroundColor: "#e2e8f0",
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardCount: {
    fontSize: 13,
    color: "#64748b",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});
