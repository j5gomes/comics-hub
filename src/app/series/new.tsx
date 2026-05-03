import { useRouter } from "expo-router";
import { SeriesForm } from "../../components/SeriesForm";
import { useCreateSeries } from "../../hooks/useSeries";

export default function NewSeriesScreen() {
  const router = useRouter();
  const createSeries = useCreateSeries();

  return (
    <SeriesForm
      onSubmit={async (data) => {
        await createSeries.mutateAsync(data);
        router.back();
      }}
      isLoading={createSeries.isPending}
    />
  );
}
