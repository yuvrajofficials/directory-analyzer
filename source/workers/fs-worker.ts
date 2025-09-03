import { Worker } from "@temporalio/worker";
import * as activities from "../activities/fs-activities";

async function runWorker(id: number) {
  const worker = await Worker.create({
    workflowsPath: require.resolve("../workflows/fs-workflows"),
    activities,
    taskQueue: "fs-task-queue",
    // concurrency tuning
    maxConcurrentActivityTaskExecutions: 50, // allow more parallelism if CPU permits
    maxConcurrentWorkflowTaskExecutions: 20,
  });

  console.log(`🚀 Worker ${id} started`);
  await worker.run();
}

async function main() {
  const numWorkers = parseInt(process.argv[2] || "1", 10);

  console.log(`⚡ Launching ${numWorkers} worker(s)...`);

  const workers = Array.from({ length: numWorkers }, (_, i) =>
    runWorker(i + 1)
  );

  await Promise.all(workers);
}

main().catch((err) => {
  console.error("❌ Worker failed:", err);
  process.exit(1);
});
