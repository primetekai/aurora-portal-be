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
  private readonly semaphore = new Semaphore(3); // 👈 chỉ cho phép 3 job chạy song song

  constructor(private readonly crawlService: CrawlService) {}

  private readonly numThreads = 3;

  private pulsarConfig = {
    serviceUrl: 'pulsar://160.191.164.16:6650',
    token:
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.MtdmVWF8Yr3Tp5M1gKSOOLHdsh1KsiVaJY2TtDi1sTw',
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
      await this.subscribeToTopic(
        'persistent://public/default/property-capture-request',
        'property-capture-request-subscription',
        this.handleCaptureRequest.bind(this),
        i + 1, // 👈 consumerId
      );
      this.logger.log(`🧵 Started consumer thread #${i + 1}`);
    }

    this.producer = await this.client.createProducer({
      topic: 'persistent://public/default/property-capture-completed',
    });

    this.logger.log('🔵 Pulsar service initialized.');
  }

  private async subscribeToTopic(
    topic: string,
    subscription: string,
    listener: (
      msg: Pulsar.Message,
      consumer: Pulsar.Consumer,
      consumerId: number,
    ) => Promise<void>,
    consumerId: number,
  ) {
    const consumer = await this.client.subscribe({
      topic,
      subscription,
      subscriptionType: 'Shared',
      listener: (msg, consumer) => {
        listener(msg, consumer, consumerId).catch((err) => {
          this.logger.error(
            `Listener error (Consumer #${consumerId}): ${err.message}`,
          );
        });
      },
    });

    this.consumers.push(consumer);
    this.logger.log(`✅ Subscribed (Consumer #${consumerId}) to ${topic}`);
  }

  private async handleCaptureRequest(
    msg: Pulsar.Message,
    consumer: Pulsar.Consumer,
    consumerId: number,
  ) {
    const [_, release] = await this.semaphore.acquire(); // 👈 giới hạn job đồng thời
    try {
      const rawData = msg.getData().toString();
      this.logger.log(`📩 [Consumer #${consumerId}] Received: ${rawData}`);

      if (!rawData.startsWith('{')) {
        this.logger.error(`[Consumer #${consumerId}] Invalid JSON: ${rawData}`);
        consumer.acknowledge(msg);
        return;
      }

      const res = JSON.parse(rawData);
      const { propertyId, data, attempts = 0 } = res;
      const { longitude, latitude, zoom } = data;

      if (!longitude || !latitude) {
        this.logger.warn(`[Consumer #${consumerId}] Missing coordinates`);
        consumer.acknowledge(msg);
        return;
      }

      if (attempts >= 2) {
        this.logger.warn(
          `[Consumer #${consumerId}] Max attempts (${attempts}) for propertyId: ${propertyId}`,
        );
        consumer.acknowledge(msg);
        return;
      }

      const location = `${latitude} ${longitude}`;
      const result = await this.crawlService.crawlCaptureGoogleEarth(
        location,
        zoom === 20 ? 4 : zoom,
      );

      if (!result) {
        consumer.negativeAcknowledge(msg);
        this.logger.warn(
          `[Consumer #${consumerId}] Capture failed for propertyId: ${propertyId}`,
        );
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
        `[Consumer #${consumerId}] Sent: ${JSON.stringify(responseMessage)}`,
      );
      consumer.acknowledge(msg);
    } catch (err) {
      this.logger.error(`[Consumer #${consumerId}] Error: ${err.message}`);
    } finally {
      release(); // 👈 luôn release slot của semaphore
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
