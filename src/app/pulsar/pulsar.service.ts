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
  private consumer: Pulsar.Consumer;
  private producer: Pulsar.Producer;

  constructor(private readonly crawlService: CrawlService) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Pulsar Service...');

    this.client = new Pulsar.Client({
      serviceUrl: 'pulsar://194.233.69.2:6650',
    });

    this.consumer = await this.client.subscribe({
      topic: 'persistent://public/default/property-capture-request',
      subscription: 'property-capture-request-subscription',
      subscriptionType: 'KeyShared',
      listener: this.handleMessage.bind(this),
    });

    this.producer = await this.client.createProducer({
      topic: 'persistent://public/default/property-capture-completed',
    });

    this.logger.log('🔵 Pulsar service started and listening...');
  }

  private async handleMessage(msg: Pulsar.Message, consumer: Pulsar.Consumer) {
    try {
      const rawData = msg.getData().toString();
      this.logger.log(`📩 Raw message data: ${rawData}`);

      if (!rawData.startsWith('{')) {
        this.logger.error(`❌ Received invalid JSON message: ${rawData}`);
        consumer.acknowledge(msg);
        return;
      }

      const res = JSON.parse(rawData);
      this.logger.log(`✅ Parsed message: ${JSON.stringify(res)}`);

      const { propertyId, data } = res;

      const { longitude, latitude, zoom } = data;

      if (!longitude || !latitude) {
        this.logger.warn('⚠️ Missing longitude or latitude');
        return;
      }

      this.logger.log(
        `🌍 Crawling video for location: (${latitude}, ${longitude})`,
      );
      const location = `${latitude} ${longitude}`;
      const result = await this.crawlService.crawlCaptureGoogleEarth(
        location,
        zoom,
      );

      if (!result || !result) {
        this.logger.error('❌ Failed to get download URL');
        return;
      }

      const responseMessage = {
        eventType: 'PROPERTY_COMPLETED',
        timestamp: new Date().toISOString(),
        propertyId,
        data: {
          videoUrl: result,
          zoom,
        },
      };

      await this.producer.send({
        data: Buffer.from(JSON.stringify(responseMessage)),
      });

      this.logger.log(
        `✅ Sent processed message: ${JSON.stringify(responseMessage)}`,
      );
      consumer.acknowledge(msg);
    } catch (error) {
      this.logger.error(`❌ Error processing message: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.warn('🛑 Closing Pulsar client...');
    await this.consumer.close();
    await this.producer.close();
    await this.client.close();
  }
}
