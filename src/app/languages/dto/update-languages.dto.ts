import { IsNotEmpty } from 'class-validator';

export class UpdateLanguagesDto {
  @IsNotEmpty()
  language: string;
  @IsNotEmpty()
  name: string;
}
