import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserData } from '../types/create-user.type';
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
