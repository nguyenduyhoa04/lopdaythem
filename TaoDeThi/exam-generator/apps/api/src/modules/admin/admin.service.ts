import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private ensureAdmin(user: any) {
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới được phép');
    }
  }

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalStudents = await this.prisma.student.count();
    const totalExams = await this.prisma.exam.count();
    const totalQuestions = await this.prisma.question.count();

    const recentExams = await this.prisma.exam.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: true,
        subject: true,
      },
    });

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true,
      },
    });

    return {
      totalUsers,
      totalStudents,
      totalExams,
      totalQuestions,
      recentExams,
      usersByRole,
    };
  }

  async getUsers() {
    return this.usersService.findAll();
  }

  async getUser(id: string) {
    return this.usersService.findOne(id);
  }

  async createUser(data: any) {
    return this.usersService.create(data);
  }

  async updateUser(id: string, data: any) {
    return this.usersService.update(id, data);
  }

  async deleteUser(id: string) {
    return this.usersService.remove(id);
  }
}
