import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthors } from "../../hooks/useAuthors";
import { Card, Button } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";
import { AUTHOR_ROLE_LABELS } from "../../lib/constants";
import type { AuthorRole } from "../../lib/constants";
import type { Author } from "../../types";

function formatRoles(rolesJson: string): string {
  try {
    const roles: string[] = JSON.parse(rolesJson);
    return roles
      .map((r) => AUTHOR_ROLE_LABELS[r as AuthorRole] ?? r)
      .join(", ");
  } catch {
    return "";
  }
}

export default function AuthorsScreen() {
  const router = useRouter();
  const { data: authorsList, isLoading } = useAuthors();

  const renderItem = ({ item }: { item: Author }) => {
    const roles = formatRoles(item.roles);
    return (
      <Pressable onPress={() => router.push(`/authors/${item.id}`)}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            {item.photo_local ? (
              <Image
                source={{ uri: item.photo_local }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.name}>{item.name}</Text>
              {roles ? (
                <Text style={styles.roles}>{roles}</Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={authorsList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="✍️"
              title="No authors"
              message="Add authors to credit your comics."
              actionLabel="Add Author"
              onAction={() => router.push("/authors/new")}
            />
          ) : null
        }
        ListHeaderComponent={
          authorsList && authorsList.length > 0 ? (
            <Button
              title="Add Author"
              onPress={() => router.push("/authors/new")}
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  photoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  roles: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: "#94a3b8",
  },
  addButton: {
    marginBottom: 16,
  },
});
