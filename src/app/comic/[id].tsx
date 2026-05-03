import { View, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ComicForm } from "../../components/ComicForm";
import {
  useComic,
  useUpdateComic,
  useDeleteComic,
} from "../../hooks/useComics";
import { processAndStoreImage } from "../../lib/images";
import { Button } from "../../components/ui";

export default function EditComicScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: comic, isLoading } = useComic(id);
  const updateComic = useUpdateComic();
  const deleteComic = useDeleteComic();

  const handleSubmit = async (
    data: Parameters<typeof updateComic.mutateAsync>[0]["data"],
  ) => {
    let coverPath = data.cover_image_local;

    if (
      coverPath &&
      coverPath !== comic?.cover_image_local &&
      !coverPath.includes("covers/")
    ) {
      coverPath = await processAndStoreImage(coverPath, id);
    }

    await updateComic.mutateAsync({
      id,
      data: { ...data, cover_image_local: coverPath },
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Comic",
      `Are you sure you want to delete "${comic?.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteComic.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  };

  if (isLoading || !comic) {
    return <View style={styles.container} />;
  }

  return (
    <ComicForm
      initialData={comic}
      onSubmit={handleSubmit}
      isLoading={updateComic.isPending}
      footer={
        <Button
          title="Delete Comic"
          variant="danger"
          onPress={handleDelete}
          loading={deleteComic.isPending}
          style={styles.deleteButton}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  deleteButton: {
    marginTop: 16,
  },
});
