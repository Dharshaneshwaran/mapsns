import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/roles.decorator";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Controller("admin/events")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.eventsService.remove(id);
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.eventsService.publish(id, true);
  }

  @Post(":id/unpublish")
  unpublish(@Param("id") id: string) {
    return this.eventsService.publish(id, false);
  }
}
