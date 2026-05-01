import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  qty: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [ProductItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  productIds: ProductItemDto[];

  @ApiProperty()
  @IsString()
  paymentMethodId: string;
}

export class ChangePaymentMethodDto {
  @ApiProperty()
  @IsString()
  paymentMethodId: string;
}

export class CheckoutResponseDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  total: number;
}
