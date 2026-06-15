import config from '../../config/config.js';
import { InvalidRequest, Unathorized } from '../errors/index.js';
import Service from '../services/Auth.js';

class Auth {
  static async login(req, res, next) {
    try {
      const data = req.body;

      const {
        user, accessToken, refreshToken,
      } = await Service.authenticate(data.email, data.password);

      const isProd = config.app.stage !== 'DEV';
      const refreshPath = isProd ? '/api/auth/refresh' : '/auth/refresh';

      // Set accessToken in response cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'Lax',
        maxAge: 15 * 60 * 1000,
      });

      // Set refreshToken in response cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'Lax',
        path: refreshPath,
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      // Get refresh token from request
      const token = req?.cookies?.refreshToken;
      if (!token) throw new Unathorized('Refresh token is null!');

      const { user, accessToken, refreshToken } = await Service.refreshAuthentication(token);

      const isProd = config.app.stage !== 'DEV';
      const refreshPath = isProd ? '/api/auth/refresh' : '/auth/refresh';

      // Set accessToken in response cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'Lax',
        maxAge: 15 * 60 * 1000,
      });

      // Set refreshToken in response cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'Lax',
        path: refreshPath,
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const { user } = req;

      const refreshPath = config.app.stage !== 'DEV' ? '/api/auth/refresh' : '/auth/refresh';

      await Service.wipeToken(user.id, 'refresh');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken', { path: refreshPath });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async sendVerification(req, res, next) {
    try {
      const { user } = req;
      if (user.verified) throw new InvalidRequest('User is already verified!');

      await Service.sendVerification(user);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async validateAccount(req, res, next) {
    try {
      const token = req?.body?.token;
      if (typeof token !== 'string') throw new InvalidRequest('Email token is invalid!');

      const user = await Service.validateAccount(token.trim());

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const email = req?.body?.email;

      const user = await Service.forgotPassword(email);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const token = req?.body?.token;
      const password = req?.body?.password;

      if (typeof token !== 'string') throw new InvalidRequest('Reset password token is invalid!');
      if (!password) throw new InvalidRequest('Password cannot be null!');

      const user = await Service.resetPassword(token.trim(), password);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }
}

export default Auth;
