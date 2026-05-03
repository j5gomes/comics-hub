import { View, Text, Pressable, StyleSheet } from "react-native";

type Option = { label: string; value: string };

type Props = {
  label: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
};

export function MultiSelect({ label, options, values, onChange }: Props) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => toggle(opt.value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  optionSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  optionText: {
    fontSize: 14,
    color: "#374151",
  },
  optionTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
