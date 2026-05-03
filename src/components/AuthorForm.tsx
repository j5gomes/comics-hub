import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Input, MultiSelect, Button } from "./ui";
import { ImagePickerButton } from "./ImagePickerButton";
import { useImagePicker } from "../hooks/useImagePicker";
import { AUTHOR_ROLES, AUTHOR_ROLE_LABELS } from "../lib/constants";
import type { AuthorFormData, Author } from "../types";

type Props = {
  initialData?: Author | null;
  onSubmit: (data: AuthorFormData) => void;
  isLoading: boolean;
  footer?: React.ReactNode;
};

export function AuthorForm({
  initialData,
  onSubmit,
  isLoading,
  footer,
}: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [roles, setRoles] = useState<string[]>(() => {
    if (!initialData?.roles) return [];
    try {
      return JSON.parse(initialData.roles);
    } catch {
      return [];
    }
  });

  const { imageUri, setImageUri, pickFromGallery, pickFromCamera, clearImage } =
    useImagePicker([1, 1]);

  // Set initial photo if editing
  useState(() => {
    if (initialData?.photo_local) {
      setImageUri(initialData.photo_local);
    }
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), roles, photo_local: imageUri });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ImagePickerButton
        imageUri={imageUri}
        onPickFromGallery={pickFromGallery}
        onPickFromCamera={pickFromCamera}
        onClear={clearImage}
        label="Photo"
        size={100}
        shape="square"
      />

      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Author name"
      />

      <MultiSelect
        label="Roles"
        options={AUTHOR_ROLES.map((r) => ({
          label: AUTHOR_ROLE_LABELS[r],
          value: r,
        }))}
        values={roles}
        onChange={setRoles}
      />

      <Button
        title={initialData ? "Save Changes" : "Add Author"}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!name.trim()}
        style={styles.submitButton}
      />
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});
