import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/fs-activities";

// Extract activities with proper typing
const {
  analyzeDirectoryActivity,
  benchmarkActivity,
  insertToPinotActivity,
  getSubDirectories,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes", // more time for heavy analysis
  heartbeatTimeout: "30s", // ensures long-running activities heartbeat
});

export async function fsWorkflows(directory: string, concurrency: number) {
  const subDirs = await getSubDirectories(directory);
  let processed = 0;

  for (let i = 0; i < subDirs.length; i += concurrency) {
    const batch = subDirs.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (subDir) => {
        const [stats, perf] = await Promise.all([
          analyzeDirectoryActivity(subDir),
          benchmarkActivity(subDir),
        ]);

        const summary = { ...stats, performance: perf, ts: Date.now() };
        await insertToPinotActivity(summary); // Insert immediately

        return summary;
      })
    );

    processed += batchResults.length;
  }

  return `✅ Completed ${processed} subdirectory analyses in ${directory} (concurrency=${concurrency})`;
}
