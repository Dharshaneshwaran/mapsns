import { Module } from "@nestjs/common";

import { AdminController } from "./admin/admin.controller";
import { AdminService } from "./admin/admin.service";
import { AppController } from "./app.controller";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AdminEventsController } from "./events/admin-events.controller";
import { EventsController } from "./events/events.controller";
import { EventsService } from "./events/events.service";
import { NotificationsController } from "./notifications/notifications.controller";
import { NotificationsService } from "./notifications/notifications.service";
import { PrismaService } from "./prisma/prisma.service";
import { UploadsController } from "./uploads/uploads.controller";
import { UploadsService } from "./uploads/uploads.service";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    EventsController,
    AdminEventsController,
    UploadsController,
    NotificationsController,
    AdminController,
  ],
  providers: [
    AuthService,
    UsersService,
    EventsService,
    UploadsService,
    NotificationsService,
    AdminService,
    PrismaService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
