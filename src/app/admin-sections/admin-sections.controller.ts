import { AdminSectionsService } from './admin-sections.service';
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
import { AdminSections } from './admin-sections.entity';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_UI_CONFIG_PATH } from 'src/config';
import { Roles, RolesGuard, UserRole, GetUser, User } from '@app/auth';

@Controller(ADMIN_UI_CONFIG_PATH)
@ApiTags('admin_section')
export class AdminSectionsController {
  private logger = new Logger('AdminSectionsController');

  constructor(private sectionsService: AdminSectionsService) {}
  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all sections' })
  @ApiResponse({ status: 200, description: 'Return all sections.' })
  @Get('/:language/sections')
  async getAdminSections(
    @Param('language') language: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const data = await this.sectionsService.getAdminSections(user, language);
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return e;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get section' })
  @ApiResponse({ status: 200, description: 'Get sections' })
  @Get('/:language')
  @ApiQuery({
    name: 'section',
    type: String,
    description: 'Section is required',
    required: true,
  })
  async getAdminSectionsById(
    @Param('language') language: string,
    @Query('section') section: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const data = await this.sectionsService.getAdminSectionsById(
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
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
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
  createAdminSections(
    @Param('language') language: string,
    @Query('section') section: string,
    @GetUser() user: User,
    @Body() data: Record<string, any>,
  ): Promise<AdminSections> {
    this.logger.verbose(
      `User "${user.username}" create a new sections. Data: ${JSON.stringify(data)}`,
    );
    return this.sectionsService.createSections(data, user, language, section);
  }
}
