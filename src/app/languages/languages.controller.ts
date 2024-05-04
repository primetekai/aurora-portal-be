import { CreateLanguagesDto } from './dto/create-languages.dto';
import { LanguagesService } from './languages.service';
import { HttpStatus, Logger, Res } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Patch,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { Languages } from './languages.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/app/auth/get-user.decorator';
import { User } from 'src/app/auth/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateLanguagesDto } from './dto/update-languages.dto';
import { UI_CONFIG_PATH_LANG } from 'src/config';

@ApiBearerAuth()
@Controller(UI_CONFIG_PATH_LANG)
@ApiTags('languages')
@UseGuards(AuthGuard())
export class LanguagesController {
  private logger = new Logger('LanguagesController');

  constructor(private languagesService: LanguagesService) {}

  @ApiOperation({ summary: 'Get all languages' })
  @ApiResponse({ status: 200, description: 'Return all languages.' })
  @Get()
  async getLanguages(@GetUser() user: User, @Res() res) {
    try {
      const data = await this.languagesService.getLanguages(user);
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return e;
    }
  }

  @ApiOperation({ summary: 'Create languages' })
  @ApiResponse({
    status: 201,
    description: 'The languages has been successfully created.',
  })
  @Post()
  @UsePipes()
  createLanguages(
    @Body() createLanguagesDto: CreateLanguagesDto,
    @GetUser() user: User,
  ): Promise<Languages> {
    this.logger.verbose(
      `User "${user.username}" create a new languages. Data: ${JSON.stringify(createLanguagesDto)}`,
    );
    return this.languagesService.createLanguages(createLanguagesDto, user);
  }

  @ApiOperation({ summary: 'Delete Languages' })
  @ApiResponse({ status: 200, description: 'Delete Languages.' })
  @Delete('/:id')
  deleteLanguages(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.languagesService.deleteLanguages(id, user);
  }

  @ApiOperation({ summary: 'Update Language' })
  @ApiResponse({ status: 200, description: 'Update Language.' })
  @Patch(':id')
  @UsePipes()
  updateLanguagesStatus(
    @Param('id') id: string,
    @Body() updateLanguagesDto: UpdateLanguagesDto,
    @GetUser() user: User,
  ): Promise<Languages> {
    this.logger.verbose(
      `User "${user.username}" create a new languages. Data: ${JSON.stringify(updateLanguagesDto)}`,
    );
    return this.languagesService.updateLanguages(id, updateLanguagesDto, user);
  }
}
