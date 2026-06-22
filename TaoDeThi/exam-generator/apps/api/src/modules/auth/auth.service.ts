import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.prisma.$transaction(async (tx) => {
      let validInvitation: any = null;
      if (dto.invitationCode) {
        validInvitation = await tx.invitationCode.findUnique({
          where: { code: dto.invitationCode },
          include: { student: true },
        });

        if (!validInvitation || validInvitation.isUsed) {
          throw new BadRequestException(
            'Mã mời không hợp lệ hoặc đã được sử dụng',
          );
        }

        if (validInvitation.targetRole !== dto.role) {
          throw new BadRequestException(
            `Mã mời này dành cho vai trò ${validInvitation.targetRole}, không phải ${dto.role}`,
          );
        }
      }

      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
        },
      });

      if (validInvitation) {
        await tx.invitationCode.update({
          where: { id: validInvitation.id },
          data: { isUsed: true, usedByUserId: user.id },
        });

        if (dto.role === 'STUDENT') {
          await tx.student.update({
            where: { id: validInvitation.studentId },
            data: { userId: user.id },
          });
        } else if (dto.role === 'PARENT') {
          await tx.parentStudent.create({
            data: {
              parentUserId: user.id,
              studentId: validInvitation.studentId,
              isOwner: false,
            },
          });
        }
      }

      const { passwordHash: _, ...result } = user;
      return { success: true, data: result, message: 'Đăng ký thành công' };
    });
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
        user,
      },
      message: 'Login successful',
    };
  }
}
