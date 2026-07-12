import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** SHA-style hashing for refresh tokens stored at rest (bcrypt is fine here too). */
export function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, env.BCRYPT_SALT_ROUNDS);
}

export function compareToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
