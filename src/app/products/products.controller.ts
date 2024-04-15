import { GetProductFilterDto } from './dto/get-products-filter.dto';
import { User } from 'src/app/auth/user.entity';
import { GetUser } from 'src/app/auth/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import {
  Body,
  Controller,
  UseGuards,
  Logger,
  Query,
  ValidationPipe,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  Delete,
  Get,
  Post,
} from '@nestjs/common/decorators/http/request-mapping.decorator';
import { UsePipes } from '@nestjs/common/decorators/core/use-pipes.decorator';

@UseGuards(AuthGuard())
@Controller('products')
export class ProductsController {
  // Logger
  private logger = new Logger('ProductController');
  constructor(private productsService: ProductsService) {}
  @Post()
  @UsePipes()
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ): Promise<Product> {
    this.logger.verbose(
      `User "${user.username}" create a new product. Data: ${JSON.stringify(createProductDto)}`,
    );
    return this.productsService.createProduct(createProductDto, user);
  }

  @Get()
  getProducts(
    @Query(ValidationPipe) getProductFilterDto: GetProductFilterDto,
    @GetUser() user: User,
  ): Promise<Product[]> {
    this.logger.verbose(
      `User "${user.username}" retieving all product. Filters: ${JSON.stringify(getProductFilterDto)}`,
    );
    return this.productsService.getProducts(getProductFilterDto, user);
  }

  @Get('/:id')
  getProductById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<Product> {
    console.log(id);
    return this.productsService.getProductById(id, user);
  }

  @Delete('/:id')
  deleteProductById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.productsService.deleteProductById(id, user);
  }
}
