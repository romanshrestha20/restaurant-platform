import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UploadResult } from '../../common/upload/types/upload-result.type';
import type { CreateAddressDto } from './dto/create-address.dto';
import type { UpdateAddressDto } from './dto/update-address.dto';

const profileSelect = {
  id: true,
  email: true,
  phone: true,
  emailVerified: true,
  phoneVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  media: {
    where: { isPrimary: true },
    take: 1,
    select: {
      alt: true,
      media: {
        select: {
          url: true,
          publicId: true,
          fileName: true,
          mimeType: true,
          width: true,
          height: true,
          size: true,
          createdAt: true,
        },
      },
    },
  },
  profile: {
    select: {
      firstName: true,
      lastName: true,
      bio: true,
      gender: true,
      dateOfBirth: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAddresses(userId: string) { return this.prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }); }
  async createAddress(userId: string, data: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault || !(await tx.address.count({ where: { userId } }))) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({ data: { ...data, userId, isDefault: data.isDefault ?? false } });
    });
  }
  async updateAddress(userId: string, addressId: string, data: UpdateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id: addressId, userId } });
      if (!existing) return null;
      if (data.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id: addressId }, data });
    });
  }
  async deleteAddress(userId: string, addressId: string) { const deleted = await this.prisma.address.deleteMany({ where: { id: addressId, userId } }); return { deleted: deleted.count > 0 }; }
  async searchAddresses(query: string) {
    const normalized = query.trim();
    if (normalized.length < 3) return [];
    const params = new URLSearchParams({ q: normalized, format: 'jsonv2', addressdetails: '1', limit: '5' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'Tablefolk/1.0 customer address search' } });
    if (!response.ok) return [];
    const results = await response.json() as Array<{ display_name: string; lat: string; lon: string; address?: { house_number?: string; road?: string; city?: string; town?: string; village?: string; postcode?: string; country_code?: string } }>;
    return results.map((result) => ({ formattedAddress: result.display_name, latitude: Number(result.lat), longitude: Number(result.lon), street: [result.address?.road, result.address?.house_number].filter(Boolean).join(' '), city: result.address?.city ?? result.address?.town ?? result.address?.village ?? '', postalCode: result.address?.postcode ?? '', country: (result.address?.country_code ?? '').toUpperCase() }));
  }

  findByUserId(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      select: profileSelect,
    });
  }

  findPasswordByUserId(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      select: { id: true, passwordHash: true },
    });
  }

  async updateByUserId(userId: string, data: UpdateProfileDto) {
    const profileData = {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.dateOfBirth !== undefined
        ? {
            dateOfBirth:
              data.dateOfBirth === null ? null : new Date(data.dateOfBirth),
          }
        : {}),
    };

    await this.prisma.user.update({
      where: { id: userId, isActive: true, deletedAt: null },
      data: {
        ...(data.phone !== undefined
          ? { phone: data.phone, phoneVerified: false }
          : {}),
        ...(Object.keys(profileData).length > 0
          ? { profile: { update: profileData } }
          : {}),
      },
    });

    return this.findByUserId(userId);
  }

  replacePhoto(userId: string, photo: UploadResult, alt: string) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findFirst({
        where: { id: userId, isActive: true, deletedAt: null },
        select: { id: true },
      });

      if (!user) {
        return null;
      }

      const previous = await transaction.userMedia.findFirst({
        where: { userId, isPrimary: true },
        select: {
          mediaId: true,
          media: { select: { publicId: true } },
        },
      });

      await transaction.userMedia.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      const media = await transaction.media.create({
        data: {
          ...photo,
          users: {
            create: { userId, alt, isPrimary: true },
          },
        },
      });

      if (previous) {
        await transaction.userMedia.delete({
          where: {
            userId_mediaId: { userId, mediaId: previous.mediaId },
          },
        });
        await transaction.media.delete({ where: { id: previous.mediaId } });
      }

      await transaction.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      });

      return {
        media,
        previousPublicId: previous?.media.publicId ?? null,
      };
    });
  }

  changePasswordByUserId(userId: string, passwordHash: string) {
    return this.prisma.$transaction(async (transaction) => {
      const update = await transaction.user.updateMany({
        where: { id: userId, isActive: true, deletedAt: null },
        data: { passwordHash, updatedAt: new Date() },
      });

      if (update.count !== 1) {
        return false;
      }

      await transaction.session.deleteMany({ where: { userId } });
      return true;
    });
  }
}
