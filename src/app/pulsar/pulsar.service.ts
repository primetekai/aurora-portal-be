import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as Pulsar from 'pulsar-client';
import { CrawlService } from '../crawl-view-360';

@Injectable()
export class PulsarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PulsarService.name);
  private client: Pulsar.Client;
  private consumers: Pulsar.Consumer[] = [];
  private producer: Pulsar.Producer;

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
    listener: (msg: Pulsar.Message, consumer: Pulsar.Consumer) => void,
  ) {
    try {
      const consumer = await this.client.subscribe({
        topic,
        subscription,
        subscriptionType: 'Shared',
        listener,
      });

      this.consumers.push(consumer);
      this.logger.log(`✅ Subscribed to ${topic}`);
    } catch (err) {
      this.logger.error(`❌ Failed to subscribe to ${topic}: ${err.message}`);
    }
  }

  private async handleCaptureRequest(
    msg: Pulsar.Message,
    consumer: Pulsar.Consumer,
  ) {
    try {
      const rawData = msg.getData().toString();
      this.logger.log(`📩 [Request] Raw: ${rawData}`);

      if (!rawData.startsWith('{')) {
        this.logger.error(`[Request] Invalid JSON: ${rawData}`);
        consumer.acknowledge(msg);
        return;
      }

      const res = JSON.parse(rawData);
      const { propertyId, data, attempts = 0 } = res;
      const { longitude, latitude, zoom } = data;

      if (!longitude || !latitude) {
        this.logger.warn('[Request] Missing coordinates');
        consumer.acknowledge(msg);
        return;
      }

      if (attempts >= 2) {
        this.logger.warn(
          `[Request] Max attempts (${attempts}) for propertyId: ${propertyId}`,
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
          `[Request] Capture failed for propertyId: ${propertyId}`,
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

      this.logger.log(`[Request] Sent: ${JSON.stringify(responseMessage)}`);
      consumer.acknowledge(msg);
    } catch (err) {
      this.logger.error(`[Request] Error: ${err.message}`);
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
