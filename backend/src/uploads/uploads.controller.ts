import { Body, Controller, Post } from "@nestjs/common";

import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("banner")
  uploadBanner(@Body() body: { fileName: string }) {
    return this.uploadsService.uploadBanner(body.fileName);
  }

  @Post("gallery")
  uploadGallery(@Body() body: { fileNames: string[] }) {
    return this.uploadsService.uploadGallery(body.fileNames);
  }
}

