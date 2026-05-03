import { View, Text, StyleSheet } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "info";

type Props = {
  text: string;
  variant?: BadgeVariant;
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "#e2e8f0", text: "#475569" },
  success: { bg: "#dcfce7", text: "#166534" },
  warning: { bg: "#fef3c7", text: "#92400e" },
  info: { bg: "#dbeafe", text: "#1e40af" },
};

export function Badge({ text, variant = "default" }: Props) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
