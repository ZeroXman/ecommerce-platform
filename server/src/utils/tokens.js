import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
