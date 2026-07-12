import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { comparePassword, hashPassword, hashToken, compareToken } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { env } from '../../config/env';
import ms from '../../utils/ms';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function publicUser(user: { id: string; name: string; email: string; role: Role; isActive: boolean }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}

/** Issues an access token + a persisted, hashed, rotatable refresh token. */
async function issueTokens(user: { id: string; email: string; role: Role }): Promise<AuthTokens> {
  const expiresAt = new Date(Date.now() + ms(env.JWT_REFRESH_EXPIRES_IN));
  const record = await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: 'pending', expiresAt },
  });

  const refreshToken = signRefreshToken({ sub: user.id, jti: record.id });
  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.update({ where: { id: record.id }, data: { tokenHash } });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, actorId?: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('A user with this email already exists.');

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
    });

    await recordAudit({ userId: actorId ?? user.id, action: AUDIT_ACTIONS.CREATE, entity: 'User', entityId: user.id });
    return publicUser(user);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials.');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid credentials.');

    const tokens = await issueTokens(user);
    await recordAudit({ userId: user.id, action: AUDIT_ACTIONS.LOGIN, entity: 'User', entityId: user.id });
    return { user: publicUser(user), ...tokens };
  },

  /** Verifies + rotates a refresh token (single-use). */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is no longer valid.');
    }
    const matches = await compareToken(refreshToken, record.tokenHash);
    if (!matches) throw ApiError.unauthorized('Refresh token mismatch.');

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) throw ApiError.unauthorized('User is no longer active.');

    // Rotate: revoke the used token, then issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    return issueTokens(user);
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.jti, revoked: false },
        data: { revoked: true },
      });
    } catch {
      // Idempotent: an invalid token is already "logged out".
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found.');
    return publicUser(user);
  },
};
