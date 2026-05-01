import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ProductResponseDto } from './dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductResponseDto],
  })
  async getProducts(): Promise<ProductResponseDto[]> {
    return this.productService.getProducts();
  }
}
