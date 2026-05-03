import { File } from "expo-file-system";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { db } from "../../../db";
import { comics } from "../../../db/schema";
import { getPocketBaseInstance } from "../pocketbase";
import { getCoverPath, ensureCoversDir } from "../images";

/**
 * Upload local images that haven't been synced yet.
 */
export async function pushImages(): Promise<number> {
  const pb = getPocketBaseInstance();
  if (!pb) return 0;

  const pending = await db
    .select()
    .from(comics)
    .where(
      and(
        isNotNull(comics.cover_image_local),
        isNull(comics.cover_image_remote),
        isNotNull(comics.remote_id),
        isNull(comics.deleted_at)
      )
    )
    .all();

  let uploaded = 0;

  for (const comic of pending) {
    try {
      if (!comic.cover_image_local || !comic.remote_id) continue;

      const file = new File(comic.cover_image_local);
      if (!file.exists) continue;

      const formData = new FormData();
      formData.append("cover_image", {
        uri: comic.cover_image_local,
        name: `${comic.id}.jpg`,
        type: "image/jpeg",
      } as any);

      await pb.collection("comics").update(comic.remote_id, formData);

      const updated = await pb.collection("comics").getOne(comic.remote_id);

      await db
        .update(comics)
        .set({ cover_image_remote: updated.cover_image })
        .where(eq(comics.id, comic.id));

      uploaded++;
    } catch {
      // Continue with next image
    }
  }

  return uploaded;
}

/**
 * Download remote images that are missing locally.
 */
export async function pullImages(): Promise<number> {
  const pb = getPocketBaseInstance();
  if (!pb) return 0;

  await ensureCoversDir();

  const pending = await db
    .select()
    .from(comics)
    .where(
      and(
        isNotNull(comics.cover_image_remote),
        isNull(comics.cover_image_local),
        isNotNull(comics.remote_id),
        isNull(comics.deleted_at)
      )
    )
    .all();

  let downloaded = 0;

  for (const comic of pending) {
    try {
      if (!comic.cover_image_remote || !comic.remote_id) continue;

      const url = pb.files.getURL(
        {
          id: comic.remote_id,
          collectionId: "comics",
          collectionName: "comics",
        },
        comic.cover_image_remote,
        { thumb: "400x600" }
      );

      const localPath = getCoverPath(comic.id);
      await File.downloadFileAsync(url, new File(localPath));

      await db
        .update(comics)
        .set({ cover_image_local: localPath })
        .where(eq(comics.id, comic.id));

      downloaded++;
    } catch {
      // Continue with next image
    }
  }

  return downloaded;
}
