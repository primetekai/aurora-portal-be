import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as Pulsar from 'pulsar-client';
import { Semaphore } from 'async-mutex';
import { CrawlService } from '../crawl-view-360';

@Injectable()
export class PulsarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PulsarService.name);
  private client: Pulsar.Client;
  private consumers: Pulsar.Consumer[] = [];
  private producer: Pulsar.Producer;
  private readonly semaphore = new Semaphore(4); // Giới hạn 3 job chạy cùng lúc

  constructor(private readonly crawlService: CrawlService) {}

  private readonly numThreads = 3;

  private pulsarConfig = {
    serviceUrl: 'pulsar://160.191.164.16:6650',
    token:
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.4J50b6GlDDMB8TTLbQusLvEGaHQ4Yypj5zyN5RX4j2E',
  };

  async onModuleInit() {
    this.logger.log('🚀 Initializing Pulsar Service...');

    this.client = new Pulsar.Client({
      serviceUrl: this.pulsarConfig.serviceUrl,
      operationTimeoutSeconds: 10,
      authentication: new Pulsar.AuthenticationToken({
        token: this.pulsarConfig.token,
      }),
    });

    for (let i = 0; i < this.numThreads; i++) {
      await this.createConsumerWorker(i + 1);
      this.logger.log(`🧵 Started consumer thread #${i + 1}`);
    }

    this.producer = await this.client.createProducer({
      topic: 'persistent://public/default/property-capture-completed',
    });

    this.logger.log('🔵 Pulsar service initialized.');
  }

  private async createConsumerWorker(consumerId: number) {
    const consumer = await this.client.subscribe({
      topic: 'persistent://public/default/property-capture-request',
      subscription: 'property-capture-request-subscription',
      subscriptionType: 'Shared',
      receiverQueueSize: 100,
    });

    this.consumers.push(consumer);
    this.logger.log(`✅ Subscribed (Consumer #${consumerId})`);

    const loop = async () => {
      while (true) {
        try {
          const msg = await consumer.receive();
          this.handleCaptureRequest(msg, consumer, consumerId).catch((err) => {
            this.logger.error(
              `[Consumer #${consumerId}] ❌ Error in message handling: ${err.message}`,
            );
          });
        } catch (err) {
          this.logger.error(
            `[Consumer #${consumerId}] ❌ Receive failed: ${err.message}`,
          );
        }
      }
    };

    loop();
  }

  private async handleCaptureRequest(
    msg: Pulsar.Message,
    consumer: Pulsar.Consumer,
    consumerId: number,
  ) {
    const [_, release] = await this.semaphore.acquire();
    const messageId = msg.getMessageId().toString();

    try {
      const rawData = msg.getData().toString();
      this.logger.log(
        `📩 [Consumer #${consumerId}] Received (MessageID: ${messageId}): ${rawData}`,
      );

      if (!rawData.startsWith('{')) {
        this.logger.error(`[Consumer #${consumerId}] ❗ Invalid JSON`);
        await consumer.acknowledge(msg);
        return;
      }

      const parsed = JSON.parse(rawData);
      const propertyId = parsed.property_id ?? parsed.propertyId;
      const longitude = parsed.longitude ?? parsed.data?.longitude;
      const latitude = parsed.latitude ?? parsed.data?.latitude;
      const zoom = parsed.zoom ?? parsed.data?.zoom ?? 18;
      const attempts = parsed.attempts ?? 0;

      if (!propertyId || !longitude || !latitude) {
        this.logger.warn(
          `[Consumer #${consumerId}] ⚠️ Missing coordinates or propertyId`,
        );
        await consumer.acknowledge(msg);
        return;
      }

      if (attempts >= 2) {
        this.logger.warn(
          `[Consumer #${consumerId}] ⛔ Max attempts (${attempts}) for propertyId: ${propertyId}`,
        );
        await consumer.acknowledge(msg);
        return;
      }

      const location = `${latitude} ${longitude}`;
      const result = await this.crawlService.crawlCaptureGoogleEarth(
        location,
        zoom === 20 ? 4 : zoom,
      );

      if (!result) {
        this.logger.warn(
          `[Consumer #${consumerId}] ❌ Capture failed for propertyId: ${propertyId}`,
        );
        await consumer.negativeAcknowledge(msg); // Re-deliver if failed
        return;
      }

      const responseMessage = {
        eventType: 'PROPERTY_COMPLETED',
        timestamp: new Date().toISOString(),
        propertyId,
        attempts: attempts + 1,
        data: { zoom, videoUrl: result },
      };

      await this.producer.send({
        data: Buffer.from(JSON.stringify(responseMessage)),
      });

      this.logger.log(
        `✅ [Consumer #${consumerId}] Sent for propertyId: ${propertyId}`,
      );

      await consumer.acknowledge(msg);
    } catch (err) {
      this.logger.error(
        `[Consumer #${consumerId}] ❌ Error: ${err.message} (MessageID: ${messageId})`,
      );
      await consumer.negativeAcknowledge(msg);
    } finally {
      release();
    }
  }

  async onModuleDestroy() {
    this.logger.warn('🛑 Closing Pulsar client...');
    for (const consumer of this.consumers) {
      await consumer.close();
    }
    await this.producer.close();
    await this.client.close();
  }
}
