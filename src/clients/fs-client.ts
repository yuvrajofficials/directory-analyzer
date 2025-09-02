import { fsWorkflow } from "../workflows/fs-workflows";
import { Connection, Client } from "@temporalio/client";
import fs from "fs";
import path from "path";

async function runAll(nodeModulesPath: string, maxParallel: number) {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const subDirs = fs
    .readdirSync(nodeModulesPath)
    .map((name) => path.join(nodeModulesPath, name))
    .filter((fullPath) => fs.statSync(fullPath).isDirectory());

  // Start workflows in batches of `maxParallel`
  for (let i = 0; i < subDirs.length; i += maxParallel) {
    const batch = subDirs.slice(i, i + maxParallel);

    // Start workflows for this batch
    const handles = await Promise.all(
      batch.map((dir) =>
        client.workflow.start(fsWorkflow, {
          args: [dir],
          taskQueue: "fs-task-queue",
          workflowId: `fs-workflow-${dir.replace(/\W/g, "_")}-${Date.now()}`,
        })
      )
    );

    console.log(`🚀 Started ${handles.length} workflows in parallel.`);

    // Wait for all results in this batch
    const results = await Promise.all(handles.map((h) => h.result()));
    results.forEach((r) => console.log(r));
  }
}

// pass desired parallelism as CLI arg
const maxParallel = parseInt(process.argv[2] || "2", 10);

runAll(
  "/Users/yuvraj.sankilwar/Documents/Files/typescript-development/directory-analyzer/node_modules",
  maxParallel
).catch((err) => {
  console.error(err);
  process.exit(1);
});
