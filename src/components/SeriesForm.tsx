import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Input, Select, Button } from "./ui";
import { usePublishers } from "../hooks/usePublishers";
import type { Series, SeriesFormData } from "../types";

type Props = {
  initialData?: Series | null;
  onSubmit: (data: SeriesFormData) => void;
  isLoading: boolean;
  footer?: React.ReactNode;
};

export function SeriesForm({ initialData, onSubmit, isLoading, footer }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [publisherId, setPublisherId] = useState(initialData?.publisher_id ?? "");

  const { data: publishersList } = usePublishers();

  const publisherOptions = [
    { label: "None", value: "" },
    ...(publishersList?.map((p) => ({ label: p.name, value: p.id })) ?? []),
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      publisher_id: publisherId || null,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Series title"
      />

      <Select
        label="Publisher"
        options={publisherOptions}
        value={publisherId}
        onChange={setPublisherId}
      />

      <Button
        title={initialData ? "Save Changes" : "Create Series"}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!title.trim()}
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
