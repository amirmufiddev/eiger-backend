import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { MembershipResponseDto } from './dto';

@ApiTags('Membership')
@Controller('membership')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @Roles(['member'])
  @ApiOperation({ summary: 'Get current user membership info' })
  @ApiResponse({
    status: 200,
    description: 'Membership info',
    type: MembershipResponseDto,
  })
  async getMembership(
    @CurrentUser() user: CurrentUserData,
  ): Promise<MembershipResponseDto> {
    return this.membershipService.getMembership(user.id);
  }
}
