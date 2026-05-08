import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { useStore, useUpdateStore, useDeleteStore } from "../../hooks/useStores";
import { PickerSheet } from "../../components/PickerSheet";
import { useImagePicker } from "../../hooks/useImagePicker";
import { processAndStoreStoreLogo } from "../../lib/images";
import { showPhotoSourcePicker } from "../../lib/photoSource";
import { STORE_TYPES, STORE_TYPE_LABELS } from "../../lib/constants";
import type { StoreFormData } from "../../types";

const ACCENT = "#6366f1";
const BORDER = "#e5e7eb";
const BG = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const TEXT_MUTED = "#94a3b8";
const LOGO_SIZE = 64;

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DetailRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, !value && styles.rowValueEmpty]}>
          {value || "—"}
        </Text>
        {onPress && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </Pressable>
  );
}

function InlineTextRow({
  label,
  value,
  onChange,
  onSave,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  last?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <View style={[styles.row, styles.rowEditing, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        ref={ref}
        style={styles.inlineInput}
        value={value}
        onChangeText={onChange}
        onBlur={onSave}
        onSubmitEditing={onSave}
        returnKeyType="done"
        selectTextOnFocus
      />
    </View>
  );
}

type EditingField = "name" | "location" | null;

export default function EditStoreScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: store, isLoading } = useStore(id);
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();
  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker([1, 1]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [storeType, setStoreType] = useState("physical");
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setLocation(store.location ?? "");
    setStoreType(store.store_type);
    setImageUri(store.logo_local ?? null);
    navigation.setOptions({ title: store.name });
  }, [store, navigation]);

  const buildFormData = useCallback(
    (overrides: Partial<StoreFormData> = {}): StoreFormData => ({
      name,
      location,
      store_type: storeType,
      logo_local: imageUri,
      ...overrides,
    }),
    [name, location, storeType, imageUri]
  );

  const save = useCallback(
    (overrides: Partial<StoreFormData> = {}) =>
      updateStore.mutateAsync({ id, data: buildFormData(overrides) }),
    [id, buildFormData, updateStore]
  );

  const prevLogoUri = useRef<string | null>(null);
  useEffect(() => {
    if (!imageUri || imageUri === prevLogoUri.current) return;
    prevLogoUri.current = imageUri;
    if (imageUri.includes("store_logos/")) return;
    (async () => {
      const processed = await processAndStoreStoreLogo(imageUri, id);
      setImageUri(processed);
      await save({ logo_local: processed });
    })();
  }, [imageUri]);

  const handleDelete = () =>
    Alert.alert("Delete Store", `Delete "${store?.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => { await deleteStore.mutateAsync(id); router.back(); },
      },
    ]);

  if (isLoading || !store) {
    return <View style={styles.loading}><ActivityIndicator color={ACCENT} /></View>;
  }

  const typeLabel = STORE_TYPE_LABELS[storeType as keyof typeof STORE_TYPE_LABELS] ?? storeType;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Pressable style={styles.logoPressable}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.logo}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoInitial}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() =>
                showPhotoSourcePicker(!!imageUri, async (source) => {
                  if (source === "gallery") await pickFromGallery();
                  else if (source === "camera") await pickFromCamera();
                  else if (source === "remove") { clearImage(); await save({ logo_local: null }); }
                })
              }
              style={styles.logoEditBtn}
              hitSlop={6}
            >
              <Text style={styles.logoEditIcon}>✎</Text>
            </Pressable>
          </View>

          <View style={styles.headerInfo}>
            {editingField === "name" ? (
              <TextInput
                style={styles.headerTitleInput}
                value={name}
                onChangeText={setName}
                onBlur={() => {
                  setEditingField(null);
                  save({ name: name.trim() });
                  navigation.setOptions({ title: name.trim() });
                }}
                onSubmitEditing={() => {
                  setEditingField(null);
                  save({ name: name.trim() });
                  navigation.setOptions({ title: name.trim() });
                }}
                returnKeyType="done"
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Pressable onPress={() => setEditingField("name")}>
                <Text style={styles.headerTitle}>{name}</Text>
              </Pressable>
            )}
            <Text style={styles.headerMeta}>{typeLabel}</Text>
          </View>
        </View>

        <SectionHeader title="Details" />
        <View style={styles.card}>
          {editingField === "location" ? (
            <InlineTextRow
              label="Location"
              value={location}
              onChange={setLocation}
              onSave={() => { setEditingField(null); save({ location: location.trim() }); }}
            />
          ) : (
            <DetailRow
              label="Location"
              value={location}
              onPress={() => setEditingField("location")}
            />
          )}
          <DetailRow label="Type" value={typeLabel} onPress={() => setPickerOpen(true)} last />
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Store</Text>
        </Pressable>
      </ScrollView>

      <PickerSheet
        visible={pickerOpen}
        title="Store Type"
        options={STORE_TYPES.map((t) => ({ label: STORE_TYPE_LABELS[t], value: t }))}
        value={storeType}
        onSelect={async (val) => {
          setStoreType(val);
          setPickerOpen(false);
          await save({ store_type: val });
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  container: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 48 },

  header: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: "center",
  },
  logoWrapper: { position: "relative", flexShrink: 0 },
  logoPressable: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 16,
  },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitial: { fontSize: 28, fontWeight: "700", color: TEXT_MUTED },
  logoEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoEditIcon: { color: "#fff", fontSize: 11 },

  headerInfo: { flex: 1, gap: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },
  headerTitleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
    paddingBottom: 2,
  },
  headerMeta: { fontSize: 13, color: TEXT_SECONDARY },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 6,
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 50,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: "#f9fafb" },
  rowEditing: { paddingVertical: 8 },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_SECONDARY,
    width: 112,
    flexShrink: 0,
  },
  rowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_PRIMARY,
    textAlign: "right",
    flexShrink: 1,
  },
  rowValueEmpty: { color: TEXT_MUTED },
  rowChevron: { fontSize: 18, color: TEXT_MUTED, marginLeft: 2 },
  inlineInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_PRIMARY,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
  },

  deleteButton: {
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    alignItems: "center",
    backgroundColor: "#fff5f5",
  },
  deleteButtonText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
