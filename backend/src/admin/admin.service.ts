import { Injectable } from "@nestjs/common";

import { EventsService } from "../events/events.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  async dashboard() {
    return {
      ...(await this.eventsService.summary()),
      totalUsers: (await this.usersService.findAll()).length,
      serverTime: new Date().toISOString(),
    };
  }
}
