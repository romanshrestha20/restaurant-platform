import { PrismaService } from '../../prisma/prisma.service';
import { ProfileRepository } from './profile.repository';

describe('ProfileRepository', () => {
  const findFirst = jest.fn();
  const update = jest.fn();
  const updateManyUser = jest.fn();
  const findPrimaryMedia = jest.fn();
  const updateManyMedia = jest.fn();
  const deleteUserMedia = jest.fn();
  const createMedia = jest.fn();
  const deleteMedia = jest.fn();
  const deleteManySession = jest.fn();
  const transaction = {
    user: { findFirst, update, updateMany: updateManyUser },
    userMedia: {
      findFirst: findPrimaryMedia,
      updateMany: updateManyMedia,
      delete: deleteUserMedia,
    },
    media: { create: createMedia, delete: deleteMedia },
    session: { deleteMany: deleteManySession },
  };
  const prisma = {
    ...transaction,
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const repository = new ProfileRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    findFirst.mockReset().mockResolvedValue({ id: 'user-1' });
    update.mockReset().mockResolvedValue({ id: 'user-1' });
    findPrimaryMedia.mockReset().mockResolvedValue(null);
    updateManyMedia.mockReset().mockResolvedValue({ count: 0 });
    deleteUserMedia.mockReset().mockResolvedValue({});
    createMedia.mockReset().mockResolvedValue({ id: 'media-1' });
    deleteMedia.mockReset().mockResolvedValue({});
    updateManyUser.mockReset().mockResolvedValue({ count: 1 });
    deleteManySession.mockReset().mockResolvedValue({ count: 2 });
  });

  it('scopes profile reads to the active authenticated user', async () => {
    await repository.findByUserId('current-user');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'current-user',
          isActive: true,
          deletedAt: null,
        },
      }),
    );
  });

  it('scopes updates and resets verification when the phone changes', async () => {
    await repository.updateByUserId('current-user', {
      firstName: 'Aino',
      phone: '+358501234567',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'current-user',
          isActive: true,
          deletedAt: null,
        },
        data: expect.objectContaining({
          phone: '+358501234567',
          phoneVerified: false,
          profile: { update: { firstName: 'Aino' } },
        }),
      }),
    );
    expect(findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: 'current-user',
          isActive: true,
          deletedAt: null,
        },
      }),
    );
  });

  it('replaces only the authenticated user primary photo', async () => {
    findPrimaryMedia.mockResolvedValue({
      mediaId: 'old-media',
      media: { publicId: 'profile-photos/old' },
    });

    const result = await repository.replacePhoto(
      'current-user',
      {
        url: 'https://res.cloudinary.com/demo/new.webp',
        publicId: 'profile-photos/new',
        fileName: 'new.png',
        mimeType: 'image/png',
        width: 800,
        height: 800,
        size: 100,
      },
      'Current User profile photo',
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'current-user',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(findPrimaryMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'current-user', isPrimary: true },
      }),
    );
    expect(createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicId: 'profile-photos/new',
          users: {
            create: {
              userId: 'current-user',
              alt: 'Current User profile photo',
              isPrimary: true,
            },
          },
        }),
      }),
    );
    expect(deleteUserMedia).toHaveBeenCalledWith({
      where: {
        userId_mediaId: {
          userId: 'current-user',
          mediaId: 'old-media',
        },
      },
    });
    expect(result).toEqual({
      media: { id: 'media-1' },
      previousPublicId: 'profile-photos/old',
    });
  });

  it('changes the authenticated user password and revokes every session', async () => {
    const changed = await repository.changePasswordByUserId(
      'current-user',
      'new-password-hash',
    );

    expect(updateManyUser).toHaveBeenCalledWith({
      where: {
        id: 'current-user',
        isActive: true,
        deletedAt: null,
      },
      data: {
        passwordHash: 'new-password-hash',
        updatedAt: expect.any(Date),
      },
    });
    expect(deleteManySession).toHaveBeenCalledWith({
      where: { userId: 'current-user' },
    });
    expect(changed).toBe(true);
  });
});
