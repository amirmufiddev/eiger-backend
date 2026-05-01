import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MembershipModule } from './modules/membership/membership.module';
import { ProductModule } from './modules/product/product.module';
import { PaymentMethodModule } from './modules/payment-method/payment-method.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportModule } from './modules/report/report.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    WalletModule,
    MembershipModule,
    ProductModule,
    PaymentMethodModule,
    TransactionModule,
    AdminModule,
    ReportModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
