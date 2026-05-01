import { Module } from '@nestjs/common';
import { AdminProductController } from './admin-product.controller';
import { AdminPaymentMethodController } from './admin-payment-method.controller';
import { AdminMembershipController } from './admin-membership.controller';
import { AdminProductService } from './admin-product.service';
import { AdminPaymentMethodService } from './admin-payment-method.service';
import { AdminMembershipService } from './admin-membership.service';

@Module({
  controllers: [
    AdminProductController,
    AdminPaymentMethodController,
    AdminMembershipController,
  ],
  providers: [
    AdminProductService,
    AdminPaymentMethodService,
    AdminMembershipService,
  ],
})
export class AdminModule {}
