import { Injectable, Logger } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from 'src/config';
import { createReadStream } from 'fs';

@Injectable()
export class SpeedToTextService {
  private logger = new Logger('SpeedToTextService');

  private client = new OpenAI({ apiKey: OPENAI_API_KEY });

  private SUPPORTED_FORMATS = [
    '.flac',
    '.m4a',
    '.mp3',
    '.mp4',
    '.mpeg',
    '.mpga',
    '.oga',
    '.ogg',
    '.wav',
    '.webm',
  ];

  constructor() {}

  isSupportedFormat = (filename: string) => {
    const ext = filename.split('.').pop().toLowerCase();
    return this.SUPPORTED_FORMATS.includes(`.${ext}`);
  };

  async convertAudioToText(audioFile: Express.Multer.File): Promise<string> {
    const tempFilename = `temp_audio_file.${audioFile.originalname.split('.').pop()}`;

    try {
      await fsPromises.writeFile(tempFilename, audioFile.buffer);
      this.logger.log(`File ${tempFilename} write success.`);

      if (!this.isSupportedFormat(tempFilename)) {
        throw new Error(`Format file is valid: ${tempFilename}`);
      }

      // const formData = new FormData();
      // formData.append('file', createReadStream(tempFilename)); // Sử dụng createReadStream để đọc tệp
      // formData.append('model', 'whisper-1');
      // formData.append('response_format', 'text'); // Đổi response_format thành 'text'

      // const response = await axios.post(
      //   'https://api.openai.com/v1/audio/transcriptions',
      //   formData,
      //   {
      //     headers: {
      //       ...formData.getHeaders(),
      //       Authorization: `Bearer ${OPENAI_API_KEY}`,
      //     },
      //   },
      // );

      const response = await this.client.audio.transcriptions.create({
        model: 'whisper-1',
        file: createReadStream(tempFilename),
        response_format: 'json',
      });

      this.logger.log(`Result response:`, response.text);
      return response.text;
    } catch (error) {
      this.logger.error(`Error convertAudioToText:`, error);
      return null;
    } finally {
      try {
        await fsPromises.unlink(tempFilename);
        this.logger.log(`File ${tempFilename} has been remove.`);
      } catch (error) {
        this.logger.error(`Error when delete file ${tempFilename}:`, error);
      }
    }
  }
}
