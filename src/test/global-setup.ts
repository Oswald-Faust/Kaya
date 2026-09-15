import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const TEST_URL = "postgres://localhost:5432/marketing_os_test";

export default async function setup() {
  process.env.DATABASE_URL = TEST_URL;
  const sql = postgres(TEST_URL, { max: 1, onnotice: () => {} });
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await migrate(drizzle(sql), { migrationsFolder: path.resolve(import.meta.dirname, "../../drizzle") });
  await sql.end();

  const { seedDemoWorkspace } = await import("@/server/seed/seed-demo");
  await seedDemoWorkspace();
}
