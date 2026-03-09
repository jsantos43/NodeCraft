import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  NotFound, InvalidRequest, Unathorized,
} from '../errors/index.js';
import sendEmail from '../utils/sendEmail.js';
import renderTemplate from '../utils/renderTemplate.js';
import User from './User.js';
import Instance from './Instance.js';
import Link from './Link.js';
import config from '../../config/config.js';

class Auth {
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async saveToken(id, token, type = 'email') {
    const hashedToken = Auth.hashToken(token);

    if (type === 'email') {
      await User.update(id, {
        emailTokenHash: hashedToken,
        emailTokenExpires: (Date.now() + config.token.emailLifetime),
      });
    } else if (type === 'password') {
      await User.update(id, {
        resetPasswordTokenHash: hashedToken,
        resetPasswordTokenExpires: (Date.now() + config.token.resetPasswordLifetime),
      });
    } else if (type === 'refresh') {
      await User.update(id, {
        refreshTokenHash: hashedToken,
        refreshTokenExpires: (Date.now() + config.token.refreshLifetime),
      });
    }
  }

  static async wipeToken(id, type = 'email') {
    if (type === 'email') await User.update(id, { emailTokenHash: null, emailTokenExpires: null });
    else if (type === 'password') await User.update(id, { resetPasswordTokenHash: null, resetPasswordTokenExpires: null });
    else if (type === 'refresh') await User.update(id, { refreshTokenHash: null, refreshTokenExpires: null });
  }

  static async checkPermission(user, permission, id) {
    if (permission === 'logged') return true;
    if (user.admin) return true;
    if (permission === 'admin') return false;

    // Verify player have permission on instance
    if (permission.split(':')[0] === 'instance') {
      const instance = await Instance.readOne(id);

      // Verify if user is owner of the instance
      if (instance.owner === user.id) return true;

      // Verify if user has any link with instance
      const permissions = await Link.readUserPermissions(user.id, id);
      if (!permissions) return false;
      if (permissions?.includes(permission)) return true;

      return false;
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

  static generateRandomToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  static verifyJWTToken(token) {
    try {
      const payload = jwt.verify(token, config.token.jwtSecret);
      return payload;
    } catch (err) {
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
    if (!user) throw new Unathorized('Email or Password is invalid!');

    const passwordsAreEqual = await bcrypt.compare(password, user.password);
    if (!passwordsAreEqual) throw new Unathorized('Email or Password is invalid!');

    const accessToken = Auth.generateAccessToken(user.id);
    const refreshToken = Auth.generateRandomToken();
    await Auth.saveToken(user.id, refreshToken, 'refresh');

    const safeUser = await User.readOne(user.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  static async refreshAuthentication(token) {
    const hashedToken = Auth.hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'refresh');

    if (!user || !user?.refreshTokenHash) throw new InvalidRequest('Refresh token is invalid!');
    if (hashedToken !== user.refreshTokenHash) throw new InvalidRequest('Refresh token is invalid!');
    if (user.refreshTokenExpires < Date.now()) throw new InvalidRequest('Refresh token is expiried!');

    const accessToken = Auth.generateAccessToken(user.id);
    const refreshToken = Auth.generateRandomToken();
    await Auth.saveToken(user.id, refreshToken, 'refresh');

    const safeUser = await User.readOne(user.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  static async sendVerification(user) {
    const token = Auth.generateRandomToken();

    // Save Email token on database
    await Auth.saveToken(user.id, token, 'email');

    // Send Email
    const link = `${config.site.validateUrl}?token=${token}`;
    const html = await renderTemplate('email/verify.html', {
      name: user.name || 'usuário',
      link,
      token,
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify your Nodecraft Account!',
      html,
      text: `Link: ${link} | Token: ${token}`,
    });
  }

  static async validateAccount(token) {
    const hashedToken = Auth.hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'email');

    if (!user || !user?.emailTokenHash) throw new InvalidRequest('Email token is invalid!');
    if (hashedToken !== user.emailTokenHash) throw new InvalidRequest('Email token is invalid!');
    if (user.emailTokenExpires < Date.now()) throw new InvalidRequest('Email token is expired!');

    // Set verified account and wipe tokens
    await User.update(user.id, { verified: true });
    await Auth.wipeToken(user.id, 'email');

    const safeUser = await User.readOne(user.id);

    return safeUser;
  }

  static async forgotPassword(email) {
    const user = await User.readAllAttributes(null, email);
    if (!user) throw new NotFound('User not found!');

    const token = Auth.generateRandomToken();

    // Save the reset password token in the database
    await Auth.saveToken(user.id, token, 'password');

    // Send Email

    const link = `${config.site.resetUrl}?token=${token}`;
    const html = await renderTemplate('email/reset.html', {
      name: user.name || 'usuário',
      link,
      token,
      expires: config.token.resetPasswordLifetime,
      year: new Date().getFullYear(),
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your Nodecraft account password!',
      html,
      text: `Link: ${link} | Token: ${token}`,
    });

    const safeUser = await User.readOne(user.id);

    return safeUser;
  }

  static async resetPassword(token, password) {
    const hashedToken = Auth.hashToken(token);
    const user = await User.readAllAttributes(null, null, hashedToken, 'password');

    if (!user || !user?.resetPasswordTokenHash) throw new InvalidRequest('Reset password token is invalid!');
    if (hashedToken !== user.resetPasswordTokenHash) throw new InvalidRequest('Reset password token is invalid!');
    if (user.resetPasswordTokenExpires < Date.now()) throw new InvalidRequest('Reset password token is expiried!');

    // Change password and wipe tokens
    const hashedPassword = bcrypt.hashSync(password, 12);
    await User.update(user.id, { password: hashedPassword });
    await Auth.wipeToken(user.id, 'password');

    const safeUser = await User.readOne(user.id);

    return safeUser;
  }
}

export default Auth;
