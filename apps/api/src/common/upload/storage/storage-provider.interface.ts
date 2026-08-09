import type {
  StorageUploadFile,
  UploadImageOptions,
  UploadResult,
} from '../types/upload-result.type';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageProvider {
  upload(
    file: StorageUploadFile,
    options: UploadImageOptions,
  ): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
