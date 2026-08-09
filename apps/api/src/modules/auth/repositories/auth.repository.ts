import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserData } from '../types/create-user.type';
import { LoginContext } from '../types/login-context.type';
import { UpdateUserInput } from '../types/update-user.type';
import type { AccountTokenType } from '../types/account-token.type';

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

  async findUserForAccountAction(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isActive: true,
        deletedAt: true,
      },
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

  async replaceAccountToken(data: {
    userId: string;
    type: AccountTokenType;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.verificationToken.updateMany({
        where: {
          userId: data.userId,
          type: data.type,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      return transaction.verificationToken.create({
        data: {
          userId: data.userId,
          type: data.type,
          token: data.tokenHash,
          expiresAt: data.expiresAt,
        },
      });
    });
  }

  async verifyEmailWithToken(tokenHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const token = await transaction.verificationToken.findFirst({
        where: {
          token: tokenHash,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
          expiresAt: { gt: new Date() },
          user: { isActive: true, deletedAt: null },
        },
        select: { id: true, userId: true },
      });

      if (!token) {
        return false;
      }

      const claim = await transaction.verificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });

      if (claim.count !== 1) {
        return false;
      }

      await transaction.user.update({
        where: { id: token.userId },
        data: { emailVerified: true },
      });

      await transaction.verificationToken.updateMany({
        where: {
          userId: token.userId,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      return true;
    });
  }

  async resetPasswordWithToken(
    tokenHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const token = await transaction.verificationToken.findFirst({
        where: {
          token: tokenHash,
          type: 'PASSWORD_RESET',
          usedAt: null,
          expiresAt: { gt: new Date() },
          user: { isActive: true, deletedAt: null },
        },
        select: { id: true, userId: true },
      });

      if (!token) {
        return false;
      }

      const claim = await transaction.verificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });

      if (claim.count !== 1) {
        return false;
      }

      await transaction.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      });
      await transaction.session.deleteMany({
        where: { userId: token.userId },
      });
      await transaction.verificationToken.updateMany({
        where: {
          userId: token.userId,
          type: 'PASSWORD_RESET',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      return true;
    });
  }

  async updateUserById(id: string, data: Partial<UpdateUserInput>) {
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
