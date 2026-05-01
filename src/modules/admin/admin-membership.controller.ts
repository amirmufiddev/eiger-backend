import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminMembershipService } from './admin-membership.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
  MembershipResponseDto,
} from './dto';

@ApiTags('Admin - Memberships')
@Controller('admin/memberships')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
@ApiBearerAuth()
export class AdminMembershipController {
  constructor(
    private readonly adminMembershipService: AdminMembershipService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all memberships' })
  @ApiResponse({ status: 200, type: [MembershipResponseDto] })
  async getMemberships() {
    return this.adminMembershipService.getMemberships();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get membership by ID' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  async getMembershipById(@Param('id') id: string) {
    return this.adminMembershipService.getMembershipById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new membership for a user' })
  @ApiResponse({ status: 201, type: MembershipResponseDto })
  @ApiResponse({ status: 409, description: 'User already has a membership' })
  async createMembership(@Body() dto: CreateMembershipDto) {
    return this.adminMembershipService.createMembership(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update membership tier or points' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  async updateMembership(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.adminMembershipService.updateMembership(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a membership' })
  @ApiResponse({ status: 200, description: 'Membership deleted' })
  async deleteMembership(@Param('id') id: string) {
    return this.adminMembershipService.deleteMembership(id);
  }
}
