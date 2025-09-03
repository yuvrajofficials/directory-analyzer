import * as fsp from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import { InsertDataToPinot } from "./kafka-activities";
import { BenchmarkResult, DirectoryStats, FileSizeStats } from "../interfaces/interface";

// ---------- Utility ----------
async function readFileSafe(filePath: string): Promise<string> {
  try {
    return await fsp.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function computeStats(fileSizes: number[]): FileSizeStats {
  if (fileSizes.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...fileSizes);
  const max = Math.max(...fileSizes);
  const avg = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length;
  return { min, max, avg };
}

// ---------- Benchmark ----------
async function benchmark(
  fn: () => Promise<unknown>,
  concurrency: number = 5
): Promise<BenchmarkResult> {
  const start = performance.now();
  const memStart = process.memoryUsage().heapUsed;
  const cpuStart = process.cpuUsage();

  const tasks = Array.from({ length: concurrency }, () => fn());
  await Promise.all(tasks);

  const end = performance.now();
  const memEnd = process.memoryUsage().heapUsed;
  const cpuEnd = process.cpuUsage(cpuStart);

  return {
    processingTimeMs: end - start,
    memoryUsedMB: (memEnd - memStart) / 1024 / 1024,
    cpuTimeMs: (cpuEnd.user + cpuEnd.system) / 1000,
    throughput: concurrency / ((end - start) / 1000),
    latencyMs: (end - start) / concurrency,
  };
}

// ---------- Analyzer ----------
export async function analyzeDirectory(
  dirPath: string,
  depth: number = 0,
  stats?: DirectoryStats,
  rawFileSizes?: number[]
): Promise<DirectoryStats> {
  if (!stats) {
    stats = {
      dirPath,
      fileCount: 0,
      totalSize: 0,
      charCount: 0,
      fileTypes: {},
      maxDepth: depth,
      fileSizes: { min: 0, max: 0, avg: 0 },
    };
  }
  if (!rawFileSizes) rawFileSizes = [];

  const entries = await fsp.readdir(dirPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath, depth + 1, stats, rawFileSizes);
        stats!.maxDepth = Math.max(stats!.maxDepth, depth + 1);
      } else {
        const stat = await fsp.stat(fullPath);
        stats!.fileCount++;
        stats!.totalSize += stat.size;
        rawFileSizes!.push(stat.size);

        const ext = path.extname(entry.name) || "NO_EXT";
        stats!.fileTypes[ext] = (stats!.fileTypes[ext] || 0) + 1;

        const content = await readFileSafe(fullPath);
        stats!.charCount += content.length;
      }
    })
  );

  stats.fileSizes = computeStats(rawFileSizes);
  return stats;
}

// ---------- Combined ----------
export async function analyzeAndBenchmark(directory: string) {
  const rawFileSizes: number[] = [];
  const stats = await analyzeDirectory(directory, 0, undefined, rawFileSizes);

  const perf = await benchmark(
    async () => analyzeDirectory(directory, 0, undefined, []),
    5
  );

  const summary = {
    dirPath: stats.dirPath,
    fileCount: stats.fileCount,
    totalSize: stats.totalSize,
    charCount: stats.charCount,
    maxDepth: stats.maxDepth,
    fileSizes: stats.fileSizes,
    fileTypes: stats.fileTypes,
    performance: perf,
    ts: Date.now(),
  };

  console.log("Summary:", summary);
  await InsertDataToPinot(summary);

  return summary;
}

// ---------- Utilities ----------
export async function* streamSubDirectories(
  directory: string,
  pageSize = 1000
) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  let page: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      page.push(path.join(directory, entry.name));
      if (page.length >= pageSize) {
        yield page;
        page = [];
      }
    }
  }
  if (page.length) yield page;
}

export async function getSubDirectories(dir: string): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name));
}

export async function analyzeDirectoryActivity(
  dirPath: string
): Promise<DirectoryStats> {
  return analyzeDirectory(dirPath);
}

export async function benchmarkActivity(
  dirPath: string
): Promise<BenchmarkResult> {
  return benchmark(() => analyzeDirectory(dirPath), 5);
}

export async function insertToPinotActivity(summary: any): Promise<void> {
  await InsertDataToPinot(summary);
}
