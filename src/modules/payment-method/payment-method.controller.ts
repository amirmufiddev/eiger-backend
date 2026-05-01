import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentMethodService } from './payment-method.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PaymentMethodResponseDto } from './dto';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active payment methods' })
  @ApiResponse({
    status: 200,
    description: 'List of payment methods',
    type: [PaymentMethodResponseDto],
  })
  async getPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodService.getPaymentMethods();
  }
}
