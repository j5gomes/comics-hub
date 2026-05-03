import PocketBase from "pocketbase";

const DEFAULT_URL = "http://127.0.0.1:8090";

let pb: PocketBase | null = null;

export async function getPocketBase(url?: string): Promise<PocketBase> {
  const baseUrl = url || DEFAULT_URL;

  if (pb && (pb as any).baseURL === baseUrl) {
    return pb;
  }

  pb = new PocketBase(baseUrl);
  return pb;
}

export function getPocketBaseInstance(): PocketBase | null {
  return pb;
}
