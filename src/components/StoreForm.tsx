import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Input, Select, Button } from "./ui";
import { STORE_TYPES, STORE_TYPE_LABELS } from "../lib/constants";
import type { StoreFormData, Store } from "../types";

type Props = {
  initialData?: Store | null;
  onSubmit: (data: StoreFormData) => void;
  isLoading: boolean;
  footer?: React.ReactNode;
};

export function StoreForm({ initialData, onSubmit, isLoading, footer }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [storeType, setStoreType] = useState(
    initialData?.store_type ?? "physical"
  );

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      location: location.trim(),
      store_type: storeType,
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
        placeholder="Store name"
      />

      <Input
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Address or URL"
      />

      <Select
        label="Store Type"
        options={STORE_TYPES.map((t) => ({
          label: STORE_TYPE_LABELS[t],
          value: t,
        }))}
        value={storeType}
        onChange={setStoreType}
      />

      <Button
        title={initialData ? "Save Changes" : "Add Store"}
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
