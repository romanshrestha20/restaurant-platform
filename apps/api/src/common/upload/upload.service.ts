import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import sharp, { type FitEnum } from 'sharp';
import 'multer';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from './storage/storage-provider.interface';
import type {
  ImageCrop,
  StorageUploadFile,
  UploadImageOptions,
} from './types/upload-result.type';

const MAX_IMAGE_SIZE = 5_000_000;
const MAX_IMAGE_DIMENSION = 4096;
const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const FIT_BY_CROP: Record<ImageCrop, keyof FitEnum> = {
  fill: 'cover',
  fit: 'contain',
  limit: 'inside',
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
  ) {}

  async uploadImage(file: Express.Multer.File, options: UploadImageOptions) {
    this.validateRequest(file, options);

    let pipeline = sharp(file.buffer, {
      failOn: 'warning',
      limitInputPixels: 40_000_000,
    }).rotate();

    if (options.width || options.height) {
      const crop = options.crop ?? 'limit';
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: FIT_BY_CROP[crop],
        withoutEnlargement: crop === 'limit',
      });
    }

    let output;
    try {
      output = await pipeline.toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException('File must contain a valid image');
    }

    const mimeType = MIME_BY_FORMAT[output.info.format];
    if (!mimeType || mimeType !== file.mimetype) {
      throw new BadRequestException(
        'Image content does not match the declared file type',
      );
    }

    const storageFile: StorageUploadFile = {
      buffer: output.data,
      fileName: file.originalname,
      mimeType,
      width: output.info.width,
      height: output.info.height,
      size: output.info.size,
    };

    return this.storage.upload(storageFile, options);
  }

  delete(publicId: string) {
    return this.storage.delete(publicId);
  }

  async deleteQuietly(publicId: string): Promise<void> {
    try {
      await this.delete(publicId);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not delete uploaded asset ${publicId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private validateRequest(
    file: Express.Multer.File | undefined,
    options: UploadImageOptions,
  ): asserts file is Express.Multer.File {
    if (!file?.buffer) {
      throw new BadRequestException('Image file is required');
    }
    if (file.size > MAX_IMAGE_SIZE || file.buffer.length > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
    if (!Object.values(MIME_BY_FORMAT).includes(file.mimetype)) {
      throw new BadRequestException('Image must be JPEG, PNG, or WebP');
    }
    if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(options.folder)) {
      throw new BadRequestException('Upload folder is invalid');
    }

    for (const dimension of [options.width, options.height]) {
      if (
        dimension !== undefined &&
        (!Number.isInteger(dimension) ||
          dimension < 1 ||
          dimension > MAX_IMAGE_DIMENSION)
      ) {
        throw new BadRequestException(
          `Image dimensions must be between 1 and ${MAX_IMAGE_DIMENSION}`,
        );
      }
    }
  }
}
