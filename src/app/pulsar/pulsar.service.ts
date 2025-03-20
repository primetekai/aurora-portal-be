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
      // serviceUrl: 'pulsar://194.233.69.2:6650',
      serviceUrl: 'pulsar://103.78.3.71:6650',
      // serviceUrl: 'pulsar://160.191.164.16:6650',
    });

    this.consumer = await this.client.subscribe({
      topic: 'persistent://public/default/property-capture-request',
      subscription: 'persistent-property-capture-request-subscription',
      subscriptionType: 'Shared',
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

      const { propertyId, data, attempts = 0 } = res;
      const { longitude, latitude, zoom } = data;

      if (!longitude || !latitude) {
        this.logger.warn('⚠️ Missing longitude or latitude');
        return;
      }

      // Don't process if max attempts reached
      if (attempts >= 2) {
        this.logger.warn(
          `⚠️ Max attempts (${attempts}) reached for propertyId: ${propertyId}`,
        );
        consumer.acknowledge(msg);
        return;
      }

      this.logger.log(
        `🌍 Crawling video for location: (${latitude}, ${longitude}), attempt: ${attempts + 1}`,
      );
      const location = `${latitude} ${longitude}`;
      const result = await this.crawlService.crawlCaptureGoogleEarth(
        location,
        zoom,
      );

      let responseMessage;

      if (!result) {
        // Handle failure case
        responseMessage = {
          eventType: 'CATURED_FAILED',
          timestamp: new Date().toISOString(),
          propertyId,
          attempts: attempts + 1,
          data: {
            zoom,
            videoUrl: null,
          },
        };

        this.logger.warn(
          `⚠️ Capture failed for propertyId: ${propertyId}, attempt: ${attempts + 1}`,
        );
      } else {
        // Handle success case
        responseMessage = {
          eventType: 'PROPERTY_COMPLETED',
          timestamp: new Date().toISOString(),
          propertyId,
          attempts: attempts + 1,
          data: {
            zoom,
            videoUrl: result,
          },
        };

        this.logger.log(`✅ Capture successful for propertyId: ${propertyId}`);
      }

      // Only send message if we haven't reached max attempts
      if (attempts < 2) {
        await this.producer.send({
          data: Buffer.from(JSON.stringify(responseMessage)),
        });

        this.logger.log(`📤 Sent message: ${JSON.stringify(responseMessage)}`);
      }

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
