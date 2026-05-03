import { View, Text, Pressable, StyleSheet } from "react-native";
import { COMIC_TYPE_LABELS, type FilterOption } from "../lib/constants";

type Props = {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
};

const filters: { label: string; value: FilterOption }[] = [
  { label: "All", value: "all" },
  { label: COMIC_TYPE_LABELS.bd, value: "bd" },
  { label: COMIC_TYPE_LABELS.comics, value: "comics" },
  { label: COMIC_TYPE_LABELS.manga, value: "manga" },
];

export function FilterBar({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {filters.map((f) => (
        <Pressable
          key={f.value}
          onPress={() => onChange(f.value)}
          style={[styles.pill, value === f.value && styles.pillActive]}
        >
          <Text
            style={[
              styles.pillText,
              value === f.value && styles.pillTextActive,
            ]}
          >
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  pillActive: {
    backgroundColor: "#6366f1",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  pillTextActive: {
    color: "#ffffff",
  },
});
