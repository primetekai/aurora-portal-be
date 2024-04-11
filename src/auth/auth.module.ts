import { UserRepository } from './user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JWT_SECRET, EX_PIRES_IN } from 'src/config';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: EX_PIRES_IN,
      },
    }),
    TypeOrmModule.forFeature([UserRepository]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // nhớ phải cung cấp jwt-strategy ở đây nhằm định danh token
    JwtStrategy,
  ],
  // sau khi cung cấp export JwtStategy ở đây luôn
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
