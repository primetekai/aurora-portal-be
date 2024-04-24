import { IsNotEmpty } from 'class-validator';

export class CreateLanguagesDto {
  @IsNotEmpty()
  language: string;
  @IsNotEmpty()
  name: string;
}
