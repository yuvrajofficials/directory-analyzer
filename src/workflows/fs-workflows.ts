import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/fs-activities";

const { analyzeDirectoryActivity, benchmarkActivity, insertToPinotActivity } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });

export async function fsWorkflows(directory: string) {
  const stats = await analyzeDirectoryActivity(directory);
  const perf = await benchmarkActivity(directory);

  const summary = {
    ...stats,
    performance: perf,
    ts: Date.now(),
  };

  await insertToPinotActivity(summary);

  return summary;
}
