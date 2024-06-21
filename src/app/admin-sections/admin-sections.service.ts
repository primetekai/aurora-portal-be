import { Injectable } from '@nestjs/common';
import { AdminSectionsRepository } from './admin-sections.repository';
import { AdminSections } from './admin-sections.entity';
import { LanguagesService } from '../languages/languages.service';
import { User } from '../user';

@Injectable()
export class AdminSectionsService {
  constructor(
    private sectionsRepository: AdminSectionsRepository,
    private languagesRepository: LanguagesService,
  ) {}
  async getAdminSections(user: User, language: string): Promise<string[]> {
    const sections = await this.sectionsRepository.getAdminSections(
      user,
      language,
    );

    return [...new Set(sections.map((s) => s.section))];
  }

  async getAdminSectionsById(
    language: string,
    section: string,
    user: User,
  ): Promise<Record<string, any>> {
    const version = await this.sectionsRepository.getMaxVersion(
      user,
      language,
      section,
    );

    const data = await this.sectionsRepository.getAdminSectionsById(
      user,
      language,
      section,
      version,
    );
    return data;
  }

  async createSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<AdminSections> {
    const version = await this.sectionsRepository.getMaxVersion(
      user,
      language,
      section,
    );

    return this.sectionsRepository.createSections(
      data,
      user,
      language,
      section,
      version,
    );
  }
}
