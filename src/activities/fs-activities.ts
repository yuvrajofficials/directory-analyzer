import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { InsertDataToPinot } from "./kafka-activities";
import { BenchmarkResult, DirectoryStats, FileSizeStats } from "../interfaces/interface";

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
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

async function benchmark(
  fn: () => Promise<unknown> | unknown,
  concurrency: number = 5
): Promise<BenchmarkResult> {
  const start = performance.now();
  const memStart = process.memoryUsage().heapUsed;
  const cpuStart = process.cpuUsage();

  const tasks = Array.from({ length: concurrency }, fn);
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

function analyzeDirectory(
  dirPath: string,
  depth: number = 0,
  stats?: DirectoryStats,
  rawFileSizes?: number[]
): DirectoryStats {
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

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      analyzeDirectory(fullPath, depth + 1, stats, rawFileSizes);
      stats.maxDepth = Math.max(stats.maxDepth, depth + 1);
    } else {
      stats.fileCount++;
      stats.totalSize += stat.size;
      rawFileSizes.push(stat.size);

      const ext = path.extname(entry) || "NO_EXT";
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

      stats.charCount += readFileSafe(fullPath).length;
    }
  }

  stats.fileSizes = computeStats(rawFileSizes);

  return stats;
}

export async function analyzeAndBenchmark(directory: string) {
  const rawFileSizes: number[] = [];

  const stats = analyzeDirectory(directory, 0, undefined, rawFileSizes);

  const perf = await benchmark(async () => analyzeDirectory(directory, 0, undefined, []), 5);

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

export async function getSubDirectories(dir: string): Promise<string[]> {
  return fs
    .readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((fullPath) => fs.statSync(fullPath).isDirectory());
}
