import { AuthModule } from './../auth/auth.module';
import { ProductRepository } from './product.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  // Sau khi tao entity roi moi import o day
  imports: [TypeOrmModule.forFeature([ProductRepository]), AuthModule],
  providers: [ProductsService, ProductRepository],
  controllers: [ProductsController],
})
export class ProductsModule {}
