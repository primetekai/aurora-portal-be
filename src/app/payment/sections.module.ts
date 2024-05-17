import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsRepository } from './sections.repository';
import { AuthModule } from 'src/app/auth/auth.module';
import { LanguagesService } from '../languages/languages.service';
import { LanguagesRepository } from '../languages/languages.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SectionsRepository, LanguagesRepository]),
    AuthModule,
  ],
  controllers: [SectionsController],
  providers: [
    SectionsService,
    SectionsRepository,
    LanguagesService,
    LanguagesRepository,
  ],
})
export class SectionsModule {}
