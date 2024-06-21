import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { User } from './user.entity';
import { UserRole } from '../auth/enum/role.enum';
import {
  AuthUserSignInCredentialsDto,
  AuthUserSignUpCredentialsDto,
} from '../auth/dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  private logger = new Logger('User repository');

  async signUp(
    authCredentialsDto: AuthUserSignUpCredentialsDto,
    role: UserRole,
  ): Promise<void> {
    const { username, password, email } = authCredentialsDto;
    const user = new User();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.role = role;
    user.email = email;
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  async validateUserPassword(
    authCredentialsDto: AuthUserSignInCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialsDto;
    const user = await this.findOne({ where: { username } });
    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }

  async validateUser(
    authCredentialsDto: AuthUserSignUpCredentialsDto,
  ): Promise<User> {
    const { username } = authCredentialsDto;

    const user = await this.findOne({ where: { username } });

    if (!user) {
      await this.signUp(authCredentialsDto, UserRole.USER);
    }
    return user;
  }

  async getUsers(filter?: Record<string, any>): Promise<User[]> {
    const queryBuilder = this.createQueryBuilder('user');
    queryBuilder.andWhere('user.role = :role', { role: UserRole.USER });
    if (filter && filter.where) {
      for (const name in filter.where) {
        if (Object.prototype.hasOwnProperty.call(filter.where, name)) {
          const value = filter.where[name];
          queryBuilder.andWhere(`user.${name} ILIKE :${name}`, {
            [name]: `%${value}%`,
          });
        }
      }
    }
    try {
      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(`Failed to get users for users`, error.stack);
      throw new InternalServerErrorException();
    }
  }

  async getUserById(id: string, role?: UserRole): Promise<User> {
    const query = this.createQueryBuilder('user');
    query.where('user.id = :id', { id: id });
    query.andWhere('user.role = :role', { role });
    try {
      const user = await query.getMany();
      return user[0];
    } catch (error) {
      this.logger.error(`Failed to get users for id "${id}"`, error.stack);
      throw new InternalServerErrorException();
    }
  }
}
