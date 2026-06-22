import { Module } from '@nestjs/common';
import { InvitationCodesController } from './invitation-codes.controller';
import { InvitationCodesService } from './invitation-codes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvitationCodesController],
  providers: [InvitationCodesService],
})
export class InvitationCodesModule {}
