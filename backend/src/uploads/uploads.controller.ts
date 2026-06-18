import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { File as MulterFile } from "multer";

import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("banner")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  uploadBanner(@UploadedFile() file: MulterFile) {
    return this.uploadsService.uploadBanner(file);
  }

  @Post("gallery")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  uploadGallery(@UploadedFile() file: MulterFile) {
    return this.uploadsService.uploadGallery([file]);
  }

  @Post("image")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  uploadImage(
    @UploadedFile() file: MulterFile,
    @Body() body: { folder?: string },
  ) {
    return this.uploadsService.uploadImage(file, body.folder ?? "events");
  }
}
