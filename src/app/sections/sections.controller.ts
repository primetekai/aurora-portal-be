import { SectionsService } from './sections.service';
import { Logger, Query } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { Sections } from './sections.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/app/auth/get-user.decorator';
import { User } from 'src/app/auth/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UI_CONFIG_PATH } from 'src/config';

@ApiBearerAuth()
@Controller(UI_CONFIG_PATH)
@ApiTags('section')
@UseGuards(AuthGuard())
export class SectionsController {
  private logger = new Logger('SectionsController');

  constructor(private sectionsService: SectionsService) {}

  @ApiOperation({ summary: 'Get all sections' })
  @ApiResponse({ status: 200, description: 'Return all sections.' })
  @Get('/:language/sections')
  getSections(
    @Param('language') language: string,
    @GetUser() user: User,
  ): Promise<string[]> {
    this.logger.verbose(`User "${user.username}" retrieving all sections`);
    return this.sectionsService.getSections(user, language);
  }

  @ApiOperation({ summary: 'Create sections' })
  @ApiResponse({
    status: 201,
    description: 'The sections has been successfully created.',
  })
  @Post('/:language')
  @ApiQuery({
    name: 'section',
    type: String,
    description: 'Section is required',
    required: true,
  })
  @UsePipes()
  createSections(
    @Param('language') language: string,
    @Query('section') section?: string,
    @Body() data?: Record<string, any>,
    @GetUser() user?: User,
  ): Promise<Sections> {
    this.logger.verbose(
      `User "${user.username}" create a new sections. Data: ${JSON.stringify(data)}`,
    );
    return this.sectionsService.createSections(data, user, language, section);
  }
}
