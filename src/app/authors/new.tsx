import { useRouter } from "expo-router";
import { randomUUID } from "expo-crypto";
import { AuthorForm } from "../../components/AuthorForm";
import { useCreateAuthor } from "../../hooks/useAuthors";
import { processAndStoreAuthorPhoto } from "../../lib/images";
import type { AuthorFormData } from "../../types";

export default function NewAuthorScreen() {
  const router = useRouter();
  const createAuthor = useCreateAuthor();

  const handleSubmit = async (data: AuthorFormData) => {
    let photoPath = data.photo_local;
    if (photoPath && !photoPath.includes("author_photos/")) {
      photoPath = await processAndStoreAuthorPhoto(photoPath, randomUUID());
    }
    await createAuthor.mutateAsync({ ...data, photo_local: photoPath });
    router.back();
  };

  return (
    <AuthorForm onSubmit={handleSubmit} isLoading={createAuthor.isPending} />
  );
}
