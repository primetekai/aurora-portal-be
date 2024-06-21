import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { AuthModule } from '../auth';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    TypeOrmModule.forFeature([UserRepository]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
})
export class UserModule {}
