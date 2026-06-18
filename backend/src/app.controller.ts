import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: "ok",
      service: "event-discovery-api",
      timestamp: new Date().toISOString(),
    };
  }
}

