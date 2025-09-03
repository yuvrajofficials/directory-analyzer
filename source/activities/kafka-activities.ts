import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "fs-client",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();
let isConnected = false;

export async function InsertDataToPinot(summary: any) {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }

  const { dirPath, fileTypes, fileSizes, performance, ...rest } = summary;

  
  const mainRecord = {
    dirPath,
    ...rest,
    ingestionTime: Date.now(),
    minFileSize: fileSizes?.min ?? 0,
    maxFileSize: fileSizes?.max ?? 0,
    avgFileSize: fileSizes?.avg ?? 0,
    processingTimeMs: performance?.processingTimeMs ?? 0,
    memoryUsedMB: performance?.memoryUsedMB ?? 0,
    cpuTimeMs: performance?.cpuTimeMs ?? 0,
    throughput: performance?.throughput ?? 0,
    latencyMs: performance?.latencyMs ?? 0,
  };

  console.log("Main record for fs-analysis-topic:", mainRecord);

  await producer.send({
    topic: "fs-analysis-topic",
    messages: [{ key: dirPath, value: JSON.stringify(mainRecord) }], 
  });

  if (fileTypes && typeof fileTypes === "object") {
    const messages = Object.entries(fileTypes).map(([extension, count]) => ({
      key: dirPath, 
      value: JSON.stringify({
        dirPath,      
        ts: summary.ts, 
        extension,
        count,
        ingestionTime: Date.now(),
      }),
    }));

    if (messages.length > 0) {
      await producer.send({
        topic: "fs-filetypes-topic",
        messages,
      });
    }
  }

  console.log("Summary and fileTypes published to Kafka with dirPath as key!");
}

