import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("comics-hub.db");

export const db = drizzle(expo, { schema });
export const DATABASE_PATH = expo.databasePath;
export { expo as expoDb };
