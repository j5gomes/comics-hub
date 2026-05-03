import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { usePublishers } from "../../hooks/usePublishers";
import { Card, Badge, Button } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";
import { COMIC_TYPE_LABELS, LANGUAGE_LABELS } from "../../lib/constants";
import type { Publisher } from "../../types";

export default function PublishersScreen() {
  const router = useRouter();
  const { data: publishersList, isLoading } = usePublishers();

  const renderItem = ({ item }: { item: Publisher }) => {
    const languages: string[] = JSON.parse(item.languages);
    const comicTypes: string[] = JSON.parse(item.comic_types);

    return (
      <Pressable onPress={() => router.push(`/publishers/${item.id}`)}>
        <Card style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badges}>
            {comicTypes.map((t) => (
              <Badge
                key={t}
                text={COMIC_TYPE_LABELS[t as keyof typeof COMIC_TYPE_LABELS] ?? t}
                variant="info"
              />
            ))}
            {languages.map((l) => (
              <Badge
                key={l}
                text={LANGUAGE_LABELS[l as keyof typeof LANGUAGE_LABELS] ?? l}
                variant="default"
              />
            ))}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={publishersList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🏢"
              title="No publishers"
              message="Add publishers to organize your comics."
              actionLabel="Add Publisher"
              onAction={() => router.push("/publishers/new")}
            />
          ) : null
        }
        ListHeaderComponent={
          publishersList && publishersList.length > 0 ? (
            <Button
              title="Add Publisher"
              onPress={() => router.push("/publishers/new")}
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
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  addButton: {
    marginBottom: 16,
  },
});
