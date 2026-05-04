import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { PickerSheet } from "../PickerSheet";

type Option = { label: string; value: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function Select({ label, options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        >
          <Text style={[styles.value, !selectedLabel && styles.placeholder]}>
            {selectedLabel ?? placeholder ?? "Select…"}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <PickerSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        onSelect={(val) => { onChange(val); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    minHeight: 48,
  },
  fieldPressed: {
    backgroundColor: "#f9fafb",
  },
  value: {
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
  },
  placeholder: {
    color: "#94a3b8",
  },
  chevron: {
    fontSize: 20,
    color: "#94a3b8",
    marginLeft: 8,
  },
});
