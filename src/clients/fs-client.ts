import { fsWorkflow } from "../workflows/fs-workflows";
import { Connection, Client } from "@temporalio/client";
import fs from "fs";
import path from "path";

async function runAll(nodeModulesPath: string) {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const subDirs = fs
    .readdirSync(nodeModulesPath)
    .map((name) => path.join(nodeModulesPath, name))
    .filter((fullPath) => fs.statSync(fullPath).isDirectory());

  for (const dir of subDirs) {
    const workflowId = `fs-workflow-${dir.replace(/\W/g, "_")}-${Date.now()}`;
    const handle = await client.workflow.start(fsWorkflow, {
      args: [dir],
      taskQueue: "fs-task-queue",
      workflowId,
    });

    console.log(`Started workflow for ${dir}: ${handle.workflowId}`);
    const result = await handle.result();
    console.log(result);
  }
}

runAll("/Users/yuvraj.sankilwar/Documents/Files/typescript-development/directory-analyzer/node_modules")
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
