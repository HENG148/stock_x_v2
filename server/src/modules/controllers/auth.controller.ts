import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { CreatedSession } from '../../types/auth.types.js';
import { authService, AuthService } from '../service/auth.service.js';
import { LoginBody, RegisterBody } from '../validations/auth.validation.js';
import { sendNoContent, sendSuccess } from '../../utils/reponse.js';
import { AppError } from '../../shared/error/app-error.js';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
};

function setSessionCookie(res: Response, session: CreatedSession): void {
  res.cookie(env.SESSION_COOKIE_NAME, session.token, {
    ...baseCookieOptions,
    expires: session.expiresAt,
  });
}

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as RegisterBody;
    const { user, session } = await this.service.register(body, req.get('user-agent') ?? null);
    setSessionCookie(res, session);
    sendSuccess(res, { user }, 201);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as LoginBody;
    const { user, session } = await this.service.login(body, req.get('user-agent') ?? null);
    setSessionCookie(res, session);
    sendSuccess(res, { user });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const token: unknown = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (typeof token === 'string' && token.length > 0) {
      await this.service.logout(token);
    }
    res.clearCookie(env.SESSION_COOKIE_NAME, baseCookieOptions);
    sendNoContent(res);
  };

  me = (req: Request, res: Response): void => {
    if (!req.user) throw AppError.unauthenticated();
    sendSuccess(res, { user: req.user });
  };
}

export const authController = new AuthController();