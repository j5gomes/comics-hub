import { View, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PublisherForm } from "../../components/PublisherForm";
import {
  usePublisher,
  useUpdatePublisher,
  useDeletePublisher,
} from "../../hooks/usePublishers";
import { Button } from "../../components/ui";

export default function EditPublisherScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: publisher, isLoading } = usePublisher(id);
  const updatePublisher = useUpdatePublisher();
  const deletePublisher = useDeletePublisher();

  const handleSubmit = async (
    data: Parameters<typeof updatePublisher.mutateAsync>[0]["data"]
  ) => {
    await updatePublisher.mutateAsync({ id, data });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Publisher",
      `Are you sure you want to delete "${publisher?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePublisher.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading || !publisher) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <PublisherForm
        initialData={publisher}
        onSubmit={handleSubmit}
        isLoading={updatePublisher.isPending}
      />
      <View style={styles.deleteContainer}>
        <Button
          title="Delete Publisher"
          variant="danger"
          onPress={handleDelete}
          loading={deletePublisher.isPending}
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
