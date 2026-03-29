import { InvalidRequest } from '../errors/index.js';
import handleError from './handleError.js';

const validate = (schema, property = 'body') => (req, res, next) => {
  const data = req[property];

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) return handleError(new InvalidRequest(error.details), req, res);

  req[property] = value;
  return next();
};

export default validate;
