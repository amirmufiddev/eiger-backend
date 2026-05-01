import { ApiProperty } from '@nestjs/swagger';

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'bronze' })
  tier: string;

  @ApiProperty({ example: 0 })
  points: number;
}
