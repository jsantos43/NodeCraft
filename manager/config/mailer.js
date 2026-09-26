import nodemailer from 'nodemailer';
import Joi from 'joi';
import config from './config.js';
import logger from './logger.js';
import { ServiceUnavailable } from '../src/errors/index.js';

const senderSchema = Joi.string().email({ tlds: { allow: false } }).required();

const getSender = () => {
  const { error } = senderSchema.validate(config.email.fromAddress);
  if (error) {
    throw new ServiceUnavailable('Configure EMAIL_FROM_ADDRESS with a valid sender email address.');
  }

  return { name: config.email.fromName, address: config.email.fromAddress };
};

const mailer = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

const verifyMailer = async () => {
  if (!config.email.enable) return false;

  try {
    getSender();
    await mailer.verify();
    logger.info({ host: config.email.host }, 'Email service is ready');

    return true;
  } catch (err) {
    logger.error({ err, host: config.email.host }, 'Email service failed to verify');

    return false;
  }
};

export { verifyMailer, getSender };
export default mailer;
