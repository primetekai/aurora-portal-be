import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
// import { createQueryBuilder } from 'typeorm';
import { User } from 'src/auth/user.entity';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskRepository)
    private taskResponitory: TaskRepository,
  ) {}
  async getTask(filterDto: GetTaskFilterDto, user: User): Promise<Task[]> {
    return await this.taskResponitory.getTask(filterDto, user);
  }
  async getTaskById(id: number, user: User): Promise<Task> {
    // const found = await this.taskResponitory.findOne(id);
    console.log(user.id);
    const found = await this.taskResponitory.findOne({
      where: { id, userId: user.id },
    });
    if (!found) {
      throw new NotFoundException(`Task widh ID ${id} not found`);
    }
    return found;
  }
  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    // const { title, description } = createTaskDto;
    // const task =new Task();
    // task.title=title;
    // task.description=description;
    // task.status =TaskStatus.OPEN;
    // await task.save();
    // return task;
    return this.taskResponitory.createTask(createTaskDto, user);
  }
  async deleteTask(id: number, user: User): Promise<void> {
    const result = await this.taskResponitory.delete({ id, userId: user.id });
    // console.log(result);
    if (result.affected === 0) {
      throw new NotFoundException(`Task widh ID ${id} not found`);
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

  ///////////////////////////////////////////////////////////////////////////
  //Cách tạo ra file json test not connect DB
  // private tasks: Task[] =[];
  // getAllTasks():Task[] {
  //     return this.tasks;
  // }
  // getTasksWithFilter(getTaskFilterDto:GetTaskFilterDto):Task[] {
  //     const {status, search}=getTaskFilterDto;
  //     let tasks = this.getAllTasks();
  //     if(status){
  //         tasks = tasks.filter(tasks=>tasks.status==status);
  //     }
  //     if(search){
  //         tasks=tasks.filter(tasks=>tasks.title.includes(search) || tasks.description.includes(search));
  //     }
  //     return tasks;
  // }
  // getTaskById(id :string):Task {
  //     const found = this.tasks.find(task => task.id === id);
  //     if (!found) {
  //         throw new NotFoundException(`Task widh ID ${id} not found`);
  //     }
  //     return found;
  // }
  // createTask(createTaskDto:CreateTaskDto):Task{
  //     const {title, description} = createTaskDto;
  //     const task: Task={
  //         id : uuidv4(),
  //         title,
  //         description,
  //         status: TaskStatus.OPEN,
  //     };
  //     this.tasks.push(task);
  //     return task;
  // }
  // deleteTask(id: string): void{
  //     const found = this.getTaskById(id);
  //     this.tasks= this.tasks.filter(task=>task.id!==found.id);
  // }
  // updateTaskStatus(id:string,status:TaskStatus):Task{
  //     const task= this.getTaskById(id);
  //     task.status =status;
  //     return task;
  // }
}
