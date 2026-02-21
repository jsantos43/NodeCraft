import mailer from '../../config/mailer.js';
import config from '../../config/config.js';

const sendEmail = async ({
  to, subject, html, text = '',
}) => {
  await mailer.verify();

  await mailer.sendMail({
    from: `"Nodecraft API " <${config.email.user}>`,
    to,
    subject,
    html,
    text,
  });
};

export default sendEmail;
