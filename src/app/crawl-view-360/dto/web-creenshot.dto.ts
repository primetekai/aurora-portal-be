import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class WebScreenshotDto {
  @ApiProperty({
    description: 'Đường dẫn của trang web cần chụp PDF',
    example: 'https://example.com',
  })
  @IsNotEmpty()
  @IsUrl({}, { message: 'URL không hợp lệ' })
  url: string;
}
