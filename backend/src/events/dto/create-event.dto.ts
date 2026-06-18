import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsIn([
    "Tech",
    "Startup",
    "Hackathon",
    "Workshop",
    "College",
    "Sports",
    "Cultural",
    "Music",
    "Business",
  ])
  category!:
    | "Tech"
    | "Startup"
    | "Hackathon"
    | "Workshop"
    | "College"
    | "Sports"
    | "Cultural"
    | "Music"
    | "Business";

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsString()
  city!: string;

  @IsNumber()
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Type(() => Number)
  longitude!: number;

  @IsString()
  bannerImage!: string;

  @IsString()
  organizer!: string;

  @IsString()
  contact!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsArray()
  gallery?: string[];
}
