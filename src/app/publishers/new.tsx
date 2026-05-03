import { useRouter } from "expo-router";
import { PublisherForm } from "../../components/PublisherForm";
import { useCreatePublisher } from "../../hooks/usePublishers";

export default function NewPublisherScreen() {
  const router = useRouter();
  const createPublisher = useCreatePublisher();

  const handleSubmit = async (
    data: Parameters<typeof createPublisher.mutateAsync>[0]
  ) => {
    await createPublisher.mutateAsync(data);
    router.back();
  };

  return (
    <PublisherForm
      onSubmit={handleSubmit}
      isLoading={createPublisher.isPending}
    />
  );
}
