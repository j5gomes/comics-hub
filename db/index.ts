import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "comics-hub.db";

const expo = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expo, { schema });

export { expo as expoDb };
