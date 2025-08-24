// kafka-activities.ts
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "fs-client",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

let isConnected = false;

export async function InsertDataToPinot(record: any) {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }

  await producer.send({
    topic: "fs-results-topic",
    messages: [{ value: JSON.stringify(record) }],
  });
}
