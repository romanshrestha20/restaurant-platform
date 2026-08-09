import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnvironment } from '../../config/env';
import { CloudinaryStorage } from './storage/cloudinary.storage';
import { LocalStorage } from './storage/local.storage';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { UploadService } from './upload.service';

@Module({
  providers: [
    CloudinaryStorage,
    LocalStorage,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, CloudinaryStorage, LocalStorage],
      useFactory: (
        config: ConfigService<AppEnvironment, true>,
        cloudinaryStorage: CloudinaryStorage,
        localStorage: LocalStorage,
      ) =>
        config.get('UPLOAD_STORAGE_PROVIDER', { infer: true }) === 'local'
          ? localStorage
          : cloudinaryStorage,
    },
    UploadService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
