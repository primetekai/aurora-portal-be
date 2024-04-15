import { User } from '../auth/user.entity';
import { GetProductFilterDto } from './dto/get-products-filter.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductRepository } from './product.repository';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(private productRepository: ProductRepository) {}

  async createProduct(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    return this.productRepository.createProduct(createProductDto, user);
  }
  async getProducts(
    getProductFilterDto: GetProductFilterDto,
    user: User,
  ): Promise<Product[]> {
    return this.productRepository.getProduct(getProductFilterDto, user);
  }
  async getProductById(id: string, user: User): Promise<Product> {
    console.log('vo day', id);
    const found = await this.productRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!found) {
      throw new NotFoundException(`Product widh ID ${id} not found`);
    }
    return found;
  }

  async deleteProductById(id: string, user: User): Promise<void> {
    const result = await this.productRepository.delete({ id, userId: user.id });
    console.log(result);
    if (result.affected === 0) {
      throw new InternalServerErrorException(`Product with ID ${id} not found`);
    }
  }
}
