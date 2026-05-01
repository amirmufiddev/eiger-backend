import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class TopUpDto {
  @ApiProperty({ example: 50000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class WalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  balance: number;
}
