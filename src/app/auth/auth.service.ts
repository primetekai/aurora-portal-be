import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common/services/logger.service';
import { User, UserRepository } from '../user';
import { generatePassword } from 'src/utils';
import { JwtPayload } from './jwt';
import {
  AuthUserSignInCredentialsDto,
  AuthUserSignUpCredentialsDto,
} from './dto';
import { UserRole } from './enum';
import { AuthUserSignIn3rdCredentialsDto } from './dto/auth-user-signin-3rd-credentials.dto';
import axios from 'axios';

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

  async signIn3rd(
    auth3rdCredentialsDto: AuthUserSignIn3rdCredentialsDto,
  ): Promise<{ accessToken: string }> {
    let email: string;

    if (auth3rdCredentialsDto.typeLogin === 'google') {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${auth3rdCredentialsDto?.token}`,
        );
        email = response.data?.email;
      } catch (error) {
        throw new HttpException(
          'Error verifying token',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const response = await this.signInAdnSignUp3rd({
      email,
    });

    return { accessToken: response?.accessToken };
  }

  async signInAdnSignUp3rd(
    data: Record<string, any>,
  ): Promise<{ accessToken: string }> {
    await this.userRepository.validateUser({
      password: generatePassword(),
      username: data?.email?.split('@')[0],
      email: data?.email,
    });

    const accessToken = await this.generateToken({
      username: data?.email?.split('@')[0],
    });

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
