import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(ApiError.unprocessable('Datos inválidos.', details));
}
