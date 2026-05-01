import {
  Controller,
  Post,
  Patch,
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
import { TransactionService } from './transaction.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import {
  CheckoutDto,
  ChangePaymentMethodDto,
  CheckoutResponseDto,
} from './dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('checkout')
  @Roles(['member'])
  @ApiOperation({ summary: 'Checkout with atomic transaction' })
  @ApiResponse({
    status: 201,
    description: 'Checkout successful',
    type: CheckoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient balance',
  })
  @ApiResponse({ status: 403, description: 'Admin cannot checkout' })
  async checkout(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.transactionService.checkout(
      user.id,
      user.role,
      dto.productIds,
      dto.paymentMethodId,
    );
  }

  @Patch(':id/payment-method')
  @Roles(['member', 'admin'])
  @ApiOperation({
    summary: 'Change payment method for pending/failed transaction',
  })
  @ApiResponse({ status: 200, description: 'Payment method changed' })
  @ApiResponse({
    status: 400,
    description: 'Cannot change for completed/cancelled transaction',
  })
  async changePaymentMethod(
    @CurrentUser() user: CurrentUserData,
    @Param('id') transactionId: string,
    @Body() dto: ChangePaymentMethodDto,
  ) {
    return this.transactionService.changePaymentMethod(
      transactionId,
      user.id,
      user.role,
      dto.paymentMethodId,
    );
  }
}
