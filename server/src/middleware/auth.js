import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

function extractToken(req) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('Debes iniciar sesión para continuar.');
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw ApiError.unauthorized('Token inválido o expirado.');
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('La cuenta no existe o está desactivada.');
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = await User.findById(payload.sub);
  } catch (error) {
    req.user = null;
  }

  next();
});

export const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Solo los administradores pueden acceder a este recurso.'));
  }

  next();
};
