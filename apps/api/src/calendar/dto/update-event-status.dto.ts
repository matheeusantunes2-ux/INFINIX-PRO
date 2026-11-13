import { IsIn } from 'class-validator';

export class UpdateEventStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}