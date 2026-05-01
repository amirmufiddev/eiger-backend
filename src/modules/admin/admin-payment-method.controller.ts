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
import { AdminPaymentMethodService } from './admin-payment-method.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodResponseDto,
} from './dto';

@ApiTags('Admin - Payment Methods')
@Controller('admin/payment-methods')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
@ApiBearerAuth()
export class AdminPaymentMethodController {
  constructor(
    private readonly adminPaymentMethodService: AdminPaymentMethodService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment methods (including inactive)' })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async getPaymentMethods() {
    return this.adminPaymentMethodService.getPaymentMethods();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiResponse({ status: 201, type: PaymentMethodResponseDto })
  async createPaymentMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.adminPaymentMethodService.createPaymentMethod(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.adminPaymentMethodService.updatePaymentMethod(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or deactivate a payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted or deactivated',
  })
  async deletePaymentMethod(@Param('id') id: string) {
    return this.adminPaymentMethodService.deletePaymentMethod(id);
  }
}
