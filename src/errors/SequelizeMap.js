import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from 'sequelize';
import InvalidRequest from './InvalidRequest.js';

const mapSequelizeError = (error) => {
  if (error instanceof ValidationError) {
    return new InvalidRequest(
      'Invalid Data!',
      error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    );
  }

  if (error instanceof UniqueConstraintError) {
    return new InvalidRequest(
      'Duplicate registration',
      error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    );
  }

  if (error instanceof ForeignKeyConstraintError) {
    return new InvalidRequest(
      'Invalid reference',
      [{
        message: 'Invalid relationship',
      }],
    );
  }

  return null;
};

export default mapSequelizeError;
