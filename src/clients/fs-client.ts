import { Connection, Client } from "@temporalio/client";
import { fsWorkflow } from "../workflows/fs-workflows";

async function run(directory: string) {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const handle = await client.workflow.start(fsWorkflow, {
    args: [directory],
    taskQueue: "fs-task-queue",
    workflowId: "fs-workflow-" + Date.now(),
  });

  console.log(`Started workflow ${handle.workflowId}`);
  const result = await handle.result();

  console.log(result); // should print: Results written to analysis-xxxx.json
}

run(
  "/Users/yuvraj.sankilwar/Documents/Files/typescript-development/directory-analyzer/node_modules"
).catch((err) => {
  console.error(err);
  process.exit(1);
});
