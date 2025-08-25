  "schemaName": "fs_analysis",
  "dimensionFieldSpecs": [
    { "name": "dirPath", "dataType": "STRING" },
    { "name": "ts", "dataType": "LONG" },       
    { "name": "maxDepth", "dataType": "INT" }
  ],
  "metricFieldSpecs": [
    { "name": "fileCount", "dataType": "INT" },
    { "name": "totalSize", "dataType": "LONG" },
    { "name": "charCount", "dataType": "LONG" },
    { "name": "minFileSize", "dataType": "LONG" },
    { "name": "maxFileSize", "dataType": "LONG" },
    { "name": "avgFileSize", "dataType": "DOUBLE" },
    { "name": "processingTimeMs", "dataType": "DOUBLE" },
    { "name": "memoryUsedMB", "dataType": "DOUBLE" },
    { "name": "cpuTimeMs", "dataType": "DOUBLE" },
    { "name": "throughput", "dataType": "DOUBLE" },
    { "name": "latencyMs", "dataType": "DOUBLE" }
  ],
