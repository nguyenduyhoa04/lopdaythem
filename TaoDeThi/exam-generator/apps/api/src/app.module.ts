import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ParentsModule } from './modules/parents/parents.module';
import { AdminModule } from './modules/admin/admin.module';
import { StudentsModule } from './modules/students/students.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { InvitationCodesModule } from './modules/invitation-codes/invitation-codes.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { EnrollmentRequestsModule } from './modules/enrollment-requests/enrollment-requests.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    QuestionsModule,
    ExamsModule,
    ParentsModule,
    AdminModule,
    StudentsModule,
    SchedulesModule,
    LessonsModule,
    InvitationCodesModule,
    ProgressModule,
    ClassroomsModule,
    EnrollmentRequestsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
