import { GetProductFilterDto } from './dto/get-products-filter.dto';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Product } from './product.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { User } from 'src/auth/user.entity';

@EntityRepository(Product)
export class ProductRepository extends Repository<Product> {
  // async createProduct
  private logger = new Logger('Product repository');
  async createProduct(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    const { product_name, product_price } = createProductDto;
    const product = new Product();
    product.product_name = product_name;
    product.product_price = product_price;
    product.product_img = 'string';
    product.product_description = 'string';

    product.user = user;
    try {
      await product.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    // delete product.user;
    return product;
  }

  async getProduct(
    getProductFilterDto: GetProductFilterDto,
    user: User,
  ): Promise<Product[]> {
    const query = this.createQueryBuilder('product');
    const { search } = getProductFilterDto;
    query.innerJoinAndSelect('product.user', 'user');
    query.where('product.userId = :userId', { userId: user.id });
    if (search) {
      query.andWhere(
        'product.product_name LIKE :search OR product.product_description LIKE :search',
        { search: `%${search}%` },
      );
    }
    query.take || 2; //limit
    query.skip || 0; //ofset

    try {
      const product = await query.getMany();
      return product;
    } catch (error) {
      this.logger.error(
        `Failed to get product for user "${user.username}", Dto : ${JSON.stringify(getProductFilterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
