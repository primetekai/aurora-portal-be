import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLanguagesDto } from './dto/create-languages.dto';
import { DataSource, Repository } from 'typeorm';
import { Languages } from './languages.entity';
import { User } from 'src/app/auth/user.entity';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class LanguagesRepository extends Repository<Languages> {
  constructor(private dataSource: DataSource) {
    super(Languages, dataSource.createEntityManager());
  }

  private logger = new Logger('Languages repository');

  async getLanguages(user: User): Promise<Languages[]> {
    const query = this.createQueryBuilder('languages');
    query.where('languages.userId = :userId', { userId: user.id });

    try {
      const languages = await query.getMany();
      return languages;
    } catch (error) {
      this.logger.error(
        `Failed to get languages for user "${user.username}"`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createLanguages(
    createLanguagesDto: CreateLanguagesDto,
    user: User,
  ): Promise<Languages> {
    const { name, language } = createLanguagesDto;
    const lg = new Languages();
    lg.name = name;
    lg.language = language;
    lg.user = user;

    try {
      await lg.save();
    } catch (error) {
      this.logger.error(
        `Failed to create a languages for user "${user.username}". Data: ${JSON.stringify(createLanguagesDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
    delete lg.user;
    return lg;
  }
}
