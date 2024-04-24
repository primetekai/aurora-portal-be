import { Module } from '@nestjs/common';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguagesRepository } from './languages.repository';
import { AuthModule } from 'src/app/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LanguagesRepository]), AuthModule],
  controllers: [LanguagesController],
  providers: [LanguagesService, LanguagesRepository],
})
export class LanguagesModule {}
