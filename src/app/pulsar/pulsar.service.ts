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
    await this.testConnection();

    this.client = new Pulsar.Client({
      serviceUrl: 'pulsar://192.168.10.186:6650',
    });

    this.consumer = await this.client.subscribe({
      topic: 'property-capture-request',
      subscription: 'property-capture-request-subscription',
      subscriptionType: 'Shared',
      listener: this.handleMessage.bind(this),
    });

    this.producer = await this.client.createProducer({
      topic: 'property-capture-completed',
    });

    this.logger.log('🔵 Pulsar service started and listening...');
  }

  private async testConnection() {
    this.logger.log('🔄 Testing Pulsar connection...');
    try {
      const client = new Pulsar.Client({
        serviceUrl: 'pulsar://192.168.10.186:6650',
      });

      const testProducer = await client.createProducer({
        topic: 'test-connection',
      });

      await testProducer.send({
        data: Buffer.from('Test message from NestJS'),
      });

      this.logger.log(
        '✅ Successfully connected to Pulsar and sent a test message.',
      );

      await testProducer.close();
      await client.close();
    } catch (error) {
      this.logger.error('❌ Pulsar connection failed:', error);
    }
  }

  private async handleMessage(msg: Pulsar.Message, consumer: Pulsar.Consumer) {
    try {
      const data = JSON.parse(msg.getData().toString());
      this.logger.log(`📩 Received message: ${JSON.stringify(data)}`);

      const { propertyId, propertyData } = data;
      const { longitude, latitude } = propertyData;

      if (!longitude || !latitude) {
        this.logger.warn('⚠️ Missing longitude or latitude');
        return;
      }

      this.logger.log(
        `🌍 Crawling video for location: (${latitude}, ${longitude})`,
      );

      const location = `${longitude} ${latitude}`;
      const result = await this.crawlService.crawlCaptureGoogleEarth(location);

      if (!result || !result.downloadUrl) {
        this.logger.error('❌ Failed to get download URL');
        return;
      }

      const responseMessage = {
        eventType: 'PROPERTY_COMPLETED',
        timestamp: new Date().toISOString(),
        propertyId,
        propertyData: {
          videoUrl: result.downloadUrl,
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
      this.logger.error('❌ Error processing message:', error);
    }
  }

  async onModuleDestroy() {
    this.logger.warn('🛑 Closing Pulsar client...');
    await this.consumer.close();
    await this.producer.close();
    await this.client.close();
  }
}
