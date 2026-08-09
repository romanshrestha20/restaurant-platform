import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AppEnvironment } from '../../../config/env';
import { LocalStorage } from './local.storage';

describe('LocalStorage', () => {
  let uploadRoot: string;

  beforeEach(async () => {
    uploadRoot = await mkdtemp(join(tmpdir(), 'restaurant-uploads-'));
  });

  afterEach(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
  });

  const createStorage = () => {
    const values = {
      UPLOAD_LOCAL_DIR: uploadRoot,
      UPLOAD_PUBLIC_URL: 'http://localhost:3001/uploads',
    };
    const config = {
      get: jest.fn((key: keyof typeof values) => values[key]),
    } as unknown as ConfigService<AppEnvironment, true>;

    return new LocalStorage(config);
  };

  it('writes and deletes generated files below the configured root', async () => {
    const storage = createStorage();
    const buffer = Buffer.from('image-bytes');

    const result = await storage.upload(
      {
        buffer,
        fileName: 'avatar.png',
        mimeType: 'image/png',
        width: 300,
        height: 300,
        size: buffer.length,
      },
      { folder: 'avatars' },
    );

    await expect(readFile(join(uploadRoot, result.publicId))).resolves.toEqual(
      buffer,
    );
    expect(result.url).toBe(
      `http://localhost:3001/uploads/${result.publicId}`,
    );

    await storage.delete(result.publicId);
    await expect(
      readFile(join(uploadRoot, result.publicId)),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects public IDs that escape the configured root', async () => {
    const storage = createStorage();
    await expect(storage.delete('../outside.png')).rejects.toThrow(
      'Invalid local upload public ID',
    );
  });
});
