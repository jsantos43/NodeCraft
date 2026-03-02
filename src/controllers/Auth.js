import config from '../../config/config.js';
import { InvalidRequest, InvalidToken } from '../errors/index.js';
import Service from '../services/Auth.js';

class Auth {
  static async login(req, res, next) {
    try {
      const data = req.body;

      const {
        user, accessToken, refreshToken,
      } = await Service.authenticate(data.email, data.password);

      // Set accessToken in response cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.app.stage !== 'DEV',
        sameSite: config.app.stage === 'DEV' ? 'Lax' : 'strict',
      });

      // Set refreshToken in response cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.app.stage !== 'DEV',
        sameSite: config.app.stage === 'DEV' ? 'Lax' : 'strict',
        path: '/auth/refresh',
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
      if (!token) throw new InvalidToken('Refresh token is null!');

      const { user, accessToken, refreshToken } = await Service.refreshAuthentication(token);

      // Set accessToken in response cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.app.stage !== 'DEV',
        sameSite: config.app.stage === 'DEV' ? 'Lax' : 'strict',
      });

      // Set refreshToken in response cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.app.stage !== 'DEV',
        sameSite: config.app.stage === 'DEV' ? 'Lax' : 'strict',
        path: '/auth/refresh',
      });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const { user } = req;

      await Service.wipeToken(user.id, 'refresh');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken', {
        path: '/auth/refresh',
      });

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
      if (typeof token !== 'string') throw new InvalidToken('Email token is invalid!');

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

      if (typeof token !== 'string') throw new InvalidToken();
      if (!password) throw new InvalidRequest('Password cannot be null!');

      const user = await Service.resetPassword(token.trim(), password);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }
}

export default Auth;
