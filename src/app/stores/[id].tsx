import { View, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StoreForm } from "../../components/StoreForm";
import { useStore, useUpdateStore, useDeleteStore } from "../../hooks/useStores";
import { Button } from "../../components/ui";

export default function EditStoreScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading } = useStore(id);
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();

  const handleSubmit = async (
    data: Parameters<typeof updateStore.mutateAsync>[0]["data"]
  ) => {
    await updateStore.mutateAsync({ id, data });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Store",
      `Are you sure you want to delete "${store?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteStore.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading || !store) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StoreForm
        initialData={store}
        onSubmit={handleSubmit}
        isLoading={updateStore.isPending}
      />
      <View style={styles.deleteContainer}>
        <Button
          title="Delete Store"
          variant="danger"
          onPress={handleDelete}
          loading={deleteStore.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  deleteContainer: {
    padding: 16,
    paddingTop: 0,
  },
});
