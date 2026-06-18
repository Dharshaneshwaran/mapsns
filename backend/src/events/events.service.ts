import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { haversineDistanceKm } from "../common/haversine";
import { seededEvents } from "../common/seed";
import type { EventRecord } from "../common/types";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateEventDto } from "./dto/create-event.dto";
import type { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (seededEvents.length === 0) {
      return;
    }

    const count = await this.prisma.event.count();
    if (count > 0) {
      return;
    }

    await this.prisma.event.createMany({
      data: seededEvents.map((event) => this.toPrismaEventData(event)),
      skipDuplicates: true,
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async findById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
  }

  async getNearby(latitude: number, longitude: number, radiusKm: number) {
    const events = await this.prisma.event.findMany({
      where: { isPublished: true },
      orderBy: [{ createdAt: "desc" }],
    });

    return events
      .map((event) => ({
        ...event,
        distanceKm: haversineDistanceKm(
          { latitude, longitude },
          {
            latitude: event.latitude,
            longitude: event.longitude,
          },
        ),
      }))
      .filter((event) => event.distanceKm <= radiusKm)
      .sort((left, right) => left.distanceKm - right.distanceKm);
  }

  async create(dto: CreateEventDto) {
    this.ensureRequiredText(dto.title, "title");
    this.ensureRequiredText(dto.description, "description");
    this.ensureRequiredText(dto.address, "address");
    this.ensureRequiredText(dto.city, "city");
    this.ensureRequiredText(dto.bannerImage, "bannerImage");
    this.ensureRequiredText(dto.organizer, "organizer");
    this.ensureRequiredText(dto.contact, "contact");
    this.validateCoordinates(dto.latitude, dto.longitude);

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        address: dto.address,
        place: dto.place?.trim() ? dto.place.trim() : null,
        floor: dto.floor?.trim() ? dto.floor.trim() : null,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        bannerImage: dto.bannerImage,
        organizer: dto.organizer,
        contact: dto.contact,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        gallery: dto.gallery ?? [],
        isPublished: false,
        popularity: 0,
      },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.findById(id);
    return this.prisma.event.update({
      where: { id: existing.id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.address ? { address: dto.address } : {}),
        ...(dto.place ? { place: dto.place } : {}),
        ...(dto.floor ? { floor: dto.floor } : {}),
        ...(dto.city ? { city: dto.city } : {}),
        ...(typeof dto.latitude === "number" ? { latitude: dto.latitude } : {}),
        ...(typeof dto.longitude === "number" ? { longitude: dto.longitude } : {}),
        ...(dto.bannerImage ? { bannerImage: dto.bannerImage } : {}),
        ...(dto.organizer ? { organizer: dto.organizer } : {}),
        ...(dto.contact ? { contact: dto.contact } : {}),
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.gallery ? { gallery: dto.gallery } : {}),
        ...(typeof dto.isPublished === "boolean"
          ? { isPublished: dto.isPublished }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.event.delete({
      where: { id },
    });
  }

  async publish(id: string, isPublished: boolean) {
    return this.update(id, { isPublished });
  }

  async summary() {
    const [totalEvents, activeEvents, upcomingEvents, expiredEvents] =
      await this.prisma.$transaction([
        this.prisma.event.count(),
        this.prisma.event.count({ where: { isPublished: true } }),
        this.prisma.event.count({
          where: {
            startDate: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.event.count({
          where: {
            endDate: {
              lt: new Date(),
            },
          },
        }),
      ]);

    return {
      totalEvents,
      activeEvents,
      upcomingEvents,
      expiredEvents,
    };
  }

  private validateCoordinates(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException("Latitude and longitude must be valid numbers");
    }
  }

  private ensureRequiredText(value: string, field: string) {
    if (!value || !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }
  }

  private toPrismaEventData(event: EventRecord): Prisma.EventCreateManyInput {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      address: event.address,
      place: event.place,
      floor: event.floor,
      city: event.city,
      latitude: event.latitude,
      longitude: event.longitude,
      bannerImage: event.bannerImage,
      organizer: event.organizer,
      contact: event.contact,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      isPublished: event.isPublished,
      popularity: event.popularity,
      gallery: event.gallery as Prisma.InputJsonValue,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    };
  }
}
