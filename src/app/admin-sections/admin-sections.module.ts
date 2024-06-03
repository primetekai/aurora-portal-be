import { Module } from '@nestjs/common';
import { AdminSectionsController } from './admin-sections.controller';
import { AdminSectionsService } from './admin-sections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSectionsRepository } from './admin-sections.repository';
import { AuthModule } from 'src/app/auth/auth.module';
import { LanguagesService } from '../languages/languages.service';
import { LanguagesRepository } from '../languages/languages.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminSectionsRepository, LanguagesRepository]),
    AuthModule,
  ],
  controllers: [AdminSectionsController],
  providers: [
    AdminSectionsService,
    AdminSectionsRepository,
    LanguagesService,
    LanguagesRepository,
  ],
})
export class AdminSectionsModule {}
