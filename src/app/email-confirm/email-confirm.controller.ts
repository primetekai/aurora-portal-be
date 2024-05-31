import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailDto } from './dto/email.dto';
import { AuthGuard } from '@nestjs/passport';
import { MAIL_HOST } from 'src/config';
import { EmailService } from '../email/email.service';
import { Roles, RolesGuard, UserRole } from '@app/auth';

// @ApiTags('Email', 'User')
@Controller('email')
export class EmailConfirmController {
  constructor(private readonly emailService: EmailService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all sections' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendEmail(
    @Body() email: EmailDto,
    // @GetUser() user: User,
  ): Promise<any> {
    return this.emailService.sendMail({
      from: MAIL_HOST,
      // to: user.email,
      to: '16521524@gm.uit.edu.vn',
      subject: email.title,
      template: 'welcome', // The `.pug` extension is appended automatically.
      context: {
        title: email.title,
        comments: email.comments,
        name: email.name,
      },
    });
  }
}
