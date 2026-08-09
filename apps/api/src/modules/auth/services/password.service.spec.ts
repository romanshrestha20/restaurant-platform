import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords with bcrypt and verifies the correct password', async () => {
    const passwordHash = await service.hashPassword('a-secure-password');

    expect(passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(passwordHash).not.toBe('a-secure-password');
    await expect(
      service.verifyPassword('a-secure-password', passwordHash),
    ).resolves.toBe(true);
    await expect(
      service.verifyPassword('wrong-password', passwordHash),
    ).resolves.toBe(false);
  });
});
