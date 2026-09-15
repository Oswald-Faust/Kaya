import "./load-env";
import { seedDemoWorkspace } from "@/server/seed/seed-demo";

async function main() {
  const result = await seedDemoWorkspace();
  if (result.skipped) {
    console.log(`Demo workspace "${result.workspaceSlug}" already exists. Run \`pnpm db:reset\` to rebuild it.`);
  } else {
    console.log(`Seeded demo workspace "${result.workspaceSlug}" (${result.metricRows} metric rows, ${result.experiments} experiments).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
