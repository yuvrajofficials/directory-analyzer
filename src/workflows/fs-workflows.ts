// fs-workflows.ts
import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/fs-activities";

const { analyzeAndBenchmark, getSubDirectories } = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
});

export async function fsWorkflow(nodeModulesPath: string): Promise<string> {
  const subDirs = await getSubDirectories(nodeModulesPath);

  await Promise.all(
    subDirs.map((dir) => analyzeAndBenchmark(dir))
  );

  return `Analysis completed for ${subDirs.length} directories.`;
}
