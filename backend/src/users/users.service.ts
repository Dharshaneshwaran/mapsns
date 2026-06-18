import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { Role, type User } from "@prisma/client";

import { seededUsers } from "../common/seed";
import type { UserRecord } from "../common/types";
import { PrismaService } from "../prisma/prisma.service";

type CreateUserInput = Omit<UserRecord, "id" | "createdAt">;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      await this.prisma.user.createMany({
        data: seededUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role as Role,
          createdAt: new Date(user.createdAt),
        })),
      });
    }
  }

  sanitize(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        password: input.password,
        role: input.role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.sanitize(user);
  }
}

