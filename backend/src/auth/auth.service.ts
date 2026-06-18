import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Role, User } from "@prisma/client";

import { APP_SECRET, REFRESH_SECRET, PASSWORD_SALT } from "../common/constants";
import { createToken, comparePassword, hashPassword } from "../common/crypto-jwt";
import type { AuthTokenPayload } from "../common/types";
import { UsersService } from "../users/users.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "createdAt" | "updatedAt">;

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  private createAuthResponse(user: AuthUser) {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    };

    return {
      user,
      accessToken: createToken(payload, APP_SECRET, 60 * 60 * 12),
      refreshToken: createToken(payload, REFRESH_SECRET, 60 * 60 * 24 * 30),
    };
  }

  async register(dto: RegisterDto) {
    if (!dto.name || !dto.email || !dto.password) {
      throw new BadRequestException("Name, email, and password are required");
    }

    if (await this.usersService.findByEmail(dto.email)) {
      throw new BadRequestException("An account already exists for this email");
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashPassword(dto.password, PASSWORD_SALT),
      role: dto.role ?? "user",
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !comparePassword(dto.password, PASSWORD_SALT, user.password)) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.createAuthResponse(this.usersService.sanitize(user));
  }

  async refresh(payload: AuthTokenPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Unknown user");
    }

    return this.createAuthResponse(this.usersService.sanitize(user));
  }
}

