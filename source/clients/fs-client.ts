import { Connection, Client } from "@temporalio/client";
import fs from "fs";
import path from "path";

async function runAll(nodeModulesPath: string, maxParallel: number, concurrency: number) {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const subDirs = fs
    .readdirSync(nodeModulesPath)
    .map((name) => path.join(nodeModulesPath, name))
    .filter((fullPath) => fs.statSync(fullPath).isDirectory());

  console.log(`📂 Found ${subDirs.length} subdirectories.`);

  for (let i = 0; i < subDirs.length; i += maxParallel) {
    const batch = subDirs.slice(i, i + maxParallel);
    console.log(`🚀 Starting batch of ${batch.length} workflows...`);

    const handles = await Promise.all(
      batch.map((dir) =>
        client.workflow.start("fsWorkflows", {
          args: [dir, concurrency], // pass concurrency into workflow
          taskQueue: "fs-task-queue",
          workflowId: `fs-${path.basename(dir)}-${Date.now()}`,
        })
      )
    );

    const results = await Promise.allSettled(handles.map((h) => h.result()));

    results.forEach((res, idx) => {
      const dir = path.basename(batch[idx]);
      if (res.status === "fulfilled") {
        console.log(`✅ [${dir}] ${res.value}`);
      } else {
        console.error(`❌ [${dir}] Failed:`, res.reason);
      }
    });
  }
}

// CLI args → node client.js [maxParallel] [concurrencyPerWorkflow]
const maxParallel = Math.max(1, parseInt(process.argv[2] || "2", 10));
const concurrency = Math.max(1, parseInt(process.argv[3] || "5", 10));

runAll(
  "/Users/yuvraj.sankilwar/Documents/Files/typescript-development/directory-analyzer/node_modules",
  maxParallel,
  concurrency
).catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
