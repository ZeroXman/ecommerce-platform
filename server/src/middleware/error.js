import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor.';
  let details = error.details || null;

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Identificador inválido.';
  }

  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Datos inválidos.';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || { field: '' })[0];
    message = `El valor de "${field}" ya está registrado.`;
    details = error.keyValue || null;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido.';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado.';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  }

  res.status(statusCode).json({
    ok: false,
    error: message,
    details,
    ...(env.isProduction ? {} : { stack: error.stack }),
  });
}
