import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthCredentialsDto } from '../dto';
import { User } from './user.entity';
import { UserRole } from './user-role.emum';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async signUp(
    authCredentialsDto: AuthCredentialsDto,
    role: UserRole,
  ): Promise<void> {
    const { username, password } = authCredentialsDto;
    const user = new User();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.role = role;
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
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialsDto;

    const user = await this.findOne({ where: { username } });

    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }

  async validateUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { username } = authCredentialsDto;

    const user = await this.findOne({ where: { username } });

    if (!user) {
      await this.signUp(authCredentialsDto, UserRole.USER);
    }
    return user;
  }
}
