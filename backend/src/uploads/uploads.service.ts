import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadsService {
  buildCloudinaryUrl(fileName: string, folder = "events") {
    const slug = fileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `https://res.cloudinary.com/demo/image/upload/${folder}/${slug}.jpg`;
  }

  uploadBanner(fileName: string) {
    return {
      url: this.buildCloudinaryUrl(fileName, "banners"),
      publicId: `banners/${fileName}`,
    };
  }

  uploadGallery(fileNames: string[]) {
    return fileNames.map((fileName) => ({
      url: this.buildCloudinaryUrl(fileName, "gallery"),
      publicId: `gallery/${fileName}`,
    }));
  }
}

