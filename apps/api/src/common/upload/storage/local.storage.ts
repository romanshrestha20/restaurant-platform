import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppEnvironment } from '../../../config/env';
import type { UploadResult } from '../types/upload-result.type';
import type { StorageProvider } from './storage-provider.interface';

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class LocalStorage implements StorageProvider {
  private readonly root: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService<AppEnvironment, true>) {
    this.root = resolve(
      process.cwd(),
      config.get('UPLOAD_LOCAL_DIR', { infer: true }),
    );
    this.publicUrl = config
      .get('UPLOAD_PUBLIC_URL', { infer: true })
      .replace(/\/$/, '');
  }

  async upload(
    file: Parameters<StorageProvider['upload']>[0],
    options: Parameters<StorageProvider['upload']>[1],
  ): Promise<UploadResult> {
    const extension = extensions[file.mimeType] ?? extname(file.fileName);
    const publicId = `${options.folder}/${randomUUID()}${extension}`;
    const target = this.resolvePublicId(publicId);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.buffer, { flag: 'wx' });

    return {
      url: `${this.publicUrl}/${publicId}`,
      publicId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      width: file.width,
      height: file.height,
      size: file.size,
    };
  }

  async delete(publicId: string): Promise<void> {
    const target = this.resolvePublicId(publicId);
    try {
      await unlink(target);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      throw error;
    }
  }

  private resolvePublicId(publicId: string): string {
    const target = resolve(this.root, publicId);
    if (target !== this.root && !target.startsWith(`${this.root}${sep}`)) {
      throw new Error('Invalid local upload public ID');
    }
    return target;
  }
}
