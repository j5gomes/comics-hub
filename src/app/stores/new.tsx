import { useRouter } from "expo-router";
import { StoreForm } from "../../components/StoreForm";
import { useCreateStore } from "../../hooks/useStores";

export default function NewStoreScreen() {
  const router = useRouter();
  const createStore = useCreateStore();

  const handleSubmit = async (
    data: Parameters<typeof createStore.mutateAsync>[0]
  ) => {
    await createStore.mutateAsync(data);
    router.back();
  };

  return (
    <StoreForm onSubmit={handleSubmit} isLoading={createStore.isPending} />
  );
}
