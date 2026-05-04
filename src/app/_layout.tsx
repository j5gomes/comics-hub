import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SQLiteProvider } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { db, expoDb } from "../../db";
import migrations from "../../db/migrations/migrations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="comics-hub.db">
      <QueryClientProvider client={queryClient}>
        <MigrationGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#f8fafc" },
              headerTintColor: "#0f172a",
              headerTitleStyle: { fontWeight: "600" },
              contentStyle: { backgroundColor: "#f8fafc" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="comic/new"
              options={{ title: "Add Comic", presentation: "modal" }}
            />
            <Stack.Screen
              name="comic/[id]"
              options={{ title: "" }}
            />
            <Stack.Screen
              name="publishers/index"
              options={{ title: "Publishers" }}
            />
            <Stack.Screen
              name="publishers/new"
              options={{ title: "Add Publisher", presentation: "modal" }}
            />
            <Stack.Screen
              name="publishers/[id]"
              options={{ title: "Edit Publisher", presentation: "modal" }}
            />
            <Stack.Screen
              name="authors/index"
              options={{ title: "Authors" }}
            />
            <Stack.Screen
              name="authors/new"
              options={{ title: "Add Author", presentation: "modal" }}
            />
            <Stack.Screen
              name="authors/[id]"
              options={{ title: "Edit Author", presentation: "modal" }}
            />
            <Stack.Screen name="stores/index" options={{ title: "Stores" }} />
            <Stack.Screen
              name="stores/new"
              options={{ title: "Add Store", presentation: "modal" }}
            />
            <Stack.Screen
              name="stores/[id]"
              options={{ title: "Edit Store", presentation: "modal" }}
            />
            <Stack.Screen
              name="series/new"
              options={{ title: "New Series", presentation: "modal" }}
            />
            <Stack.Screen
              name="series/[id]"
              options={{ title: "Series" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </MigrationGate>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
