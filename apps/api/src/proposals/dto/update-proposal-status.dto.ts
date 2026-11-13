import { IsIn } from 'class-validator';

export class UpdateProposalStatusDto {
  @IsIn(['SENT', 'APPROVED', 'REJECTED']) status!: 'SENT' | 'APPROVED' | 'REJECTED';
}