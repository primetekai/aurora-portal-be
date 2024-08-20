import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common/services/logger.service';
import { User, UserRepository } from '../user';
import { JwtPayload } from './jwt';
import {
  AuthUserSignInCredentialsDto,
  AuthUserSignUpCredentialsDto,
} from './dto';
import { UserRole } from './enum';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(
    authCredentialsDto: AuthUserSignUpCredentialsDto,
    role: UserRole,
  ): Promise<void> {
    return await this.userRepository.signUp(authCredentialsDto, role);
  }

  async generateToken(payload: JwtPayload): Promise<string> {
    const accessToken = await this.jwtService.sign(payload);

    this.logger.debug(
      `Generate Json token with pay load${JSON.stringify(payload)} `,
    );

    return accessToken;
  }

  async signIn(
    authCredentialsDto: AuthUserSignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const username =
      await this.userRepository.validateUserPassword(authCredentialsDto);

    if (!username) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken({ username });

    return { accessToken };
  }

  async getAccounts(filters?: Record<string, any>): Promise<User[]> {
    const users = await this.userRepository.getUsers(filters);

    return users;
  }

  async getAccountById(
    id: string,
    role?: UserRole,
  ): Promise<Record<string, any>> {
    const data = await this.userRepository.getUserById(id, role);
    return data;
  }
}
