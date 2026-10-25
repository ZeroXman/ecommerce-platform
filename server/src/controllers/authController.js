import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/tokens.js';

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, refreshCookieOptions);
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: undefined });
}

function authPayload(user, accessToken) {
  return { ok: true, user: user.toJSON(), accessToken };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findByEmail(email);

  if (existing) {
    throw ApiError.conflict('Ya existe una cuenta con ese email.');
  }

  const user = await User.create({ name, email, password });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await user.addRefreshToken(refreshToken);
  setRefreshCookie(res, refreshToken);

  res.status(201).json(authPayload(user, accessToken));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email).select('+password +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email o contraseña incorrectos.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Tu cuenta está desactivada. Contacta con soporte.');
  }

  user.lastLoginAt = new Date();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await user.addRefreshToken(refreshToken);
  setRefreshCookie(res, refreshToken);

  res.json(authPayload(user, accessToken));
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw ApiError.unauthorized('No hay sesión activa.');
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Sesión expirada, vuelve a iniciar sesión.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');

  if (!user || !(await user.hasRefreshToken(token))) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Sesión revocada.');
  }

  const accessToken = signAccessToken(user);
  const rotated = signRefreshToken(user);

  user.refreshTokens = user.refreshTokens.filter((entry) => entry.token !== token);
  await user.addRefreshToken(rotated);
  setRefreshCookie(res, rotated);

  res.json(authPayload(user, accessToken));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub).select('+refreshTokens');

      if (user) {
        await user.removeRefreshToken(token);
      }
    } catch (error) {
      // Token inválido o expirado: solo limpiamos la cookie.
    }
  }

  clearRefreshCookie(res);
  res.json({ ok: true, message: 'Sesión cerrada correctamente.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ ok: true, user: req.user.toJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, addresses } = req.body;
  const user = req.user;

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (Array.isArray(addresses)) user.addresses = addresses;

  await user.save();

  res.json({ ok: true, user: user.toJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('La contraseña actual no es correcta.');
  }

  user.password = newPassword;
  await user.save();

  res.json({ ok: true, message: 'Contraseña actualizada.' });
});
