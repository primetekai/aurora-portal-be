import { SectionsService } from './sections.service';
import { HttpStatus, Logger, Query, Res } from '@nestjs/common';
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UI_CONFIG_PATH } from 'src/config';
import { GetUser, User } from '../user';
import { Roles, RolesGuard, UserRole } from '../auth';

@Controller(UI_CONFIG_PATH)
@ApiTags('section')
export class SectionsController {
  private logger = new Logger('SectionsController');

  constructor(private sectionsService: SectionsService) {}
  @ApiBearerAuth()
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(UserRole.ADMIN)
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
      return e;
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
      return e;
    }
  }

  @ApiBearerAuth()
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(UserRole.ADMIN)
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
    @Query('section') section: string,
    @GetUser() user: User,
    @Body() data: Record<string, any>,
  ): Promise<Sections> {
    this.logger.verbose(
      `User "${user.username}" create a new sections. Data: ${JSON.stringify(data)}`,
    );
    return this.sectionsService.createSections(data, user, language, section);
  }
}
