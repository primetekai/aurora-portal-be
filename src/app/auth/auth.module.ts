import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JWT_SECRET, EXPIRES_IN } from 'src/config';
import { FacebookStrategy } from './facebook';
import { GoogleStrategy } from './google';
import { UserRepository } from './user';
import { JwtStrategy } from './jwt';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: EXPIRES_IN,
      },
    }),
    TypeOrmModule.forFeature([UserRepository]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
