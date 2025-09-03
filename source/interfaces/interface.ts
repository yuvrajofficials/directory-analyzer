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
  dirPath: string;
  fileCount: number;
  totalSize: number;
  fileSizes: FileSizeStats;
  charCount: number;
  fileTypes: Record<string, number>;
  maxDepth: number;
}
