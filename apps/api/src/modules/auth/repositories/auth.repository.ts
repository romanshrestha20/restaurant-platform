import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserData } from '../types/create-user.type';
import { LoginContext } from '../types/login-context.type';
import { UpdateUserData } from '../types/update-user.type';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserForLogin(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async createUser(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: 'CUSTOMER' },
                create: {
                  name: 'CUSTOMER',
                  description: 'Restaurant customer',
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async recordLoginAttempt(
    userId: string,
    success: boolean,
    context: LoginContext,
  ) {
    return this.prisma.loginHistory.create({
      data: {
        userId,
        success,
        ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
        ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      },
    });
  }

  async createSession(data: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    context: LoginContext;
  }) {
    return this.prisma.session.create({
      data: {
        id: data.id,
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        ...(data.context.ipAddress
          ? { ipAddress: data.context.ipAddress }
          : {}),
        ...(data.context.userAgent
          ? { userAgent: data.context.userAgent }
          : {}),
      },
    });
  }

  async findSessionWithUser(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            isActive: true,
            deletedAt: true,
            createdAt: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            roles: {
              select: {
                role: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async rotateSession(data: {
    id: string;
    currentRefreshTokenHash: string;
    nextRefreshTokenHash: string;
    expiresAt: Date;
    context: LoginContext;
  }) {
    return this.prisma.session.updateMany({
      where: {
        id: data.id,
        refreshTokenHash: data.currentRefreshTokenHash,
      },
      data: {
        refreshTokenHash: data.nextRefreshTokenHash,
        expiresAt: data.expiresAt,
        lastUsedAt: new Date(),
        ...(data.context.ipAddress
          ? { ipAddress: data.context.ipAddress }
          : {}),
        ...(data.context.userAgent
          ? { userAgent: data.context.userAgent }
          : {}),
      },
    });
  }

  async deleteSession(sessionId: string, userId: string) {
    return this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  async deleteAllSessions(userId: string) {
    return this.prisma.session.deleteMany({ where: { userId } });
  }

  async updateUserById(id: string, data: Partial<UpdateUserData>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
