import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "fs-client",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function produceDummyData() {
  await producer.connect();

  // fs-analysis-topic
  const analysisRecords = [
    {
      ts: 1695936000000,
      ingestionTime: Date.now(),
      maxDepth: 5,
      fileCount: 120,
      totalSize: 10485760,
      charCount: 987654,
      minFileSize: 102,
      maxFileSize: 204800,
      avgFileSize: 87381.33,
      processingTimeMs: 350,
      memoryUsedMB: 120,
      cpuTimeMs: 300,
      throughput: 0.34,
      latencyMs: 70
    },
    {
      ts: 1695936060000,
      ingestionTime: Date.now(),
      maxDepth: 6,
      fileCount: 150,
      totalSize: 20485760,
      charCount: 1987654,
      minFileSize: 105,
      maxFileSize: 305000,
      avgFileSize: 102345.67,
      processingTimeMs: 450,
      memoryUsedMB: 150,
      cpuTimeMs: 400,
      throughput: 0.37,
      latencyMs: 75
    }
  ];

  for (const record of analysisRecords) {
    await producer.send({
      topic: "fs-analysis-topic",
      messages: [{ value: JSON.stringify(record) }],
    });
  }

  // fs-filetypes-topic
  const fileTypeRecords = [
    { ts: 1695936000000, extension: ".js", count: 40 },
    { ts: 1695936000000, extension: ".ts", count: 30 },
    { ts: 1695936000000, extension: ".json", count: 20 },
    { ts: 1695936060000, extension: ".js", count: 45 },
    { ts: 1695936060000, extension: ".ts", count: 25 },
    { ts: 1695936060000, extension: ".json", count: 22 }
  ].map(r => ({ ...r, ingestionTime: Date.now() }));

  for (const record of fileTypeRecords) {
    await producer.send({
      topic: "fs-filetypes-topic",
      messages: [{ value: JSON.stringify(record) }],
    });
  }

  console.log("Dummy data produced to Kafka!");
  await producer.disconnect();
}

produceDummyData().catch(console.error);
