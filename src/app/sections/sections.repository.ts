import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sections } from './sections.entity';
import { Logger } from '@nestjs/common/services/logger.service';
import moment from 'moment';
import { User } from '../user';

@Injectable()
export class SectionsRepository extends Repository<Sections> {
  private logger = new Logger('SectionsRepository');

  constructor(private dataSource: DataSource) {
    super(Sections, dataSource.createEntityManager());
  }

  async getSections(user: User, language: string): Promise<Sections[]> {
    const query = this.createQueryBuilder('sections');
    query.where('sections.language = :language', { language });

    try {
      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get sections for user "${user.username}"`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getSectionsById(
    user: User,
    language: string,
    section: string,
  ): Promise<Record<string, any>> {
    const query = this.createQueryBuilder('sections');
    query.where('sections.section = :section', { section });
    query.andWhere('sections.language = :language', { language });

    try {
      const sections = await query.getMany();
      return sections[0]?.data ? JSON.parse(sections[0]?.data) : {};
    } catch (error) {
      this.logger.error(
        `Failed to get sections for user "${user.username}"`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createSections(
    data: Record<string, any>,
    user: User,
    language: string,
    section: string,
  ): Promise<Sections> {
    const sectionEntity = new Sections();
    sectionEntity.section = section;
    sectionEntity.data = JSON.stringify(data);
    sectionEntity.createAt = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
    sectionEntity.language = language;
    sectionEntity.userId = user.id;
    sectionEntity.version = 1;

    try {
      await sectionEntity.save();
      return sectionEntity;
    } catch (error) {
      this.logger.error(
        `Failed to create a section for user "${user.username}". Data: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
