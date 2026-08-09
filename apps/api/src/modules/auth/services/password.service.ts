import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  hashPassword(password: string): Promise<string> {
    return hash(password, PASSWORD_SALT_ROUNDS);
  }

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return compare(password, passwordHash);
  }
}
