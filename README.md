# Directory Analyzer

This project analyzes directories and files, computes statistics, and benchmarks performance.  
It also integrates with **Temporal** for workflow orchestration and can push results to **Apache Pinot** for analytics.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Temporal Server
```bash
npm run temporal
```

### 3. Run Worker
```bash
npm run start:worker
```

### 4. Run Client
```bash
npm run start:client
```


## 📂 Available Scripts

```bash
npm run temporal → Starts the Temporal server

npm run start:worker → Starts the Temporal worker

npm run start:client → Runs the client to trigger workflows
```

## 🛠 Features

- Analyze directory structure (file count, sizes, extensions, depth, etc.)

+ Compute file statistics (min, max, avg size)

- Benchmark performance (CPU, memory, throughput, latency)

- Insert results into Apache Pinot for real-time analytics

- Workflow orchestration with Temporal

## ✅ Requirements

- Node.js (>=16)

- Temporal (via npm run temporal)

- Apache Pinot (if you want analytics integration)

## 📊 Output

- The analysis generates a summary object with:

- Directory stats (file count, size, depth, etc.)

- Performance metrics (processing time, memory, CPU usage)

- File type breakdown