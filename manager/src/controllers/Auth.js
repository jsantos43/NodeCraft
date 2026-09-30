import config from '../../config/config.js';
import { InvalidRequest, Unathorized } from '../errors/index.js';
import Service from '../services/Auth.js';
import UserService from '../services/User.js';

const isProd = !config.app.isDev;

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'Lax',
};

const refreshCookieOptions = { ...cookieOptions, path: config.token.refreshCookiePath };

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: config.token.accessLifetime,
  });

  res.cookie('refreshToken', refreshToken, {
    ...refreshCookieOptions,
    maxAge: config.token.refreshLifetime,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', refreshCookieOptions);
};

class Auth {
  static async login(req, res, next) {
    try {
      const { body } = req;

      const {
        user, accessToken, refreshToken,
      } = await Service.authenticate(body.email, body.password);

      setAuthCookies(res, { accessToken, refreshToken });

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

      setAuthCookies(res, { accessToken, refreshToken });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const { user } = req;

      await UserService.revokeSessions(user.id);
      clearAuthCookies(res);

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
      const { token } = req.body;

      const user = await Service.validateAccount(token);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      await Service.forgotPassword(email);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await Service.resetPassword(token, password);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }
}

export default Auth;
