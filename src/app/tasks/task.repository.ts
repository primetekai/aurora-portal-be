import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from 'src/app/auth/user.entity';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class TaskRepository extends Repository<Task> {
  constructor(private dataSource: DataSource) {
    super(Task, dataSource.createEntityManager());
  }

  private logger = new Logger('Tasks repository');

  async getTask(
    getTaskFilterDto: GetTaskFilterDto,
    user: User,
  ): Promise<Task[]> {
    const { search, status } = getTaskFilterDto;
    const query = this.createQueryBuilder('task');
    // Adding WHERE expression
    // andWhere để sử dụng trường hợp nhiều điều kiện chứ where ko là nó overide
    query.where('task.userId = :userId', { userId: user.id });

    if (status) {
      query.andWhere('task.status =:status', { status });
    }
    if (search) {
      query.andWhere(
        'task.title LIKE :search OR task.description LIKE :search',
        { search: `%${search}%` },
      );
    }
    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get task for user "${user.username}", Dto : ${JSON.stringify(getTaskFilterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    // thêm quan hệ user vào
    task.user = user;

    try {
      await task.save();
    } catch (error) {
      this.logger.error(
        `Failed to create a task for user "${user.username}". Data: ${JSON.stringify(createTaskDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
    // nó sẽ ko xóa bởi vid nó đã lưu trc rồi cú pháp chỉ clear trùng
    // Thêm dòng này vào nó sẽ clear thông tin user đi luôn hay v~ get mỗi thông tin t
    delete task.user;
    return task;
  }
}
