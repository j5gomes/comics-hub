import { Paths, File, Directory } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const COVERS_DIR_NAME = "covers";

function getCoversDir(): Directory {
  return new Directory(Paths.document, COVERS_DIR_NAME);
}

export function getCoverPath(id: string): string {
  return new File(getCoversDir(), `${id}.jpg`).uri;
}

export async function ensureCoversDir() {
  const dir = getCoversDir();
  if (!dir.exists) {
    dir.create();
  }
}

export async function processAndStoreImage(
  uri: string,
  id: string
): Promise<string> {
  await ensureCoversDir();

  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );

  const destPath = getCoverPath(id);
  const sourceFile = new File(result.uri);
  const destFile = new File(destPath);

  // Delete dest if it already exists
  if (destFile.exists) {
    destFile.delete();
  }

  sourceFile.move(destFile);

  return destPath;
}

export async function deleteCoverImage(id: string) {
  const file = new File(getCoverPath(id));
  if (file.exists) {
    file.delete();
  }
}

// --- Author photos ---

const AUTHOR_PHOTOS_DIR_NAME = "author_photos";

function getAuthorPhotosDir(): Directory {
  return new Directory(Paths.document, AUTHOR_PHOTOS_DIR_NAME);
}

export function getAuthorPhotoPath(id: string): string {
  return new File(getAuthorPhotosDir(), `${id}.jpg`).uri;
}

export async function ensureAuthorPhotosDir() {
  const dir = getAuthorPhotosDir();
  if (!dir.exists) {
    dir.create();
  }
}

export async function processAndStoreAuthorPhoto(
  uri: string,
  id: string
): Promise<string> {
  await ensureAuthorPhotosDir();

  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 400 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );

  const destPath = getAuthorPhotoPath(id);
  const sourceFile = new File(result.uri);
  const destFile = new File(destPath);

  if (destFile.exists) {
    destFile.delete();
  }

  sourceFile.move(destFile);

  return destPath;
}

export async function deleteAuthorPhoto(id: string) {
  const file = new File(getAuthorPhotoPath(id));
  if (file.exists) {
    file.delete();
  }
}
