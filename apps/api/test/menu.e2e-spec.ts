import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';
import { MenuRepository } from '../src/modules/menu/menu.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeGateway } from '../src/common/realtime';

describe('Restaurant menu API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: AuthTokenService;
  const findMembership = jest.fn();
  const repository = {
    listMenus: jest.fn(),
    createMenu: jest.fn(),
    getMenu: jest.fn(),
    updateMenu: jest.fn(),
    deleteMenu: jest.fn(),
    listCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    listItems: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
  };
  const emitToRestaurant = jest.fn();
  const menu = {
    id: 'menu-1',
    restaurantId: 'restaurant-1',
    name: 'Dinner',
    description: null,
    sortOrder: 0,
    isActive: true,
    categories: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    findMembership.mockResolvedValue({
      role: { name: 'OWNER' },
      restaurant: { isActive: true, deletedAt: null },
    });
    repository.listMenus.mockResolvedValue({ data: [menu], total: 1 });
    repository.createMenu.mockResolvedValue(menu);
    repository.getMenu.mockResolvedValue(menu);
    repository.updateMenu.mockResolvedValue({ ...menu, name: 'Evening' });
    repository.deleteMenu.mockResolvedValue(true);
    repository.listCategories.mockResolvedValue({ data: [], total: 0 });
    repository.createCategory.mockResolvedValue({
      id: 'category-1',
      restaurantId: 'restaurant-1',
      menuId: 'menu-1',
      name: 'Mains',
      sortOrder: 0,
      status: 'ACTIVE',
    });
    repository.updateCategory.mockResolvedValue({ id: 'category-1' });
    repository.deleteCategory.mockResolvedValue(true);
    repository.listItems.mockResolvedValue({ data: [], total: 0 });
    repository.createItem.mockResolvedValue({
      id: 'item-1',
      restaurantId: 'restaurant-1',
      categoryId: 'category-1',
      name: 'Salmon',
      basePrice: '24.50',
      sortOrder: 0,
      status: 'AVAILABLE',
      media: [],
    });
    repository.updateItem.mockResolvedValue({ id: 'item-1' });
    repository.deleteItem.mockResolvedValue(true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ restaurantMember: { findUnique: findMembership } })
      .overrideProvider(MenuRepository)
      .useValue(repository)
      .overrideProvider(RealtimeGateway)
      .useValue({ emitToRestaurant })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    tokenService = moduleFixture.get(AuthTokenService);
    await app.init();
  });

  const token = () =>
    tokenService.signAccessToken({
      id: 'user-1',
      email: 'staff@example.com',
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

  it('requires authentication and restaurant membership', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menus')
      .expect(401);

    findMembership.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menus')
      .set('Authorization', `Bearer ${await token()}`)
      .expect(403);
    expect(repository.listMenus).not.toHaveBeenCalled();
  });

  it('returns standardized paginated menu, category, and item lists', async () => {
    const authorization = { Authorization: `Bearer ${await token()}` };
    const menus = await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menus?page=1&limit=10')
      .set(authorization)
      .expect(200);
    const categories = await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menu-categories?menuId=menu-1')
      .set(authorization)
      .expect(200);
    const items = await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menu-items?categoryId=category-1')
      .set(authorization)
      .expect(200);

    expect(menus.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(categories.body.pagination.total).toBe(0);
    expect(items.body.pagination.total).toBe(0);
  });

  it('creates the complete minimal menu hierarchy', async () => {
    const authorization = { Authorization: `Bearer ${await token()}` };
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menus')
      .set(authorization)
      .send({ name: ' Dinner ', sortOrder: 0 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menu-categories')
      .set(authorization)
      .send({ menuId: 'menu-1', name: ' Mains ' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menu-items')
      .set(authorization)
      .send({ categoryId: 'category-1', name: ' Salmon ', price: 24.5 })
      .expect(201);

    expect(repository.createMenu).toHaveBeenCalledWith(
      'restaurant-1',
      expect.objectContaining({ name: 'Dinner' }),
    );
    expect(repository.createCategory).toHaveBeenCalledWith(
      'restaurant-1',
      expect.objectContaining({ name: 'Mains', menuId: 'menu-1' }),
    );
    expect(repository.createItem).toHaveBeenCalledWith(
      'restaurant-1',
      expect.objectContaining({ name: 'Salmon', price: 24.5 }),
    );
    expect(emitToRestaurant).toHaveBeenCalledWith(
      'restaurant-1',
      'menu:item_created',
      expect.objectContaining({
        event: 'menu:item_created',
        data: { item: expect.objectContaining({ id: 'item-1' }) },
      }),
    );
  });

  it('allows kitchen staff to create and update but not delete', async () => {
    findMembership.mockResolvedValue({
      role: { name: 'CHEF' },
      restaurant: { isActive: true, deletedAt: null },
    });
    const authorization = { Authorization: `Bearer ${await token()}` };

    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menu-items')
      .set(authorization)
      .send({ categoryId: 'category-1', name: 'Soup', price: 8 })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/api/v1/restaurants/restaurant-1/menu-items/item-1')
      .set(authorization)
      .send({ status: 'UNAVAILABLE' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/menu-items/item-1')
      .set(authorization)
      .expect(403);
  });

  it('allows front-of-house staff to read but denies menu writes', async () => {
    findMembership.mockResolvedValue({
      role: { name: 'WAITER' },
      restaurant: { isActive: true, deletedAt: null },
    });
    const authorization = { Authorization: `Bearer ${await token()}` };

    await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/menus/menu-1')
      .set(authorization)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menus')
      .set(authorization)
      .send({ name: 'Lunch' })
      .expect(403);
  });

  it('rejects invalid prices and unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/menu-items')
      .set('Authorization', `Bearer ${await token()}`)
      .send({
        categoryId: 'category-1',
        name: 'Soup',
        price: -1,
        allergens: ['nuts'],
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('property allergens should not exist'),
        expect.stringContaining('price must not be less than 0'),
      ]),
    );
    expect(repository.createItem).not.toHaveBeenCalled();
  });

  afterEach(async () => app?.close());
});
