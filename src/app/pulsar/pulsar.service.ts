import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as Pulsar from 'pulsar-client';
import { CrawlService } from '../crawl-view-360';
import { PURSAL_TOKEN, PURSAL_URL } from 'src/config';

@Injectable()
export class PulsarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PulsarService.name);
  private client: Pulsar.Client;
  private consumer: Pulsar.Consumer;
  private producer: Pulsar.Producer;

  constructor(private readonly crawlService: CrawlService) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Pulsar Service...');

    const pulsarConfig = {
      authentication: {
        token: PURSAL_TOKEN,
        type: 'token',
      },
    };

    const clientConfig: Pulsar.ClientConfig = {
      serviceUrl: PURSAL_URL,
      operationTimeoutSeconds: 10,
    };

    clientConfig.authentication = new Pulsar.AuthenticationToken({
      token: pulsarConfig.authentication.token,
    });

    this.client = new Pulsar.Client(clientConfig);

    try {
      this.consumer = await this.client.subscribe({
        topic: 'persistent://public/default/property-capture-request',
        subscription: 'persistent-property-capture-request-subscription',
        subscriptionType: 'Shared',
        listener: this.handleMessage.bind(this),
      });
      this.logger.log('🔵 Subscribed successfully to topic.');
    } catch (err) {
      this.logger.error(`❌ Failed to create consumer: ${err.message}`);
    }

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

      const { propertyId, data, attempts = 0, app, metadata = {} } = res;
      const { longitude, latitude, zoom } = data;

      if (!longitude || !latitude) {
        this.logger.warn('⚠️ Missing longitude or latitude');
        return;
      }

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
        zoom === 20 ? 4 : zoom,
      );

      let responseMessage;

      if (!result) {
        consumer.negativeAcknowledge(msg);
        this.logger.warn(
          `⚠️ Capture failed for propertyId: ${propertyId}, attempt: ${attempts + 1}`,
        );
      } else {
        responseMessage = {
          eventType: 'PROPERTY_COMPLETED',
          timestamp: new Date().toISOString(),
          propertyId,
          attempts: attempts + 1,
          app,
          data: {
            zoom,
            videoUrl: result,
          },
          metadata,
        };

        this.logger.log(`✅ Capture successful for propertyId: ${propertyId}`);
      }

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
