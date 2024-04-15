import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UserRepository } from './user.repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return await this.userRepository.signUp(authCredentialsDto);
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const username =
      await this.userRepository.validateUserPassword(authCredentialsDto);

    if (!username) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create token
    const payload: JwtPayload = { username };

    const accessToken = await this.jwtService.sign(payload);
    this.logger.debug(
      `Generate Json token with pay load${JSON.stringify(payload)} `,
    );

    return { accessToken };
  }
}
