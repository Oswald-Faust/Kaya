import "./load-env";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/marketing_os";
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(`Refusing to reset a non-local database: ${new URL(url).host}`);
  }
  const sql = postgres(url, { max: 1 });
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await sql.end();
  console.log("Local database reset.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
