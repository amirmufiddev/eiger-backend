import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminProductService } from './admin-product.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from './dto';

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
@ApiBearerAuth()
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products (including inactive)' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getProducts() {
    return this.adminProductService.getProducts();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminProductService.createProduct(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminProductService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or deactivate a product' })
  @ApiResponse({ status: 200, description: 'Product deleted or deactivated' })
  async deleteProduct(@Param('id') id: string) {
    return this.adminProductService.deleteProduct(id);
  }
}
