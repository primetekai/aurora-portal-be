import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sections } from './sections.entity';
import { Logger } from '@nestjs/common/services/logger.service';
import * as moment from 'moment';
import { User } from '../user';

@Injectable()
export class SectionsRepository extends Repository<Sections> {
  constructor(private dataSource: DataSource) {
    super(Sections, dataSource.createEntityManager());
  }

  private logger = new Logger('Sections repository');

  async getSections(user: User, language: string): Promise<Sections[]> {
    const query = this.createQueryBuilder('sections');
    query.where('sections.language = :language', { language });

    try {
      const sections = await query.getMany();

      return sections;
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
    version: number,
  ): Promise<Record<string, any>> {
    const query = this.createQueryBuilder('sections');
    query.where('sections.section = :section', { section });
    query.andWhere('sections.language = :language', { language });
    query.andWhere('sections.version = :version', { version });

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

  async getMaxVersion(
    user: User,
    language: string,
    section: string,
  ): Promise<number> {
    const query = this.createQueryBuilder('sections');
    query.where('sections.language = :language', { language });
    query.andWhere('sections.section = :section', { section });
    query.select('MAX(sections.version)', 'max');

    try {
      const version = await query.getRawOne();

      return version?.max ? Number(version?.max) : 0;
    } catch (error) {
      this.logger.error(
        `Failed to get version max for user "${user.username}"`,
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
    version: number,
  ): Promise<Sections> {
    const lg = new Sections();
    lg.section = section;
    lg.data = JSON.stringify(data);
    lg.createAt = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
    lg.language = language;
    lg.userId = user.id;
    lg.version = version + 1;

    try {
      await lg.save();
    } catch (error) {
      this.logger.error(
        `Failed to create a sections for user "${user.username}". Data: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    return lg;
  }
}
