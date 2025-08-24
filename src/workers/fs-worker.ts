import { Worker } from "@temporalio/worker";
import * as activities from "../activities/fs-activities";

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve("../workflows/fs-workflows"),
    activities,
    taskQueue: "fs-task-queue",
  });

  console.log("Worker started");
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
