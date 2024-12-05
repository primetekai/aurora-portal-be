import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UsePipes,
  UseGuards,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, User } from '../user';
import { Roles, RolesGuard, UserRole } from '../auth';
import { UI_CONFIG_PATH } from 'src/config';

@Controller(UI_CONFIG_PATH)
@ApiTags('section')
export class SectionsController {
  private logger = new Logger('SectionsController');

  constructor(private sectionsService: SectionsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all sections' })
  @ApiResponse({ status: 200, description: 'Return all sections.' })
  @Get('/:language/sections')
  async getSections(
    @Param('language') language: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const data = await this.sectionsService.getSections(user, language);
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  @ApiOperation({ summary: 'Get section' })
  @ApiResponse({ status: 200, description: 'Get sections' })
  @Get('/:language')
  @ApiQuery({
    name: 'section',
    type: String,
    description: 'Section is required',
    required: true,
  })
  async getSectionsById(
    @Param('language') language: string,
    @Query('section') section: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const data = await this.sectionsService.getSectionsById(
        language,
        section,
        user,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update sections' })
  @ApiResponse({
    status: 201,
    description: 'The section has been successfully created or updated.',
  })
  @Post('/:language')
  @ApiQuery({
    name: 'section',
    type: String,
    description: 'Section is required',
    required: true,
  })
  @UsePipes()
  async createOrUpdateSections(
    @Param('language') language: string,
    @Query('section') section: string,
    @GetUser() user: User,
    @Body() data: Record<string, any>,
    @Res() res,
  ) {
    try {
      const sectionData = await this.sectionsService.createOrUpdateSections(
        data,
        user,
        language,
        section,
      );
      return res.status(HttpStatus.CREATED).json(sectionData);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }
}
