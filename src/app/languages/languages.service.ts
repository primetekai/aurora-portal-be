import { CreateLanguagesDto } from './dto/create-languages.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { LanguagesRepository } from './languages.repository';
import { Languages } from './languages.entity';
import { UpdateLanguagesDto } from './dto/update-languages.dto';
import { User } from '@app/auth';

@Injectable()
export class LanguagesService {
  constructor(private languagesRepository: LanguagesRepository) {}
  async getLanguages(user: User): Promise<Languages[]> {
    return await this.languagesRepository.getLanguages(user);
  }

  async getLanguagesById(id: string, user: User): Promise<Languages> {
    const found = await this.languagesRepository.findOne({
      where: { language: id, userId: user.id },
    });
    if (!found) {
      throw new NotFoundException(`Languages with ID ${id} not found`);
    }
    return found;
  }

  async createLanguages(
    createLanguagesDto: CreateLanguagesDto,
    user: User,
  ): Promise<Languages> {
    return this.languagesRepository.createLanguages(createLanguagesDto, user);
  }

  async deleteLanguages(id: string, user: User): Promise<void> {
    const result = await this.languagesRepository.delete({
      language: id,
      userId: user.id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Languages with ID ${id} not found`);
    }
  }

  async updateLanguages(
    id: string,
    updateLanguagesDto: UpdateLanguagesDto,
    user: User,
  ): Promise<Languages> {
    const lg = await this.getLanguagesById(id, user);
    lg.name = updateLanguagesDto?.name;
    lg.language = updateLanguagesDto?.language;
    lg.save();
    return lg;
  }
}
