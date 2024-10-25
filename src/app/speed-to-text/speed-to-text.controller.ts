import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AI_SERVICE } from 'src/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../upload';
import { SpeedToTextService } from './speed-to-text.service';

@Controller(AI_SERVICE)
@ApiTags('speed-to-text')
export class SpeedToTextController {
  private logger = new Logger('SpeedToTextController');

  constructor(private speedToTextService: SpeedToTextService) {}

  @Post('/upload-audio')
  @ApiOperation({ summary: 'Upload audio and convert to text' })
  @ApiResponse({
    status: 200,
    description: 'The audio has been successfully converted to text.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    type: UploadFileDto,
  })
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ transcription: string }> {
    try {
      if (!file || !file.originalname) {
        throw new Error('Invalid file uploaded.');
      }

      const messageDecoded =
        await this.speedToTextService.convertAudioToText(file);

      if (messageDecoded === null) {
        throw new Error('Failed to transcribe audio.');
      }

      return { transcription: messageDecoded };
    } catch (error) {
      this.logger.error(`Error during audio conversion: ${error.message}`);
      throw new HttpException(
        'Error processing audio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
