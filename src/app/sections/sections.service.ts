import { Injectable, NotFoundException } from '@nestjs/common';
import { SectionsRepository } from './sections.repository';
import { Sections } from './sections.entity';
import { User } from 'src/app/auth/user.entity';
import { LanguagesService } from '../languages/languages.service';

@Injectable()
export class SectionsService {
  constructor(
    private sectionsRepository: SectionsRepository,
    private languagesRepository: LanguagesService,
  ) {}
  async getSections(user: User, language: string): Promise<string[]> {
    const sections = await this.sectionsRepository.getSections(user, language);

    return [...new Set(sections.map((s) => s.section))];
  }

  async getSectionsById(id: string, user: User): Promise<Sections> {
    const found = await this.sectionsRepository.findOne({
      where: { section: id, userId: user.id },
    });

    if (!found) {
      throw new NotFoundException(`Sections with ID ${id} not found`);
    }

    return found;
  }

  async createSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<Sections> {
    const version = await this.sectionsRepository.getMaxVersion(user);

    return this.sectionsRepository.createSections(
      data,
      user,
      language,
      section,
      version,
    );
  }
}
