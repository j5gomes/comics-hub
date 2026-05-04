import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import {
  usePublisher,
  useUpdatePublisher,
  useDeletePublisher,
} from "../../hooks/usePublishers";
import { useImagePicker } from "../../hooks/useImagePicker";
import { processAndStorePublisherLogo } from "../../lib/images";
import { showPhotoSourcePicker } from "../../lib/photoSource";
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  COMIC_TYPES,
  COMIC_TYPE_LABELS,
} from "../../lib/constants";
import type { PublisherFormData } from "../../types";

const ACCENT = "#6366f1";
const BORDER = "#e5e7eb";
const BG = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const TEXT_MUTED = "#94a3b8";
const LOGO_SIZE = 72;

function FullscreenViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={viewer.container}>
        <StatusBar hidden />
        <Image source={{ uri }} style={viewer.image} contentFit="contain" transition={150} />
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [viewer.closeBtn, pressed && viewer.closeBtnPressed]}
          hitSlop={12}
        >
          <Text style={viewer.closeIcon}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const viewer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnPressed: { backgroundColor: "rgba(255,255,255,0.25)" },
  closeIcon: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

type EditingField = "name" | null;

export default function EditPublisherScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: publisher, isLoading } = usePublisher(id);
  const updatePublisher = useUpdatePublisher();
  const deletePublisher = useDeletePublisher();
  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker([1, 1]);

  const [name, setName] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [comicTypes, setComicTypes] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!publisher) return;
    setName(publisher.name);
    try { setLanguages(JSON.parse(publisher.languages)); } catch { setLanguages([]); }
    try { setComicTypes(JSON.parse(publisher.comic_types)); } catch { setComicTypes([]); }
    setImageUri(publisher.logo_local ?? null);
    navigation.setOptions({ title: publisher.name });
  }, [publisher, navigation]);

  const buildFormData = useCallback(
    (overrides: Partial<PublisherFormData> = {}): PublisherFormData => ({
      name,
      languages,
      comic_types: comicTypes,
      logo_local: imageUri,
      ...overrides,
    }),
    [name, languages, comicTypes, imageUri]
  );

  const save = useCallback(
    (overrides: Partial<PublisherFormData> = {}) =>
      updatePublisher.mutateAsync({ id, data: buildFormData(overrides) }),
    [id, buildFormData, updatePublisher]
  );

  const prevLogoUri = useRef<string | null>(null);
  useEffect(() => {
    if (!imageUri || imageUri === prevLogoUri.current) return;
    prevLogoUri.current = imageUri;
    if (imageUri.includes("publisher_logos/")) return;
    (async () => {
      const processed = await processAndStorePublisherLogo(imageUri, id);
      setImageUri(processed);
      await save({ logo_local: processed });
    })();
  }, [imageUri]);

  const toggleLanguage = async (lang: string) => {
    const next = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang];
    setLanguages(next);
    await save({ languages: next });
  };

  const toggleComicType = async (type: string) => {
    const next = comicTypes.includes(type)
      ? comicTypes.filter((t) => t !== type)
      : [...comicTypes, type];
    setComicTypes(next);
    await save({ comic_types: next });
  };

  const handleDelete = () =>
    Alert.alert("Delete Publisher", `Delete "${publisher?.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => { await deletePublisher.mutateAsync(id); router.back(); },
      },
    ]);

  if (isLoading || !publisher) {
    return <View style={styles.loading}><ActivityIndicator color={ACCENT} /></View>;
  }

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
            <Pressable
              onPress={() => imageUri && setFullscreen(true)}
              style={styles.logoPressable}
            >
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
            <Text style={styles.headerMeta} numberOfLines={1}>
              {languages.length ? languages.join(" · ") : "No languages set"}
            </Text>
          </View>
        </View>

        {/* Languages */}
        <SectionHeader title="Languages" />
        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.pillsContainer}>
            {LANGUAGES.map((lang) => {
              const active = languages.includes(lang);
              return (
                <Pressable
                  key={lang}
                  onPress={() => toggleLanguage(lang)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Comic Types */}
        <SectionHeader title="Comic Types" />
        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.pillsContainer}>
            {COMIC_TYPES.map((type) => {
              const active = comicTypes.includes(type);
              return (
                <Pressable
                  key={type}
                  onPress={() => toggleComicType(type)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {COMIC_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Publisher</Text>
        </Pressable>
      </ScrollView>

      {fullscreen && imageUri && (
        <FullscreenViewer uri={imageUri} onClose={() => setFullscreen(false)} />
      )}
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
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 14,
  },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitial: { fontSize: 28, fontWeight: "700", color: TEXT_MUTED },
  logoEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  cardPadded: { padding: 14 },

  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  pillActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  pillText: { fontSize: 13, fontWeight: "500", color: TEXT_SECONDARY },
  pillTextActive: { color: "#ffffff" },

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
