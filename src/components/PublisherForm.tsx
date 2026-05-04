import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Input, MultiSelect, Button } from "./ui";
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  COMIC_TYPES,
  COMIC_TYPE_LABELS,
} from "../lib/constants";
import type { PublisherFormData, Publisher } from "../types";

type Props = {
  initialData?: Publisher | null;
  onSubmit: (data: PublisherFormData) => void;
  isLoading: boolean;
  footer?: React.ReactNode;
};

export function PublisherForm({ initialData, onSubmit, isLoading, footer }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [languages, setLanguages] = useState<string[]>(
    initialData ? JSON.parse(initialData.languages) : []
  );
  const [comicTypes, setComicTypes] = useState<string[]>(
    initialData ? JSON.parse(initialData.comic_types) : []
  );

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      languages,
      comic_types: comicTypes,
      logo_local: null,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Publisher name"
      />

      <MultiSelect
        label="Languages"
        options={LANGUAGES.map((l) => ({ label: LANGUAGE_LABELS[l], value: l }))}
        values={languages}
        onChange={setLanguages}
      />

      <MultiSelect
        label="Comic Types"
        options={COMIC_TYPES.map((t) => ({
          label: COMIC_TYPE_LABELS[t],
          value: t,
        }))}
        values={comicTypes}
        onChange={setComicTypes}
      />

      <Button
        title={initialData ? "Save Changes" : "Add Publisher"}
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
