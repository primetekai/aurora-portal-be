import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common/services/logger.service';
import { UserRepository, UserRole } from './user';
import { generatePassword } from 'src/utils';
import { JwtPayload } from './jwt';
import { AuthCredentialsDto } from './dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(
    authCredentialsDto: AuthCredentialsDto,
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
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const username =
      await this.userRepository.validateUserPassword(authCredentialsDto);

    if (!username) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken({ username });

    return { accessToken };
  }

  async signIn3rd(data: Record<string, any>): Promise<{ accessToken: string }> {
    const authCredentialsDto: AuthCredentialsDto = {
      password: generatePassword(),
      username: data?.email?.split('@')[0],
    };

    let accessToken = null;

    const username =
      await this.userRepository.validateUserPassword(authCredentialsDto);

    if (!username) {
      await this.userRepository.signUp(authCredentialsDto, UserRole.USER);
      accessToken = await this.generateToken({
        username: authCredentialsDto.username,
      });
    } else {
      accessToken = await this.generateToken({ username });
    }

    return { accessToken };
  }
}
