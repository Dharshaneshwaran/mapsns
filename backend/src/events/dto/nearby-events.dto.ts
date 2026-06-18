import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class NearbyEventsDto {
  @IsNumber()
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Type(() => Number)
  longitude!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  radiusKm!: number;
}

