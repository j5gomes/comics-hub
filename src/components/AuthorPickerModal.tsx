import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { randomUUID } from "expo-crypto";
import {
  useAuthors,
  useCreateAuthor,
  useAddRoleToAuthor,
} from "../hooks/useAuthors";
import { useImagePicker } from "../hooks/useImagePicker";
import { processAndStoreAuthorPhoto } from "../lib/images";
import { AUTHOR_ROLE_LABELS } from "../lib/constants";
import type { AuthorRole } from "../lib/constants";
import type { Author } from "../types";

type Props = {
  visible: boolean;
  role: AuthorRole;
  onSelect: (authorId: string) => void;
  onClose: () => void;
  excludeAuthorIds?: string[];
};

function hasRole(author: Author, role: string): boolean {
  try {
    const roles: string[] = JSON.parse(author.roles);
    return roles.includes(role);
  } catch {
    return false;
  }
}

function AuthorRow({
  author,
  isSelected,
  subtitle,
  onPress,
}: {
  author: Author;
  isSelected?: boolean;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.authorRow}>
      {author.photo_local ? (
        <Image source={{ uri: author.photo_local }} style={styles.authorPhoto} />
      ) : (
        <View style={styles.authorPhotoPlaceholder}>
          <Text style={styles.authorInitial}>
            {author.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.authorInfo}>
        <Text style={styles.authorName}>{author.name}</Text>
        {subtitle ? (
          <Text style={styles.authorSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

export function AuthorPickerModal({
  visible,
  role,
  onSelect,
  onClose,
  excludeAuthorIds = [],
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const { imageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker([1, 1]);

  const { data: allAuthors } = useAuthors();
  const createAuthor = useCreateAuthor();
  const addRole = useAddRoleToAuthor();

  const excludeSet = new Set(excludeAuthorIds);
  const available = (allAuthors ?? []).filter((a) => !excludeSet.has(a.id));

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? available.filter((a) => a.name.toLowerCase().includes(query))
    : available;

  const primary = filtered.filter((a) => hasRole(a, role));
  const other = filtered.filter((a) => !hasRole(a, role));

  const sections = [
    ...(primary.length > 0
      ? [{ title: AUTHOR_ROLE_LABELS[role] + "s", data: primary, isOther: false }]
      : []),
    ...(other.length > 0 && query
      ? [{ title: "Other authors", data: other, isOther: true }]
      : []),
  ];

  const hasExactMatch = available.some(
    (a) => a.name.toLowerCase() === query
  );

  const handleSelectPrimary = (author: Author) => {
    onSelect(author.id);
    resetAndClose();
  };

  const handleSelectOther = async (author: Author) => {
    await addRole.mutateAsync({ id: author.id, role });
    onSelect(author.id);
    resetAndClose();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    let photoPath: string | null = null;
    const authorId = randomUUID();
    if (imageUri) {
      photoPath = await processAndStoreAuthorPhoto(imageUri, authorId);
    }

    const result = await createAuthor.mutateAsync({
      name: newName.trim(),
      roles: [role],
      photo_local: photoPath,
    });

    onSelect(result.id);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSearchQuery("");
    setShowCreate(false);
    setNewName("");
    clearImage();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Select {AUTHOR_ROLE_LABELS[role]}
          </Text>
          <Pressable onPress={resetAndClose} hitSlop={8}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search authors..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
          />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, section }) =>
            section.isOther ? (
              <AuthorRow
                author={item}
                subtitle={`Tap to add ${AUTHOR_ROLE_LABELS[role]} role`}
                onPress={() => handleSelectOther(item)}
              />
            ) : (
              <AuthorRow
                author={item}
                onPress={() => handleSelectPrimary(item)}
              />
            )
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query ? "No authors found" : "No authors yet"}
            </Text>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />

        {/* Show create button when searching and no exact match */}
        {query && !hasExactMatch && !showCreate && (
          <Pressable
            style={styles.createSuggestion}
            onPress={() => {
              setNewName(searchQuery.trim());
              setShowCreate(true);
            }}
          >
            <Text style={styles.createSuggestionText}>
              + Create "{searchQuery.trim()}"
            </Text>
          </Pressable>
        )}

        {/* Inline create form */}
        {showCreate && (
          <View style={styles.createForm}>
            <View style={styles.createFormRow}>
              <Pressable
                onPress={() => {
                  if (imageUri) {
                    clearImage();
                  } else {
                    pickFromGallery();
                  }
                }}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.createPhoto}
                  />
                ) : (
                  <View style={styles.createPhotoPlaceholder}>
                    <Text style={styles.createPhotoIcon}>+</Text>
                  </View>
                )}
              </Pressable>
              <TextInput
                style={styles.createNameInput}
                placeholder="Author name"
                placeholderTextColor="#94a3b8"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </View>
            <View style={styles.createActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreate(false);
                  setNewName("");
                  clearImage();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.createButton,
                  (!newName.trim() || createAuthor.isPending) &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={!newName.trim() || createAuthor.isPending}
              >
                <Text style={styles.createButtonText}>
                  {createAuthor.isPending ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Always-visible create button at bottom */}
        {!showCreate && !query && (
          <Pressable
            style={styles.bottomCreate}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.bottomCreateText}>+ Create New Author</Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "600",
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  authorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0f172a",
  },
  authorSubtitle: {
    fontSize: 12,
    color: "#6366f1",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: "#6366f1",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    paddingVertical: 32,
  },
  createSuggestion: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  createSuggestionText: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
  },
  createForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  createFormRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  createPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  createPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },
  createPhotoIcon: {
    fontSize: 20,
    color: "#94a3b8",
  },
  createNameInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#6366f1",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
  },
  bottomCreate: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  bottomCreateText: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
    textAlign: "center",
  },
});
