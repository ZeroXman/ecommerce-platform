import User from '../models/User.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const filter = {};

  if (search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.countDocuments(filter),
  ]);

  res.json({ ok: true, users, page: safePage, pages: Math.ceil(total / safeLimit) || 1, total });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    throw ApiError.badRequest('Rol inválido.');
  }

  if (req.params.id === req.user._id.toString() && role !== 'admin') {
    throw ApiError.badRequest('No puedes quitarte tus propios permisos de administrador.');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('Usuario no encontrado.');
  }

  user.role = role;
  await user.save();

  res.json({ ok: true, user: user.toJSON() });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('No puedes desactivar tu propia cuenta.');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('Usuario no encontrado.');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ ok: true, user: user.toJSON() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('No puedes eliminar tu propia cuenta.');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('Usuario no encontrado.');
  }

  const orders = await Order.countDocuments({ user: user._id });

  if (orders > 0) {
    throw ApiError.conflict('El usuario tiene pedidos asociados. Desactívalo en lugar de eliminarlo.');
  }

  await user.deleteOne();

  res.json({ ok: true, message: 'Usuario eliminado.' });
});
