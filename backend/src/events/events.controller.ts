import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { NearbyEventsDto } from "./dto/nearby-events.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.eventsService.findById(id);
  }

  @Post("nearby")
  nearby(@Body() body: NearbyEventsDto) {
    return this.eventsService.getNearby(body.latitude, body.longitude, body.radiusKm);
  }
}
