import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskRepository } from './task.repository';
import { AuthModule } from 'src/app/auth/auth.module';

@Module({
  // sau khi tạo entity mới vô đay import
  imports: [
    TypeOrmModule.forFeature([TaskRepository]),
    //import auth bắt đầu xác thực
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
})
export class TasksModule {}
