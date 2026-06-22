import { Module } from '@nestjs/common';
import { EnrollmentRequestsController } from './enrollment-requests.controller';
import { EnrollmentRequestsService } from './enrollment-requests.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentRequestsController],
  providers: [EnrollmentRequestsService],
  exports: [EnrollmentRequestsService],
})
export class EnrollmentRequestsModule {}
