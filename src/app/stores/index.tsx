import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStores } from "../../hooks/useStores";
import { Card, Badge, Button } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";
import { STORE_TYPE_LABELS } from "../../lib/constants";
import type { Store } from "../../types";

export default function StoresScreen() {
  const router = useRouter();
  const { data: storesList, isLoading } = useStores();

  const renderItem = ({ item }: { item: Store }) => {
    return (
      <Pressable onPress={() => router.push(`/stores/${item.id}`)}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.name}</Text>
            <Badge
              text={
                STORE_TYPE_LABELS[
                  item.store_type as keyof typeof STORE_TYPE_LABELS
                ] ?? item.store_type
              }
              variant="info"
            />
          </View>
          {item.location ? (
            <Text style={styles.location}>{item.location}</Text>
          ) : null}
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={storesList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🏪"
              title="No stores"
              message="Add stores where you buy your comics."
              actionLabel="Add Store"
              onAction={() => router.push("/stores/new")}
            />
          ) : null
        }
        ListHeaderComponent={
          storesList && storesList.length > 0 ? (
            <Button
              title="Add Store"
              onPress={() => router.push("/stores/new")}
              style={styles.addButton}
            />
          ) : null
        }
      />
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
    flexGrow: 1,
  },
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  location: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
  },
  addButton: {
    marginBottom: 16,
  },
});
