import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CartService } from '../src/modules/cart/cart.service';
import { CatalogService } from '../src/modules/catalog/catalog.service';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';

describe('Customer catalog and cart API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: AuthTokenService;
  const catalog = { getRestaurantCatalog: jest.fn() };
  const cart = {
    getOrCreate: jest.fn(),
    getCurrent: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    revalidate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    catalog.getRestaurantCatalog.mockResolvedValue({ id: 'restaurant-1', slug: 'nordic-table', menus: [] });
    cart.getOrCreate.mockResolvedValue({ id: 'cart-1', version: 1, items: [] });
    cart.getCurrent.mockResolvedValue(null);
    cart.addItem.mockResolvedValue({ id: 'cart-1', version: 2, items: [{ id: 'line-1' }] });

    const fixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CatalogService).useValue(catalog)
      .overrideProvider(CartService).useValue(cart)
      .compile();
    app = fixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    tokenService = fixture.get(AuthTokenService);
    await app.init();
  });

  const token = () => tokenService.signAccessToken({
    id: 'customer-1', email: 'customer@example.com', roles: [{ role: { name: 'CUSTOMER' } }],
  });

  it('serves the customer catalog without restaurant membership or login', async () => {
    await request(app.getHttpServer()).get('/api/v1/catalog/restaurants/nordic-table').expect(200);
    expect(catalog.getRestaurantCatalog).toHaveBeenCalledWith('nordic-table');
  });

  it('requires customer authentication for cart access', async () => {
    await request(app.getHttpServer()).post('/api/v1/customer/carts').send({ restaurantId: 'restaurant-1' }).expect(401);
    expect(cart.getOrCreate).not.toHaveBeenCalled();
  });

  it('creates a cart and adds a fully configured item for the authenticated user', async () => {
    const authorization = { Authorization: `Bearer ${await token()}` };
    await request(app.getHttpServer())
      .post('/api/v1/customer/carts')
      .set(authorization)
      .send({ restaurantId: 'restaurant-1' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/customer/carts/cart-1/items')
      .set(authorization)
      .send({
        menuItemId: 'item-1', quantity: 2, version: 1,
        variantOptionIds: ['large'], addOns: [{ addOnId: 'cheese', quantity: 1 }],
      })
      .expect(201);
    expect(cart.addItem).toHaveBeenCalledWith(
      'customer-1', 'cart-1',
      expect.objectContaining({ menuItemId: 'item-1', version: 1 }),
    );
  });

  it('rejects malformed quantities and duplicate option selections', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/customer/carts/cart-1/items')
      .set('Authorization', `Bearer ${await token()}`)
      .send({ menuItemId: 'item-1', quantity: 0, version: 1, variantOptionIds: ['large', 'large'] })
      .expect(400);
    expect(cart.addItem).not.toHaveBeenCalled();
  });

  afterEach(async () => app?.close());
});
