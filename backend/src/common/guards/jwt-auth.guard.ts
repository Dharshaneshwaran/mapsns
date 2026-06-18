import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { APP_SECRET } from "../constants";
import { verifyToken } from "../crypto-jwt";
import type { AuthTokenPayload } from "../types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : undefined;

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      request.user = verifyToken<AuthTokenPayload>(token, APP_SECRET);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

