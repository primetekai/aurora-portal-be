import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  product_name: string;
  @IsNotEmpty()
  product_price: number;
}
