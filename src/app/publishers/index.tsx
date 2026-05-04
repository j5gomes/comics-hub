import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { usePublishers } from "../../hooks/usePublishers";
import { Card, Badge, Button } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";
import { COMIC_TYPE_LABELS, LANGUAGE_LABELS } from "../../lib/constants";
import type { Publisher } from "../../types";

const LOGO_SIZE = 44;

export default function PublishersScreen() {
  const router = useRouter();
  const { data: publishersList, isLoading } = usePublishers();

  const renderItem = ({ item }: { item: Publisher }) => {
    const languages: string[] = JSON.parse(item.languages);
    const comicTypes: string[] = JSON.parse(item.comic_types);

    return (
      <Pressable onPress={() => router.push(`/publishers/${item.id}`)}>
        <Card style={styles.card}>
          <View style={styles.row}>
            {item.logo_local ? (
              <Image
                source={{ uri: item.logo_local }}
                style={styles.logo}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.info}>
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
            </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 10,
    flexShrink: 0,
  },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  logoInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94a3b8",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
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
