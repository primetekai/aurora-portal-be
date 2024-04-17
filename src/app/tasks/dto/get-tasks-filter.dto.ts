import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';
import { IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class GetTaskFilterDto {
  @IsOptional()
  @IsIn([TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.DONE])
  @ApiProperty({ default: '', required: false })
  status: TaskStatus;

  @IsOptional()
  @IsNotEmpty()
  @ApiProperty({ default: '', required: false })
  search: string;
}
