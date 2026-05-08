import { useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sql } from "drizzle-orm";
import { Card } from "../../components/ui";
import { seedDatabase } from "../../lib/seed";
import { BookUser, Building2, Store } from "lucide-react-native";
import { db, expoDb, DATABASE_PATH } from "../../../db";
import {
  comics,
  comicAuthors,
  series,
  publishers,
  stores,
  authors,
  syncOutbox,
  syncMeta,
} from "../../../db/schema";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShareDb = async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert("Sharing not available", "Your device does not support file sharing.");
      return;
    }
    setSharing(true);
    try {
      await Sharing.shareAsync(`file://${DATABASE_PATH}`, {
        mimeType: "application/octet-stream",
        dialogTitle: "Share comics-hub.db",
        UTI: "public.database",
      });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not share the database.");
    } finally {
      setSharing(false);
    }
  };

  const { data: hasData } = useQuery({
    queryKey: ["hasData"],
    queryFn: () => {
      const row = db
        .select({ count: sql<number>`count(*)` })
        .from(comics)
        .get();
      return (row?.count ?? 0) > 0;
    },
  });

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete every comic, series, author, publisher, store and sync record. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              expoDb.withTransactionSync(() => {
                db.delete(comicAuthors).run();
                db.delete(comics).run();
                db.delete(series).run();
                db.delete(authors).run();
                db.delete(publishers).run();
                db.delete(stores).run();
                db.delete(syncOutbox).run();
                db.delete(syncMeta).run();
              });
              queryClient.clear();
              queryClient.invalidateQueries({ queryKey: ["hasData"] });
              Alert.alert("Done", "All data has been deleted.");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Delete failed.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={[styles.cardTitle, { marginTop: 16 }]}>Database Path</Text>
        <Text selectable style={styles.dbPath}>
          {DATABASE_PATH}
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

      <Pressable onPress={handleShareDb} disabled={sharing}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>📤</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                {sharing ? "Sharing…" : "Share Database"}
              </Text>
              <Text style={styles.cardSubtitle}>
                Export the SQLite file to your Mac or Files
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>

      <Pressable
        onPress={handleDeleteAll}
        disabled={deleting || !hasData}
        style={{ opacity: hasData ? 1 : 0.4 }}
      >
        <Card style={{ ...styles.card, ...styles.dangerCard }}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🗑️</Text>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.dangerText]}>
                {deleting ? "Deleting…" : "Delete All Data"}
              </Text>
              <Text style={styles.cardSubtitle}>
                Permanently wipe the entire local database
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
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
    paddingBottom: 48,
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
  dbPath: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff5f5",
  },
  dangerText: {
    color: "#ef4444",
  },
});
