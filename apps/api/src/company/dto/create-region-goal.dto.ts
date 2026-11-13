import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
export class CreateRegionGoalDto {
  @IsString() @MinLength(2) @MaxLength(120) title!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) target!: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
}
