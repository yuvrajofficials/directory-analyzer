export interface FileSizeStats {
  min: number;
  max: number;
  avg: number;
}

export interface BenchmarkResult {
  processingTimeMs: number;
  memoryUsedMB: number;
  cpuTimeMs: number;
  throughput: number;
  latencyMs: number;
}

export interface DirectoryStats {
  fileCount: number;
  totalSize: number;
  fileSizes: number[] | FileSizeStats;
  charCount: number;
  lineCounts: Record<string, number>;
  wordFrequencies: Record<string, number>;
  fileTypes: Record<string, number>;
  maxDepth: number;
}
