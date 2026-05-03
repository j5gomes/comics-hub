import { useRouter, useLocalSearchParams } from "expo-router";
import { ComicForm } from "../../components/ComicForm";
import { useCreateComic } from "../../hooks/useComics";
import { processAndStoreImage } from "../../lib/images";
import { randomUUID } from "expo-crypto";

export default function NewComicScreen() {
  const router = useRouter();
  const { seriesId } = useLocalSearchParams<{ seriesId?: string }>();
  const createComic = useCreateComic();

  const handleSubmit = async (data: Parameters<typeof createComic.mutateAsync>[0]) => {
    let coverPath = data.cover_image_local;

    if (coverPath && !coverPath.includes("covers/")) {
      const id = randomUUID();
      coverPath = await processAndStoreImage(coverPath, id);
    }

    await createComic.mutateAsync({ ...data, cover_image_local: coverPath });
    router.back();
  };

  return (
    <ComicForm
      onSubmit={handleSubmit}
      isLoading={createComic.isPending}
      defaultSeriesId={seriesId}
    />
  );
}
