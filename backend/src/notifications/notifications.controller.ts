import { Body, Controller, Get, Post } from "@nestjs/common";

import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("subscribe")
  subscribe(
    @Body()
    body: {
      endpoint: string;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
    },
  ) {
    return this.notificationsService.subscribe(body);
  }

  @Post("test")
  test(@Body() body: { title: string; body: string }) {
    return this.notificationsService.notify(body.title, body.body);
  }

  @Get("recent")
  recent() {
    return this.notificationsService.recent();
  }
}

