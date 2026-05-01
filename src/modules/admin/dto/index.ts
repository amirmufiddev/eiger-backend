import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Tiket A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  operationalCost?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  operationalCost?: number;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  price: number;

  @ApiProperty({ nullable: true })
  costPrice: number | null;

  @ApiProperty({ nullable: true })
  operationalCost: number | null;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'EWALLET' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'E-Wallet EAL' })
  @IsString()
  name: string;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;
}

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class CreateMembershipDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'gold' })
  @IsString()
  tier: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  points: number;
}

export class UpdateMembershipDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;
}

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tier: string;

  @ApiProperty()
  points: number;
}
