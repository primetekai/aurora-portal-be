import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from 'src/app/auth/user.entity';

@Injectable()
export class TasksService {
  constructor(private taskResponitory: TaskRepository) {}
  async getTask(filterDto: GetTaskFilterDto, user: User): Promise<Task[]> {
    return await this.taskResponitory.getTask(filterDto, user);
  }
  async getTaskById(id: number, user: User): Promise<Task> {
    const found = await this.taskResponitory.findOne({
      where: { id, userId: user.id },
    });
    if (!found) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return found;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.taskResponitory.createTask(createTaskDto, user);
  }

  async deleteTask(id: number, user: User): Promise<void> {
    const result = await this.taskResponitory.delete({ id, userId: user.id });
    // console.log(result);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async updateTaskStatus(
    id: number,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    task.save();
    return task;
  }
}
