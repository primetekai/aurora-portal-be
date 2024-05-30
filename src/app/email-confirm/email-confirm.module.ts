import { Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { EmailService, EmailCoreModule } from '../email';
import { EmailConfirmController } from './email-confirm.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [EmailConfirmController],
  providers: [EmailService, EmailCoreModule.getEmailConfig()],
})
export class EmailConfirmModule {}
