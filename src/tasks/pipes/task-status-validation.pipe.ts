/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { PipeTransform, BadRequestException } from '@nestjs/common';
import { TaskStatus } from '../task-status.enum';
export class TaskStatusValidationPipe implements PipeTransform {
  // readonly luôn luôn là 1 mảng niếu để object nó sẽ lỗi
  readonly allowedStatuses = [
    TaskStatus.OPEN,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE,
  ];
  // transform(value:any, metadata: ArgumentMetadata) {
  transform(value: any) {
    if (!this.isStatusValid(value)) {
      throw new BadRequestException(`"${value}" is am invalid status`);
    }
    return value;

    value = value.toUpperCase();
    return value;
  }
  private isStatusValid(status: any) {
    const idx = this.allowedStatuses.indexOf(status);
    return idx !== -1;
  }
}
