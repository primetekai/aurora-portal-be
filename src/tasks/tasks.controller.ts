import { GetTaskFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';
import { Logger } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TaskStatusValidationPipe } from './pipes/task-status-validation.pipe';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';

@Controller('tasks')
// Impor thêm xác thực đúng 1 dòng là nó sẽ yêu cầu thêm token
@UseGuards(AuthGuard()) // muốn get ko xác thực token chỉ cần di chuyển cái này xuống hàm để đây nó lấy hết class
export class TasksController {
  // cần xuất logger
  private loggger = new Logger('TasksController');
  constructor(private tasksService: TasksService) {}
  @Get()
  getTask(
    @Query(ValidationPipe) filterDto: GetTaskFilterDto,
    @GetUser() user: User,
  ): Promise<Task[]> {
    this.loggger.verbose(
      `User "${user.username}" retrieving all tasks. Filtes: ${JSON.stringify(filterDto)}`,
    );
    return this.tasksService.getTask(filterDto, user);
  }

  @Get('/:id')
  getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.getTaskById(id, user);
  }

  @Post()
  @UsePipes()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.loggger.verbose(
      `User "${user.username}" create a new task. Data: ${JSON.stringify(createTaskDto)}`,
    );
    return this.tasksService.createTask(createTaskDto, user);
  }

  @Delete('/:id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.tasksService.deleteTask(id, user);
  }

  @Patch(':id/status')
  updateTaskStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', TaskStatusValidationPipe) status: TaskStatus,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateTaskStatus(id, status, user);
  }

  // @Get()
  // getTask(@Query(ValidationPipe) filterDto:GetTaskFilterDto):Task[]{
  //     console.log(filterDto);
  //     if(Object.keys(filterDto).length){
  //         console.log('voday');
  //         return this.tasksService.getTasksWithFilter(filterDto);
  //     }
  //     else
  //     return this.tasksService.getAllTasks();
  // }
  // @Get('/:id')
  // getTaskById(@Param('id') id:string):Task{
  //     return this.tasksService.getTaskById(id);
  // }
  // @Post()
  // @UsePipes(  )
  // createTask(@Body() createTaskDto:CreateTaskDto): Task{
  //     return this.tasksService.createTask(createTaskDto);
  // }
  // @Delete('/:id')
  // deleteTask(@Param('id') id: string): void{
  //     this.tasksService.deleteTask(id);
  // }
  // @Patch(':id/status')
  // updateTaskStatus(@Param('id') id :string, @Body('status', TaskStatusValidationPipe) status: TaskStatus):Task{
  //     return this.tasksService.updateTaskStatus(id,status);
  // }
}
