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
  useAuthor,
  useUpdateAuthor,
  useDeleteAuthor,
} from "../../hooks/useAuthors";
import { useImagePicker } from "../../hooks/useImagePicker";
import { processAndStoreAuthorPhoto } from "../../lib/images";
import { showPhotoSourcePicker } from "../../lib/photoSource";
import { AUTHOR_ROLES, AUTHOR_ROLE_LABELS } from "../../lib/constants";
import type { AuthorFormData } from "../../types";

const ACCENT = "#6366f1";
const BORDER = "#e5e7eb";
const BG = "#f8fafc";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#0f172a";
const TEXT_SECONDARY = "#64748b";
const TEXT_MUTED = "#94a3b8";
const PHOTO_SIZE = 80;

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

export default function EditAuthorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: author, isLoading } = useAuthor(id);
  const updateAuthor = useUpdateAuthor();
  const deleteAuthor = useDeleteAuthor();
  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker([1, 1]);

  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!author) return;
    setName(author.name);
    try { setRoles(JSON.parse(author.roles)); } catch { setRoles([]); }
    setImageUri(author.photo_local ?? null);
    navigation.setOptions({ title: author.name });
  }, [author, navigation]);

  const buildFormData = useCallback(
    (overrides: Partial<AuthorFormData> = {}): AuthorFormData => ({
      name,
      roles,
      photo_local: imageUri,
      ...overrides,
    }),
    [name, roles, imageUri]
  );

  const save = useCallback(
    (overrides: Partial<AuthorFormData> = {}) =>
      updateAuthor.mutateAsync({ id, data: buildFormData(overrides) }),
    [id, buildFormData, updateAuthor]
  );

  const prevPhotoUri = useRef<string | null>(null);
  useEffect(() => {
    if (!imageUri || imageUri === prevPhotoUri.current) return;
    prevPhotoUri.current = imageUri;
    if (imageUri.includes("author_photos/")) return;
    (async () => {
      const processed = await processAndStoreAuthorPhoto(imageUri, id);
      setImageUri(processed);
      await save({ photo_local: processed });
    })();
  }, [imageUri]);

  const toggleRole = async (role: string) => {
    const next = roles.includes(role)
      ? roles.filter((r) => r !== role)
      : [...roles, role];
    setRoles(next);
    await save({ roles: next });
  };

  const handleDelete = () =>
    Alert.alert("Delete Author", `Delete "${author?.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => { await deleteAuthor.mutateAsync(id); router.back(); },
      },
    ]);

  if (isLoading || !author) {
    return <View style={styles.loading}><ActivityIndicator color={ACCENT} /></View>;
  }

  const rolesLabel = roles.length
    ? roles
        .map((r) => AUTHOR_ROLE_LABELS[r as keyof typeof AUTHOR_ROLE_LABELS] ?? r)
        .join(", ")
    : "No roles set";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.photoWrapper}>
            <Pressable
              onPress={() => imageUri && setFullscreen(true)}
              style={styles.photoPressable}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitial}>
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
                  else if (source === "remove") { clearImage(); await save({ photo_local: null }); }
                })
              }
              style={styles.photoEditBtn}
              hitSlop={6}
            >
              <Text style={styles.photoEditIcon}>✎</Text>
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
            <Text style={styles.headerMeta}>{rolesLabel}</Text>
          </View>
        </View>

        {/* Roles */}
        <SectionHeader title="Roles" />
        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.pillsContainer}>
            {AUTHOR_ROLES.map((role) => {
              const active = roles.includes(role);
              return (
                <Pressable
                  key={role}
                  onPress={() => toggleRole(role)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {AUTHOR_ROLE_LABELS[role]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Author</Text>
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
  photoWrapper: { position: "relative", flexShrink: 0 },
  photoPressable: {
    borderRadius: PHOTO_SIZE / 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  photoPlaceholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitial: { fontSize: 28, fontWeight: "700", color: TEXT_MUTED },
  photoEditBtn: {
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
  photoEditIcon: { color: "#fff", fontSize: 11 },

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
