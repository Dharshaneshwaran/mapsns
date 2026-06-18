import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: { user: { sub: string } }) {
    return this.usersService.getProfile(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  byId(@Param("id") id: string) {
    return this.usersService.getProfile(id);
  }
}
