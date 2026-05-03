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
import { useComics, useComicStats } from "../../hooks/useComics";
import { useComicAuthorsSummary } from "../../hooks/useAuthors";
import { ComicCard } from "../../components/ComicCard";
import { FilterBar } from "../../components/FilterBar";
import { EmptyState } from "../../components/EmptyState";
import { COMIC_TYPES, COMIC_TYPE_LABELS } from "../../lib/constants";
import type { FilterOption, ComicType } from "../../lib/constants";

export default function WishlistScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterOption>("all");

  const { data: comicsList, isLoading, refetch } = useComics({
    status: "wishlist",
    comic_type: filter === "all" ? undefined : (filter as ComicType),
  });
  const { data: authorsMap } = useComicAuthorsSummary();
  const { data: stats } = useComicStats("wishlist");

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <FilterBar value={filter} onChange={setFilter} />
      <FlatList
        data={comicsList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ComicCard comic={item} authors={authorsMap?.[item.id]} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          stats && stats.total > 0 ? (
            <View style={styles.statsHeader}>
              <Text style={styles.statsTotal}>
                {stats.total} {stats.total === 1 ? "Comic" : "Comics"}
              </Text>
              <Text style={styles.statsBreakdown}>
                {COMIC_TYPES.filter((t) => stats.byType[t])
                  .map((t) => `${stats.byType[t]} ${COMIC_TYPE_LABELS[t]}`)
                  .join("  ·  ")}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="⭐"
              title="Wishlist is empty"
              message="Add comics you want to your wishlist to keep track of them."
              actionLabel="Add Comic"
              onAction={() => router.push("/comic/new")}
            />
          ) : null
        }
      />
      <Pressable
        onPress={() => router.push("/comic/new")}
        style={styles.fab}
      >
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
  statsBreakdown: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
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
