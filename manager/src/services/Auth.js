import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { InvalidRequest, Unathorized, Internal } from '../errors/index.js';
import sendEmail from '../utils/sendEmail.js';
import renderTemplate from '../utils/renderTemplate.js';
import formatDuration from '../utils/duration.js';
import { hashToken, generateRandomToken, compareToken } from '../utils/token.js';
import User from './User.js';
import Instance from './Instance.js';
import Link from './Link.js';
import config from '../../config/config.js';

const TOKEN_TYPES = {
  email: {
    hash: 'emailTokenHash',
    expires: 'emailTokenExpires',
    lifetime: config.token.emailLifetime,
  },
  password: {
    hash: 'resetPasswordTokenHash',
    expires: 'resetPasswordTokenExpires',
    lifetime: config.token.resetPasswordLifetime,
  },
  refresh: {
    hash: 'refreshTokenHash',
    expires: 'refreshTokenExpires',
    lifetime: config.token.refreshLifetime,
  },
};

const ABSENT_USER_HASH = '$2b$12$tA/bo5q3JorZEK53n9z9hO2TcbiIXJEhATHDhv7DtLHjTlNArrPG.';

const tokenFields = (type) => {
  const fields = TOKEN_TYPES[type];
  if (!fields) throw new Internal(`Unknown token type: ${type}`);

  return fields;
};

class Auth {
  static async saveToken(id, token, type = 'email') {
    const { hash, expires, lifetime } = tokenFields(type);

    await User.update(id, {
      [hash]: hashToken(token),
      [expires]: Date.now() + lifetime,
    });
  }

  static async wipeToken(id, type = 'email') {
    const { hash, expires } = tokenFields(type);

    await User.update(id, { [hash]: null, [expires]: null });
  }

  // Returns the permissions a user effectively has on an instance
  static async getInstancePermissions(user, id) {
    if (user.admin) return ['instance:read', ...config.instance.permissions, 'instance:owner'];

    const instance = await Instance.readOne(id);
    return Auth.permissionsForInstance(user, instance);
  }

  static async permissionsForInstance(user, instance) {
    if (user.admin || instance.ownerId === user.id) {
      return ['instance:read', ...config.instance.permissions, 'instance:owner'];
    }

    return Link.readUserPermissions(user.id, instance.id);
  }

  static async checkPermission(user, permission, id) {
    if (permission === 'logged') return true;
    if (user.admin) return true;
    if (permission === 'admin') return false;

    // Verify player have permission on instance
    if (permission.split(':')[0] === 'instance') {
      const instance = await Instance.readOne(id);

      // Verify if user is owner of the instance
      if (instance.ownerId === user.id) return true;

      // Verify if user has any link with instance
      const permissions = await Link.readUserPermissions(user.id, id);

      return permissions.includes(permission);
    }

    return false;
  }

  static generateAccessToken(userId) {
    return jwt.sign(
      {
        sub: userId,
        purpose: 'access',
      },
      config.token.jwtSecret,
      {
        expiresIn: Math.floor(config.token.accessLifetime / 1000),
        audience: 'api',
      },
    );
  }

  static verifyJWTToken(token) {
    try {
      const payload = jwt.verify(token, config.token.jwtSecret, { audience: 'api' });
      if (payload.purpose !== 'access') throw new Unathorized('Token is invalid!');

      return payload;
    } catch (err) {
      if (err instanceof Unathorized) throw err;
      if (err.name === 'TokenExpiredError') {
        throw new Unathorized('Token is expired!');
      } else if (err.name === 'JsonWebTokenError') {
        throw new Unathorized('Token is invalid!');
      } else if (err.name === 'NotBeforeError') {
        throw new Unathorized('Token is not yet valid!');
      }

      throw new Unathorized('Token is invalid!');
    }
  }

  static async authenticate(email, password) {
    const user = await User.readAllAttributes(null, email);

    const passwordsAreEqual = await bcrypt.compare(password, user?.password || ABSENT_USER_HASH);
    if (!user || !passwordsAreEqual) throw new Unathorized('Email or Password is invalid!');

    const accessToken = Auth.generateAccessToken(user.id);
    const refreshToken = generateRandomToken();
    await Auth.saveToken(user.id, refreshToken, 'refresh');

    const safeUser = await User.readOne(user.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  static async refreshAuthentication(token) {
    const hashedToken = hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'refresh');

    if (!user || !user?.refreshTokenHash) throw new InvalidRequest('Refresh token is invalid!');
    if (!compareToken(token, user.refreshTokenHash)) throw new InvalidRequest('Refresh token is invalid!');
    if (user.refreshTokenExpires < Date.now()) throw new InvalidRequest('Refresh token is expiried!');

    const accessToken = Auth.generateAccessToken(user.id);
    const refreshToken = generateRandomToken();
    await Auth.saveToken(user.id, refreshToken, 'refresh');

    const safeUser = await User.readOne(user.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  static async sendVerification(user) {
    const token = generateRandomToken();

    // Save Email token on database
    await Auth.saveToken(user.id, token, 'email');

    // Send Email
    const link = `${config.app.verifyUrl}?token=${token}`;
    const html = await renderTemplate('verify.html', {
      title: 'Verify your account',
      preheader: 'Confirm your email address to finish setting up your NodeCraft account.',
      name: user.name || 'there',
      link,
      token,
      expires: formatDuration(config.token.emailLifetime),
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify your NodeCraft account!',
      html,
      text: `Link: ${link} | Token: ${token}`,
    });
  }

  static async validateAccount(token) {
    const hashedToken = hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'email');

    if (!user || !user?.emailTokenHash) throw new InvalidRequest('Email token is invalid!');
    if (!compareToken(token, user.emailTokenHash)) throw new InvalidRequest('Email token is invalid!');
    if (user.emailTokenExpires < Date.now()) throw new InvalidRequest('Email token is expired!');

    // Set verified account and wipe tokens
    await User.update(user.id, { verified: true });
    await Auth.wipeToken(user.id, 'email');

    const safeUser = await User.readOne(user.id);

    return safeUser;
  }

  static async forgotPassword(email) {
    const user = await User.readAllAttributes(null, email);

    if (!user) return;

    const token = generateRandomToken();

    // Save the reset password token in the database
    await Auth.saveToken(user.id, token, 'password');

    // Send Email

    const link = `${config.app.resetPasswordUrl}?token=${token}`;
    const html = await renderTemplate('reset.html', {
      title: 'Reset your password',
      preheader: 'Use the link inside to choose a new NodeCraft password.',
      name: user.name || 'there',
      link,
      token,
      expires: formatDuration(config.token.resetPasswordLifetime),
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your NodeCraft account password!',
      html,
      text: `Link: ${link} | Token: ${token}`,
    });
  }

  static async resetPassword(token, password) {
    const hashedToken = hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'password');

    if (!user || !user?.resetPasswordTokenHash) throw new InvalidRequest('Reset password token is invalid!');
    if (!compareToken(token, user.resetPasswordTokenHash)) throw new InvalidRequest('Reset password token is invalid!');
    if (user.resetPasswordTokenExpires < Date.now()) throw new InvalidRequest('Reset password token is expiried!');

    // Change password and wipe tokens
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.update(user.id, { password: hashedPassword });
    await Auth.wipeToken(user.id, 'refresh');
    await Auth.wipeToken(user.id, 'password');

    const safeUser = await User.readOne(user.id);

    return safeUser;
  }
}

export default Auth;
