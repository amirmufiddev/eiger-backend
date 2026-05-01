import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/decorators/current-user.decorator';
import { TransactionReportDto, PnLReportDto } from './dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('transactions')
  @Roles(['member', 'admin'])
  @ApiOperation({ summary: 'Get transaction report (scoped by role)' })
  @ApiResponse({ status: 200, type: [TransactionReportDto] })
  async getTransactions(@CurrentUser() user: CurrentUserData) {
    return this.reportService.getTransactions(user.id, user.role);
  }

  @Get('pnl')
  @Roles(['member', 'admin'])
  @ApiOperation({
    summary: 'Get PnL report with SQL aggregation (scoped by role)',
  })
  @ApiResponse({ status: 200, type: PnLReportDto })
  async getPnL(@CurrentUser() user: CurrentUserData) {
    return this.reportService.getPnL(user.id, user.role);
  }
}
