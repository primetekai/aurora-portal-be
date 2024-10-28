import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SectionsRepository } from './sections.repository';
import { Sections } from './sections.entity';
import { LanguagesService } from '../languages/languages.service';
import { User } from '../user';

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

  async getSectionsById(
    language: string,
    section: string,
    user: User,
  ): Promise<Record<string, any>> {
    const data = await this.sectionsRepository.getSectionsById(
      user,
      language,
      section,
    );
    return data;
  }

  async createSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<Sections> {
    const existingSection = await this.sectionsRepository.getSectionsById(
      user,
      language,
      section,
    );
    if (existingSection) {
      throw new BadRequestException(
        `Section with language "${language}" and section "${section}" already exists.`,
      );
    }

    return this.sectionsRepository.createSections(
      data,
      user,
      language,
      section,
    );
  }

  async updateSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<Sections> {
    const existingSection = await this.sectionsRepository.findOne({
      where: { language, section },
    });
    if (!existingSection) {
      throw new NotFoundException(
        `Section with language "${language}" and section "${section}" not found.`,
      );
    }

    existingSection.data = JSON.stringify(data);
    await this.sectionsRepository.save(existingSection);

    return existingSection;
  }
}
