import { Body, Controller, Post } from "@nestjs/common";

import type { AuthTokenPayload } from "../common/types";
import { AuthService } from "./auth.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("refresh")
  refresh(@Body() payload: AuthTokenPayload) {
    return this.authService.refresh(payload);
  }
}
