import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { InsertDataToPinot } from "./kafka-activities";
import { BenchmarkResult, DirectoryStats, FileSizeStats } from "../interfaces/interface";


// ---------- Utility: read file safely ----------
function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

// ---------- Word frequency counter ----------
function getWordFrequency(text: string): Record<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  return freq;
}

// ---------- Recursive directory traversal ----------
function analyzeDirectory(
  dirPath: string,
  depth: number = 0,
  stats: DirectoryStats | null = null
): DirectoryStats {
  if (!stats) {
    stats = {
      fileCount: 0,
      totalSize: 0,
      fileSizes: [],
      charCount: 0,
      lineCounts: {},
      wordFrequencies: {},
      fileTypes: {},
      maxDepth: depth,
    };
  }

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      analyzeDirectory(fullPath, depth + 1, stats);
      stats.maxDepth = Math.max(stats.maxDepth, depth + 1);
    } else {
      stats.fileCount++;
      stats.totalSize += stat.size;

      if (Array.isArray(stats.fileSizes)) {
        stats.fileSizes.push(stat.size);
      }

      const ext = path.extname(file) || "NO_EXT";
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

      const content = readFileSafe(fullPath);
      stats.charCount += content.length;

      const lines = content.split("\n").length;
      stats.lineCounts[fullPath] = lines;

      const words = getWordFrequency(content);
      for (const [word, count] of Object.entries(words)) {
        stats.wordFrequencies[word] =
          (stats.wordFrequencies[word] || 0) + count;
      }
    }
  }

  return stats;
}

// ---------- Compute min, max, avg ----------
function computeStats(fileSizes: number[]): FileSizeStats {
  if (fileSizes.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...fileSizes);
  const max = Math.max(...fileSizes);
  const avg = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length;
  return { min, max, avg };
}

// ---------- Benchmark wrapper ----------
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

export async function analyzeAndBenchmark(directory: string) {
  const stats: DirectoryStats = {
    fileCount: 0,
    totalSize: 0,
    fileSizes: [],
    charCount: 0,
    lineCounts: {},
    wordFrequencies: {},
    fileTypes: {},
    maxDepth: 0,
  };

  function processFile(filePath: string, stat: fs.Stats, depth: number) {
    stats.fileCount++;
    stats.totalSize += stat.size;
    if (Array.isArray(stats.fileSizes)) stats.fileSizes.push(stat.size);

    const ext = path.extname(filePath) || "NO_EXT";
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

    const content = readFileSafe(filePath);
    stats.charCount += content.length;

    const lines = content.split("\n").length;
    stats.lineCounts[filePath] = lines;

    const words = getWordFrequency(content);
    for (const [word, count] of Object.entries(words)) {
      stats.wordFrequencies[word] = (stats.wordFrequencies[word] || 0) + count;
    }

    console.log({
      filePath,
      size: stat.size,
      ext,
      lines,
      ts: new Date().toISOString(),
    })
    // 🔥 push an incremental record to Kafka
    InsertDataToPinot({
      filePath,
      size: stat.size,
      ext,
      lines,
      ts: Date.now(),
    }).catch(console.error);
  }

  function walk(dirPath: string, depth: number = 0) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath, depth + 1);
        stats.maxDepth = Math.max(stats.maxDepth, depth + 1);
      } else {
        processFile(fullPath, stat, depth);
      }
    }
  }

  // Run analysis
  walk(directory);

  if (Array.isArray(stats.fileSizes)) {
    stats.fileSizes = computeStats(stats.fileSizes);
  }

  const perf = await benchmark(async () => analyzeDirectory(directory), 5);

  const summary = {
    ...stats,
    performance: perf,
    ts: Date.now(),
  };

  // 🔥 push final summary
  await InsertDataToPinot({ summary });

  return summary;
}
