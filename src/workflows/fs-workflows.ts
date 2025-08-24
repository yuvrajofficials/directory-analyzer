import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/fs-activities";

const { analyzeAndBenchmark } = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
});

export async function fsWorkflow(directory: string): Promise<string> {
  const result = await analyzeAndBenchmark(directory);

  return `Results pushed successfully`;
}
