import type { UploadService } from '../../common/upload/upload.service';
import type { RestaurantsRepository } from './restaurants.repository';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService media lifecycle', () => {
  const replaceMedia = jest.fn();
  const removeMedia = jest.fn();
  const uploadImage = jest.fn();
  const deleteQuietly = jest.fn();
  const service = new RestaurantsService(
    { replaceMedia, removeMedia } as unknown as RestaurantsRepository,
    { uploadImage, deleteQuietly } as unknown as UploadService,
  );
  const file = {
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('image'),
    size: 5,
  } as Express.Multer.File;
  const upload = {
    url: 'https://example.com/new-logo.webp',
    publicId: 'restaurants/restaurant-1/logo/new',
    fileName: 'logo.png',
    mimeType: 'image/png',
    width: 800,
    height: 800,
    size: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uploadImage.mockResolvedValue(upload);
    deleteQuietly.mockResolvedValue(undefined);
  });

  it('removes a newly uploaded asset when the database replacement fails', async () => {
    replaceMedia.mockRejectedValue(new Error('database failed'));

    await expect(service.uploadLogo('restaurant-1', file)).rejects.toThrow(
      'database failed',
    );

    expect(deleteQuietly).toHaveBeenCalledWith(upload.publicId);
  });

  it('removes the old storage asset only after a successful replacement', async () => {
    replaceMedia.mockResolvedValue({
      type: 'LOGO',
      media: upload,
      previousPublicId: 'restaurants/restaurant-1/logo/old',
    });

    await expect(
      service.uploadLogo('restaurant-1', file),
    ).resolves.toMatchObject({ type: 'LOGO', publicId: upload.publicId });

    expect(deleteQuietly).toHaveBeenCalledTimes(1);
    expect(deleteQuietly).toHaveBeenCalledWith(
      'restaurants/restaurant-1/logo/old',
    );
  });

  it('deletes storage only when a database media record existed', async () => {
    removeMedia.mockResolvedValueOnce('restaurants/restaurant-1/logo/old');
    await service.removeLogo('restaurant-1');
    expect(deleteQuietly).toHaveBeenCalledWith(
      'restaurants/restaurant-1/logo/old',
    );

    jest.clearAllMocks();
    removeMedia.mockResolvedValueOnce(null);
    await service.removeLogo('restaurant-1');
    expect(deleteQuietly).not.toHaveBeenCalled();
  });
});
