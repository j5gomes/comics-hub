import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const SCREEN_HEIGHT = Dimensions.get("window").height;

type ColumnItem = { label: string; value: string };

const MONTHS: ColumnItem[] = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

function buildYears(): ColumnItem[] {
  const cur = new Date().getFullYear();
  const items: ColumnItem[] = [];
  for (let y = 1900; y <= cur + 5; y++) {
    items.push({ label: String(y), value: String(y) });
  }
  return items;
}

function buildDays(): ColumnItem[] {
  const items: ColumnItem[] = [];
  for (let d = 1; d <= 31; d++) {
    const val = String(d).padStart(2, "0");
    items.push({ label: String(d), value: val });
  }
  return items;
}

const YEARS = buildYears();
const DAYS = buildDays();

function PickerColumn({
  items,
  value,
  onChange,
  isVisible,
  flex,
}: {
  items: ColumnItem[];
  value: string;
  onChange: (v: string) => void;
  isVisible: boolean;
  flex?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIdx = Math.max(0, items.findIndex((i) => i.value === value));
  const lastIdx = useRef(-1);

  useEffect(() => {
    if (!isVisible) return;
    lastIdx.current = selectedIdx;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIdx * ITEM_HEIGHT, animated: false });
    }, 60);
    return () => clearTimeout(t);
  }, [isVisible]);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== lastIdx.current) {
      lastIdx.current = clamped;
      onChange(items[clamped].value);
    }
  };

  return (
    <View style={[col.wrapper, flex !== undefined && { flex }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        bounces={false}
      >
        {items.map((item) => (
          <View key={item.value} style={col.item}>
            <Text
              style={[
                col.itemText,
                item.value === value && col.itemTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Fades above / below selection */}
      <View style={col.fadeTop} pointerEvents="none" />
      <View style={col.fadeBottom} pointerEvents="none" />

      {/* Selection highlight */}
      <View style={col.highlight} pointerEvents="none" />
    </View>
  );
}

const col = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: PICKER_HEIGHT,
    overflow: "hidden",
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "400",
  },
  itemTextSelected: {
    color: "#0f172a",
    fontWeight: "600",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  highlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "rgba(99,102,241,0.04)",
  },
});

// ─── DatePickerSheet ──────────────────────────────────────────────────────────

export type DatePickerMode = "month-year" | "date";

type Props = {
  visible: boolean;
  title: string;
  mode: DatePickerMode;
  /** "YYYY-MM" for month-year, "YYYY-MM-DD" for date */
  value: string | null;
  onDone: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
};

const nowYear = String(new Date().getFullYear());
const nowMonth = String(new Date().getMonth() + 1).padStart(2, "0");
const nowDay = String(new Date().getDate()).padStart(2, "0");

export function DatePickerSheet({ visible, title, mode, value, onDone, onClear, onClose }: Props) {
  const parts = value ? value.split("-") : [];
  const [year, setYear] = useState(parts[0] ?? nowYear);
  const [month, setMonth] = useState(parts[1] ?? nowMonth);
  const [day, setDay] = useState(parts[2] ?? nowDay);

  useEffect(() => {
    if (!visible) return;
    const p = value ? value.split("-") : [];
    setYear(p[0] ?? nowYear);
    setMonth(p[1] ?? nowMonth);
    setDay(p[2] ?? nowDay);
  }, [visible]);

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

  const handleDone = () => {
    const result =
      mode === "month-year" ? `${year}-${month}` : `${year}-${month}-${day}`;
    onDone(result);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={sheet.backdrop} onPress={onClose} />
      <Animated.View style={[sheet.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={sheet.handle} />

        {/* Toolbar */}
        <View style={sheet.toolbar}>
          <Pressable onPress={() => { onClear(); onClose(); }} hitSlop={8}>
            <Text style={sheet.clearText}>Clear</Text>
          </Pressable>
          <Text style={sheet.titleText}>{title}</Text>
          <Pressable onPress={handleDone} hitSlop={8}>
            <Text style={sheet.doneText}>Done</Text>
          </Pressable>
        </View>

        {/* Drum columns */}
        <View style={sheet.columns}>
          {mode === "date" && (
            <PickerColumn items={DAYS} value={day} onChange={setDay} isVisible={visible} flex={1} />
          )}
          <PickerColumn
            items={MONTHS}
            value={month}
            onChange={setMonth}
            isVisible={visible}
            flex={mode === "date" ? 2 : 2}
          />
          <PickerColumn items={YEARS} value={year} onChange={setYear} isVisible={visible} flex={1} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 15,
    color: "#ef4444",
    fontWeight: "500",
  },
  doneText: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "700",
  },
  columns: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
});
