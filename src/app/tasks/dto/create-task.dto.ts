//install libarary and view đocs
// https://www.npmjs.com/package/class-validate
import { IsNotEmpty } from 'class-validator';
export class CreateTaskDto {
  @IsNotEmpty()
  title: string;
  @IsNotEmpty()
  description: string;
}
