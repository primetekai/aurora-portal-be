import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminSections } from './admin-sections.entity';
import { Logger } from '@nestjs/common/services/logger.service';
import * as moment from 'moment';
import { User } from '../user';

@Injectable()
export class AdminSectionsRepository extends Repository<AdminSections> {
  constructor(private dataSource: DataSource) {
    super(AdminSections, dataSource.createEntityManager());
  }

  private logger = new Logger('Sections repository');

  async getAdminSections(
    user: User,
    language: string,
  ): Promise<AdminSections[]> {
    const query = this.createQueryBuilder('admin_sections');
    query.where('admin_sections.language = :language', { language });

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

  async getAdminSectionsById(
    user: User,
    language: string,
    section: string,
    version: number,
  ): Promise<Record<string, any>> {
    const query = this.createQueryBuilder('admin_sections');
    query.where('admin_sections.section = :section', { section });
    query.andWhere('admin_sections.language = :language', { language });
    query.andWhere('admin_sections.version = :version', { version });

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
    const query = this.createQueryBuilder('admin_sections');
    query.where('admin_sections.language = :language', { language });
    query.andWhere('admin_sections.section = :section', { section });
    query.select('MAX(admin_sections.version)', 'max');

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
  ): Promise<AdminSections> {
    const lg = new AdminSections();
    lg.section = section;
    lg.data = JSON.stringify(data);
    lg.createAt = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
    lg.language = language;
    lg.user = user;
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
    delete lg.user;
    return lg;
  }
}
