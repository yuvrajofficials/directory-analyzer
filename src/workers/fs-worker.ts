// import { Worker } from "@temporalio/worker";
// import * as activities from "../activities/fs-activities";

// async function run() {
//   const worker = await Worker.create({
//     workflowsPath: require.resolve("../workflows/fs-workflows"),
//     activities,
//     taskQueue: "fs-task-queue",
//   });

//   console.log("Worker started");
//   await worker.run();
// }

// run().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });


import { Worker } from "@temporalio/worker";
import * as activities from "../activities/fs-activities";

async function runWorker(id: number) {
  const worker = await Worker.create({
    workflowsPath: require.resolve("../workflows/fs-workflows"),
    activities,
    taskQueue: "fs-task-queue",
  });

  console.log(`🚀 Worker ${id} started`);
  await worker.run();
}

async function main() {
  const numWorkers = parseInt(process.argv[3] || "1", 10);

  console.log(`\n⚡ Launching ${numWorkers} workers...\n`);

  const start = Date.now();
  const workers = Array.from({ length: numWorkers }, (_, i) => runWorker(i + 1));

  await Promise.all(workers);

  const end = Date.now();
  console.log(`\n✅ All workers stopped. Total time: ${(end - start) / 1000}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
