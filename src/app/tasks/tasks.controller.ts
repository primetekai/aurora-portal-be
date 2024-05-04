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
import { GetUser } from 'src/app/auth/get-user.decorator';
import { User } from 'src/app/auth/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('tasks')
@ApiTags('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  private logger = new Logger('TasksController');

  constructor(private tasksService: TasksService) {}

  @ApiOperation({ summary: 'Get all task' })
  @ApiResponse({ status: 200, description: 'Return all task.' })
  @Get()
  getTask(
    @Query(ValidationPipe) filterDto: GetTaskFilterDto,
    @GetUser() user: User,
  ): Promise<Task[]> {
    this.logger.verbose(
      `User "${user.username}" retrieving all tasks. Filtes: ${JSON.stringify(filterDto)}`,
    );
    return this.tasksService.getTask(filterDto, user);
  }

  @ApiOperation({ summary: 'Task id' })
  @ApiResponse({ status: 200, description: 'Task id' })
  @Get('/:id')
  getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.getTaskById(id, user);
  }

  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({
    status: 201,
    description: 'The task has been successfully created.',
  })
  @Post()
  @UsePipes()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${user.username}" create a new task. Data: ${JSON.stringify(createTaskDto)}`,
    );
    return this.tasksService.createTask(createTaskDto, user);
  }

  @ApiOperation({ summary: 'Delete User' })
  @ApiResponse({ status: 200, description: 'Delete User.' })
  @Delete('/:id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.tasksService.deleteTask(id, user);
  }

  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({ status: 200, description: 'Update User.' })
  @Patch(':id/status')
  updateTaskStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', TaskStatusValidationPipe) status: TaskStatus,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateTaskStatus(id, status, user);
  }
}
