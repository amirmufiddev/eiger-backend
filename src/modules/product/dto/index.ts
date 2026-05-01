import { ApiProperty } from '@nestjs/swagger';

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
}
