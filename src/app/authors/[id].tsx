import { View, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthorForm } from "../../components/AuthorForm";
import {
  useAuthor,
  useUpdateAuthor,
  useDeleteAuthor,
} from "../../hooks/useAuthors";
import { processAndStoreAuthorPhoto } from "../../lib/images";
import { Button } from "../../components/ui";
import type { AuthorFormData } from "../../types";

export default function EditAuthorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: author, isLoading } = useAuthor(id);
  const updateAuthor = useUpdateAuthor();
  const deleteAuthor = useDeleteAuthor();

  const handleSubmit = async (data: AuthorFormData) => {
    let photoPath = data.photo_local;
    if (
      photoPath &&
      photoPath !== author?.photo_local &&
      !photoPath.includes("author_photos/")
    ) {
      photoPath = await processAndStoreAuthorPhoto(photoPath, id);
    }
    await updateAuthor.mutateAsync({
      id,
      data: { ...data, photo_local: photoPath },
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Author",
      `Are you sure you want to delete "${author?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAuthor.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  };

  if (isLoading || !author) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <AuthorForm
        initialData={author}
        onSubmit={handleSubmit}
        isLoading={updateAuthor.isPending}
      />

      <View style={styles.deleteContainer}>
        <Button
          title="Delete Author"
          variant="danger"
          onPress={handleDelete}
          loading={deleteAuthor.isPending}
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
