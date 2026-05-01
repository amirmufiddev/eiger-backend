import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class TransactionReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: PaymentMethodDto })
  paymentMethod: PaymentMethodDto;
}

export class PnLReportDto {
  @ApiProperty()
  revenue: number;

  @ApiProperty()
  cost: number;

  @ApiProperty()
  operationalCost: number;

  @ApiProperty()
  grossProfit: number;

  @ApiProperty()
  netProfit: number;

  @ApiProperty()
  marginPercent: number;

  @ApiProperty()
  transactionCount: number;
}
