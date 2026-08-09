import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import 'multer';
import type { StorageProvider } from './storage/storage-provider.interface';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const upload = jest.fn();
  const deleteAsset = jest.fn();
  const storage: StorageProvider = {
    upload,
    delete: deleteAsset,
  };
  const service = new UploadService(storage);

  beforeEach(() => {
    upload.mockReset().mockImplementation(async (file, options) => ({
      url: 'https://cdn.example.com/image.png',
      publicId: `${options.folder}/image.png`,
      fileName: file.fileName,
      mimeType: file.mimeType,
      width: file.width,
      height: file.height,
      size: file.size,
    }));
    deleteAsset.mockReset().mockResolvedValue(undefined);
  });

  const createPngFile = async (): Promise<Express.Multer.File> => {
    const buffer = await sharp({
      create: {
        width: 600,
        height: 400,
        channels: 3,
        background: '#315b4c',
      },
    })
      .png()
      .toBuffer();

    return {
      fieldname: 'image',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: buffer.length,
      buffer,
      stream: undefined as never,
      destination: '',
      filename: '',
      path: '',
    };
  };

  it('validates, resizes, and delegates to the configured provider', async () => {
    const file = await createPngFile();

    const result = await service.uploadImage(file, {
      folder: 'avatars',
      width: 300,
      height: 300,
      crop: 'fill',
    });

    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'photo.png',
        mimeType: 'image/png',
        width: 300,
        height: 300,
        buffer: expect.any(Buffer),
      }),
      {
        folder: 'avatars',
        width: 300,
        height: 300,
        crop: 'fill',
      },
    );
    expect(result).toMatchObject({
      publicId: 'avatars/image.png',
      width: 300,
      height: 300,
    });
  });

  it('rejects a declared MIME type that does not match image content', async () => {
    const file = await createPngFile();
    file.mimetype = 'image/jpeg';

    await expect(
      service.uploadImage(file, { folder: 'avatars' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects invalid folders and oversized images before storage', async () => {
    const file = await createPngFile();

    await expect(
      service.uploadImage(file, { folder: '../outside' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    file.size = 5_000_001;
    await expect(
      service.uploadImage(file, { folder: 'avatars' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });

  it('delegates deletion to the configured provider', async () => {
    await service.delete('avatars/image.png');
    expect(deleteAsset).toHaveBeenCalledWith('avatars/image.png');
  });
});
