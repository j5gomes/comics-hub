import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui";
import { seedDatabase } from "../../lib/seed";
import { BookUser, Building2, Store } from "lucide-react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = () => {
    Alert.alert(
      "Seed Mock Data",
      "This will add Marvel, DC and Image Comics mock data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed",
          onPress: async () => {
            setSeeding(true);
            try {
              await seedDatabase();
              queryClient.invalidateQueries();
              Alert.alert("Done", "Mock data added successfully.");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Seed failed.");
            } finally {
              setSeeding(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data Management</Text>

      <Pressable onPress={() => router.push("/publishers/")}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>
              <Building2 color={styles.cardSubtitle.color} />
            </Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Publishers</Text>
              <Text style={styles.cardSubtitle}>Manage comic publishers</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/stores/")}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>
              <Store color={styles.cardSubtitle.color} />
            </Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Stores</Text>
              <Text style={styles.cardSubtitle}>Manage comic stores</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/authors/")}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>
              <BookUser color={styles.cardSubtitle.color} />
            </Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Authors</Text>
              <Text style={styles.cardSubtitle}>Manage comic authors</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </Pressable>

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Sync</Text>

      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>☁️</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>PocketBase Sync</Text>
            <Text style={styles.cardSubtitle}>Not configured</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Configure a PocketBase server URL to sync your collection across
          devices.
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        About
      </Text>
      <Card style={styles.card}>
        <Text style={styles.aboutText}>Comics Hub v1.0.0</Text>
        <Text style={styles.aboutSubtext}>
          Local-first comic collection manager
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        Developer
      </Text>
      <Pressable onPress={handleSeed} disabled={seeding}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🌱</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                {seeding ? "Seeding…" : "Seed Mock Data"}
              </Text>
              <Text style={styles.cardSubtitle}>
                Add Marvel, DC & Image Comics sample data
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
  card: {
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: "#94a3b8",
  },
  hint: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 18,
  },
  aboutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  aboutSubtext: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
});
