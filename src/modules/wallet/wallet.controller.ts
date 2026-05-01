import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { TopUpDto, WalletResponseDto } from './dto';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @Roles(['member'])
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet info',
    type: WalletResponseDto,
  })
  async getWallet(
    @CurrentUser() user: CurrentUserData,
  ): Promise<WalletResponseDto> {
    return this.walletService.getWallet(user.id);
  }

  @Post('top-up')
  @Roles(['member'])
  @ApiOperation({ summary: 'Top up wallet balance' })
  @ApiResponse({ status: 200, description: 'Top up successful' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  async topUp(@CurrentUser() user: CurrentUserData, @Body() dto: TopUpDto) {
    return this.walletService.topUp(user.id, dto.amount);
  }
}
