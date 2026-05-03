import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
  isSyncing: boolean;
  pendingCount: number;
  onPress: () => void;
};

export function SyncStatusBadge({ isSyncing, pendingCount, onPress }: Props) {
  const hasUnsyncedChanges = pendingCount > 0;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.dot,
          isSyncing
            ? styles.dotSyncing
            : hasUnsyncedChanges
              ? styles.dotPending
              : styles.dotSynced,
        ]}
      />
      <Text style={styles.text}>
        {isSyncing
          ? "Syncing..."
          : hasUnsyncedChanges
            ? `${pendingCount} pending`
            : "Synced"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSyncing: {
    backgroundColor: "#f59e0b",
  },
  dotPending: {
    backgroundColor: "#ef4444",
  },
  dotSynced: {
    backgroundColor: "#22c55e",
  },
  text: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
});
