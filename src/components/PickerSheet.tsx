import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";

export type PickerOption = { label: string; value: string };

type Props = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export function PickerSheet({ visible, title, options, value, onSelect, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleBar} />

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Options */}
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          scrollEnabled={options.length > 8}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const selected = item.value === value;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text
                  style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                >
                  {item.label}
                </Text>
                {selected && <View style={styles.checkDot} />}
              </Pressable>
            );
          }}
        />

        {/* Cancel */}
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.65,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  list: {
    flexGrow: 0,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optionPressed: {
    backgroundColor: "#f9fafb",
  },
  optionLabel: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "400",
  },
  optionLabelSelected: {
    fontWeight: "600",
    color: "#6366f1",
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelButtonPressed: {
    backgroundColor: "#e2e8f0",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
