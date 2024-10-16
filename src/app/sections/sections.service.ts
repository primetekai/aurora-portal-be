import { Injectable } from '@nestjs/common';
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
    // const version = await this.sectionsRepository.getMaxVersion(
    //   user,
    //   language,
    //   section,
    // );

    const data = await this.sectionsRepository.getSectionsById(
      user,
      language,
      section,
      1,
    );
    return data;
  }

  async createSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<Sections> {
    // const version = await this.sectionsRepository.getMaxVersion(
    //   user,
    //   language,
    //   section,
    // );

    return this.sectionsRepository.createSections(
      data,
      user,
      language,
      section,
      1,
    );
  }
}
