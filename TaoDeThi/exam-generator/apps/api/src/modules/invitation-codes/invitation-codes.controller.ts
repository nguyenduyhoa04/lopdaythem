import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitationCodesService } from './invitation-codes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('invitation-codes')
export class InvitationCodesController {
  constructor(
    private readonly invitationCodesService: InvitationCodesService,
  ) {}

  @Post()
  createCode(
    @Request() req: any,
    @Body() body: { studentId: string; targetRole: 'PARENT' | 'STUDENT' },
  ) {
    // Usually only TEACHER or ADMIN can do this
    return this.invitationCodesService.createInvitationCode(
      req.user.sub,
      body.studentId,
      body.targetRole,
    );
  }

  @Post(':code/redeem')
  redeemCode(@Request() req: any, @Param('code') code: string) {
    return this.invitationCodesService.redeemCode(
      req.user.sub,
      req.user.role,
      code,
    );
  }
}
