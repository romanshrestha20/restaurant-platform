import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import type { AppEnvironment } from '../../../config/env';
import type { UploadResult } from '../types/upload-result.type';
import type { StorageProvider } from './storage-provider.interface';

@Injectable()
export class CloudinaryStorage implements StorageProvider {
  private readonly configured: boolean;

  constructor(config: ConfigService<AppEnvironment, true>) {
    const cloudName = config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = config.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = config.get('CLOUDINARY_API_SECRET', { infer: true });

    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  upload(
    file: Parameters<StorageProvider['upload']>[0],
    options: Parameters<StorageProvider['upload']>[1],
  ): Promise<UploadResult> {
    this.ensureConfigured();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `restaurant-platform/${options.folder}`,
          public_id: randomUUID(),
          overwrite: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary returned no upload result'));
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: file.fileName,
            mimeType: file.mimeType,
            width: result.width,
            height: result.height,
            size: result.bytes,
          });
        },
      );

      stream.end(file.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary storage is not configured',
      );
    }
  }
}
