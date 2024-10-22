import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.SECRET);
      req.user = payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Si el token ha expirado, no lanzamos un error de inmediato.
        req.tokenExpired = true; // Marcamos que el token ha expirado.
      } else {
        console.error('Invalid token:', error);
      }
    }

    next();
  }
}
