export type UploadResult = {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
};

export type ImageCrop = 'fill' | 'fit' | 'limit';

export type UploadImageOptions = {
  folder: string;
  width?: number;
  height?: number;
  crop?: ImageCrop;
};

export type StorageUploadFile = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
};
