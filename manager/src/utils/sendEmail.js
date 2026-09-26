import mailer, { getSender } from '../../config/mailer.js';
import config from '../../config/config.js';
import { ServiceUnavailable } from '../errors/index.js';

const sendEmail = async ({
  to, subject, html, text,
}) => {
  if (!config.email.enable) throw new ServiceUnavailable('Email service is not set!');

  await mailer.sendMail({
    from: getSender(),
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
};

export default sendEmail;
