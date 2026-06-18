import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { File as MulterFile } from "multer";

type UploadResult = {
  url: string;
  publicId: string;
};

@Injectable()
export class UploadsService {
  private readonly bucketName = process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET ?? "sample";
  private readonly publicBaseUrl =
    process.env.R2_PUBLIC_URL ?? "https://pub-7d363aac1a90423aab10f8f8273d71db.r2.dev";
  private readonly folderPrefix = "mapssns";
  private readonly s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:
        process.env.R2_ACCESS_KEY_ID ?? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
      secretAccessKey:
        process.env.R2_SECRET_ACCESS_KEY ?? process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
    },
  });

  private buildObjectKey(fileName: string, folder = "events") {
    const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
    const slug = fileName
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const name = `${slug || "upload"}-${Date.now()}`;

    return `${this.folderPrefix}/${folder}/${name}${extension ? `.${extension}` : ""}`;
  }

  private buildPublicUrl(objectKey: string) {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
  }

  async uploadImage(file: MulterFile, folder = "events"): Promise<UploadResult> {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new InternalServerErrorException("R2 storage is not configured");
    }

    const objectKey = this.buildObjectKey(file.originalname, folder);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: this.buildPublicUrl(objectKey),
      publicId: objectKey,
    };
  }

  uploadBanner(file: MulterFile) {
    return this.uploadImage(file, "banners");
  }

  uploadGallery(files: MulterFile[]) {
    return Promise.all(files.map((file) => this.uploadImage(file, "gallery")));
  }
}
